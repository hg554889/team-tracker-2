import { ReportCollaboration } from '../models/ReportCollaboration.js';
import { Report } from '../models/Report.js';
import { getSocketService } from './socketService.js';

export class CollaborationService {
  static async initializeCollaboration(reportId, userId) {
    try {
      let collab = await ReportCollaboration.findOne({ reportId });
      
      if (!collab) {
        const report = await Report.findById(reportId);
        if (!report) {
          throw new Error('Report not found');
        }

        collab = new ReportCollaboration({
          reportId,
          content: report.content || '',
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

  static async applyOperation(reportId, userId, operation) {
    try {
      const collab = await ReportCollaboration.findOne({ reportId });
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

      collab.content = newContent;
      collab.version += 1;
      
      collab.operations.push({
        userId,
        operation,
        timestamp: new Date()
      });

      if (collab.operations.length > 1000) {
        collab.operations = collab.operations.slice(-500);
      }

      await collab.save();

      const socketService = getSocketService();
      if (socketService && socketService.io) {
        socketService.io.to(`collab-${reportId}`).emit('operation-applied', {
          operation,
          version: collab.version,
          content: newContent,
          userId
        });
      }

      return collab;
    } catch (error) {
      console.error('Apply operation error:', error);
      throw error;
    }
  }

  static async updateCursor(reportId, userId, cursor) {
    try {
      const collab = await ReportCollaboration.findOne({ reportId });
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
          socketService.io.to(`collab-${reportId}`).emit('cursor-update', {
            userId,
            cursor
          });
        }
      }
    } catch (error) {
      console.error('Update cursor error:', error);
    }
  }

  static async removeCollaborator(reportId, userId) {
    try {
      const collab = await ReportCollaboration.findOne({ reportId });
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
        socketService.io.to(`collab-${reportId}`).emit('collaborator-left', {
          userId
        });
      }
    } catch (error) {
      console.error('Remove collaborator error:', error);
    }
  }

  static async saveToReport(reportId) {
    try {
      const collab = await ReportCollaboration.findOne({ reportId });
      if (!collab) {
        throw new Error('Collaboration session not found');
      }

      await Report.findByIdAndUpdate(reportId, {
        content: collab.content,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Save to report error:', error);
      throw error;
    }
  }
}