import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';
import { enrichRole } from './middleware/enrichRole.js';
import { requireApproval } from './middleware/approvalCheck.js';
import { initializeSocket } from './services/socketService.js';

// ✅ 모든 라우터 import (clubSettings, roleRequests 추가)
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import teamRoutes from './routes/teams.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import clubRoutes from './routes/clubs.js';
import inviteRoutes from './routes/invites.js';
import aiRoutes from './routes/ai.js';
import approvalRoutes from './routes/approvals.js';
import roleRequestRoutes from './routes/roleRequests.js'; // ✅ 추가된 import
import clubSettingsRoutes from './routes/clubSettings.js'; // ✅ 추가된 import
import teamJoinRequestRoutes from './routes/teamJoinRequests.js';
import predictionRoutes from './routes/predictions.js';
import inquiryRoutes from './routes/inquiries.js';
import teamIssueRoutes from './routes/teamIssues.js';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(morgan('dev'));

// 멀티 오리진 CORS 설정
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman 등 허용
    return env.CLIENT_URLS.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: false,
}));
app.options('*', cors());

app.use(express.json());

// 정적 파일 제공
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ========== 라우터 설정 ==========

// Public routes (인증 불필요)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/invites', inviteRoutes);

// Protected routes (인증 필요)
app.use('/api', requireAuth, enrichRole);

// 승인 관련 엔드포인트 (승인 확인 불필요)
app.use('/api/approvals', approvalRoutes);

// 승인이 필요한 다른 엔드포인트들
app.use('/api', requireApproval);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/role-requests', roleRequestRoutes); // ✅ roleRequests 라우터 등록
app.use('/api/club-settings', clubSettingsRoutes); // ✅ clubSettings 라우터 등록
app.use('/api/team-join-requests', teamJoinRequestRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/team-issues', teamIssueRoutes);

// Error handler
app.use(errorHandler);

// ========== 서버 시작 ==========
connectDB().then(async () => {
  // 데이터베이스 정리 작업
  try {
    const { cleanupClubData } = await import('./utils/cleanupClubs.js');
    await cleanupClubData();
  } catch (error) {
    console.warn('[CLEANUP] Club cleanup failed:', error.message);
  }
  
  initializeSocket(httpServer);
  
  httpServer.listen(env.PORT, () => {
    console.log(`[API] Server listening on port :${env.PORT}`);
    console.log('[CORS] Allowed origins:', env.CLIENT_URLS.join(', '));
    console.log('[Socket] Socket.io initialized');
  });
}).catch(error => {
  console.error('[DB] Connection failed:', error);
  process.exit(1);
});