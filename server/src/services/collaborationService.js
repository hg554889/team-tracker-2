import { ReportCollaboration } from '../models/ReportCollaboration.js';
import { Report } from '../models/Report.js';
import { getSocketService } from './socketService.js';

export class CollaborationService {
  static async initializeCollaboration(reportId, userId, field = 'content') {
    try {
      // 입력 값 검증
      if (!reportId || !userId) {
        throw new Error('Invalid reportId or userId');
      }
      
      const validFields = ['shortTermGoals', 'longTermGoals', 'actionPlans', 'milestones', 'issues', 'content'];
      if (!validFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
      }
      
      let collab = await ReportCollaboration.findOne({ reportId, field });
      
      if (!collab) {
        const report = await Report.findById(reportId);
        if (!report) {
          throw new Error('Report not found');
        }

        collab = new ReportCollaboration({
          reportId,
          field,
          content: report[field] || report.content || '',
          collaborators: [{
            userId,
            joinedAt: new Date(),
            lastActiveAt: new Date(),
            cursor: 0
          }]
        });
        await collab.save();
      } else {
        const existingCollaborator = collab.collaborators.find(
          c => c.userId.toString() === userId.toString()
        );

        if (!existingCollaborator) {
          collab.collaborators.push({
            userId,
            joinedAt: new Date(),
            lastActiveAt: new Date(),
            cursor: 0
          });
        } else {
          existingCollaborator.lastActiveAt = new Date();
        }
        await collab.save();
      }

      return collab;
    } catch (error) {
      console.error('Initialize collaboration error:', error);
      throw error;
    }
  }

  static async applyOperation(reportId, userId, operation, field = 'content') {
    try {
      // 입력 값 검증
      if (!reportId || !userId || !operation) {
        throw new Error('Invalid input parameters');
      }
      
      if (!['insert', 'delete', 'replace'].includes(operation.type)) {
        throw new Error(`Invalid operation type: ${operation.type}`);
      }
      
      const collab = await ReportCollaboration.findOne({ reportId, field });
      if (!collab) {
        throw new Error('Collaboration session not found');
      }

      if (collab.isLocked && collab.lockedBy.toString() !== userId.toString()) {
        throw new Error('Document is locked by another user');
      }

      let newContent = collab.content;
      
      switch (operation.type) {
        case 'insert':
          newContent = newContent.slice(0, operation.position) + 
                      operation.content + 
                      newContent.slice(operation.position);
          break;
          
        case 'delete':
          newContent = newContent.slice(0, operation.position) + 
                      newContent.slice(operation.position + operation.length);
          break;
          
        case 'replace':
          newContent = newContent.slice(0, operation.position) + 
                      operation.content + 
                      newContent.slice(operation.position + operation.length);
          break;
      }

      // 내용 길이 검증 (100KB 제한)
      if (newContent.length > 100000) {
        throw new Error('Content too large (max 100KB)');
      }
      
      if (operation.position < 0 || operation.position > collab.content.length) {
        throw new Error('Invalid operation position');
      }
      
      collab.content = newContent;
      collab.version += 1;
      
      collab.operations.push({
        userId,
        operation,
        timestamp: new Date()
      });

      // operations 배열 크기 제한 및 최적화 (500개 제한, 250개로 정리)
      if (collab.operations.length > 500) {
        collab.operations = collab.operations.slice(-250);
      }

      await collab.save();

      const socketService = getSocketService();
      if (socketService && socketService.io) {
        socketService.io.to(`collab-${reportId}-${field}`).emit('operation-applied', {
          operation,
          version: collab.version,
          content: newContent,
          userId,
          field
        });
      }

      return collab;
    } catch (error) {
      console.error(`Apply operation error for reportId: ${reportId}, field: ${field}:`, error);
      
      // 데이터베이스 오류 vs 비즈니스 로직 오류 구분
      if (error.name === 'ValidationError' || error.name === 'CastError') {
        throw new Error('Database validation error');
      }
      
      throw error;
    }
  }

  static async updateCursor(reportId, userId, cursor, field = 'content') {
    try {
      const collab = await ReportCollaboration.findOne({ reportId, field });
      if (!collab) return;

      const collaborator = collab.collaborators.find(
        c => c.userId.toString() === userId.toString()
      );

      if (collaborator) {
        collaborator.cursor = cursor;
        collaborator.lastActiveAt = new Date();
        await collab.save();

        const socketService = getSocketService();
        if (socketService && socketService.io) {
          socketService.io.to(`collab-${reportId}-${field}`).emit('cursor-update', {
            userId,
            cursor,
            field
          });
        }
      }
    } catch (error) {
      console.error('Update cursor error:', error);
    }
  }

  static async removeCollaborator(reportId, userId, field = 'content') {
    try {
      const collab = await ReportCollaboration.findOne({ reportId, field });
      if (!collab) return;

      collab.collaborators = collab.collaborators.filter(
        c => c.userId.toString() !== userId.toString()
      );
      
      if (collab.isLocked && collab.lockedBy.toString() === userId.toString()) {
        collab.isLocked = false;
        collab.lockedBy = null;
      }

      await collab.save();

      const socketService = getSocketService();
      if (socketService && socketService.io) {
        socketService.io.to(`collab-${reportId}-${field}`).emit('collaborator-left', {
          userId,
          field
        });
      }
    } catch (error) {
      console.error('Remove collaborator error:', error);
    }
  }

  static async saveToReport(reportId, field = 'content') {
    try {
      const collab = await ReportCollaboration.findOne({ reportId, field });
      if (!collab) {
        throw new Error('Collaboration session not found');
      }

      const updateData = { updatedAt: new Date() };
      updateData[field] = collab.content;
      
      await Report.findByIdAndUpdate(reportId, updateData);

      return true;
    } catch (error) {
      console.error('Save to report error:', error);
      throw error;
    }
  }
}