import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { CollaborationService } from './collaborationService.js';

export class SocketService {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.CLIENT_URLS,
        methods: ["GET", "POST"],
        credentials: false
      },
      allowEIO3: true,
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.username} connected`);

      socket.on('join-team', async (teamId) => {
        try {
          const team = await Team.findById(teamId);
          if (!team) {
            socket.emit('error', { message: 'Team not found' });
            return;
          }

          const isMember = team.members.some(member => {
            // member.user 가 populate 되지 않은 경우(ObjectId)와 된 경우 모두 처리
            const memberUserId = member.user && member.user._id
              ? member.user._id.toString()
              : member.user?.toString?.();
            return memberUserId === socket.user._id.toString();
          });
          
          if (!isMember && socket.user.role !== 'ADMIN') {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          socket.join(`team-${teamId}`);
          socket.teamId = teamId;

          const recentMessages = await ChatMessage.find({ teamId })
            .populate('userId', 'username')
            .sort({ createdAt: -1 })
            .limit(50);

          socket.emit('recent-messages', recentMessages.reverse());
          
          socket.to(`team-${teamId}`).emit('user-joined', {
            username: socket.user.username,
            timestamp: new Date()
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to join team' });
        }
      });

      socket.on('send-message', async (data) => {
        try {
          if (!socket.teamId) {
            socket.emit('error', { message: 'Not in a team room' });
            return;
          }

          const message = new ChatMessage({
            teamId: socket.teamId,
            userId: socket.user._id,
            message: data.message,
            messageType: data.messageType || 'text',
            replyTo: data.replyTo || null
          });

          await message.save();
          await message.populate('userId', 'username');

          this.io.to(`team-${socket.teamId}`).emit('new-message', message);

        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('edit-message', async (data) => {
        try {
          const message = await ChatMessage.findById(data.messageId);
          if (!message || message.userId.toString() !== socket.user._id.toString()) {
            socket.emit('error', { message: 'Cannot edit this message' });
            return;
          }

          message.message = data.newMessage;
          message.isEdited = true;
          message.editedAt = new Date();
          await message.save();

          this.io.to(`team-${socket.teamId}`).emit('message-edited', {
            messageId: data.messageId,
            newMessage: data.newMessage,
            editedAt: message.editedAt
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      socket.on('typing-start', () => {
        if (socket.teamId) {
          socket.to(`team-${socket.teamId}`).emit('user-typing', {
            username: socket.user.username,
            isTyping: true
          });
        }
      });

      socket.on('typing-stop', () => {
        if (socket.teamId) {
          socket.to(`team-${socket.teamId}`).emit('user-typing', {
            username: socket.user.username,
            isTyping: false
          });
        }
      });

      socket.on('join-collaboration', async (reportId) => {
        try {
          socket.join(`collab-${reportId}`);
          socket.reportId = reportId;

          const collab = await CollaborationService.initializeCollaboration(reportId, socket.user._id);
          
          socket.emit('collaboration-initialized', {
            content: collab.content,
            version: collab.version,
            collaborators: collab.collaborators
          });

          socket.to(`collab-${reportId}`).emit('collaborator-joined', {
            userId: socket.user._id,
            username: socket.user.username
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to join collaboration' });
        }
      });

      socket.on('apply-operation', async (data) => {
        try {
          if (!socket.reportId) {
            socket.emit('error', { message: 'Not in a collaboration session' });
            return;
          }

          await CollaborationService.applyOperation(
            socket.reportId, 
            socket.user._id, 
            data.operation
          );

        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('cursor-update', async (data) => {
        try {
          if (socket.reportId) {
            await CollaborationService.updateCursor(
              socket.reportId, 
              socket.user._id, 
              data.cursor
            );
          }
        } catch (error) {
          console.error('Cursor update error:', error);
        }
      });

      socket.on('save-report', async () => {
        try {
          if (socket.reportId) {
            await CollaborationService.saveToReport(socket.reportId);
            socket.emit('report-saved');
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to save report' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected`);
        if (socket.teamId) {
          socket.to(`team-${socket.teamId}`).emit('user-left', {
            username: socket.user.username,
            timestamp: new Date()
          });
        }
        if (socket.reportId) {
          CollaborationService.removeCollaborator(socket.reportId, socket.user._id);
        }
      });
    });
  }
}

let socketService = null;

export function initializeSocket(httpServer) {
  socketService = new SocketService(httpServer);
  return socketService;
}

export function getSocketService() {
  return socketService;
}