import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';
import { enrichRole } from './middleware/enrichRole.js';
import { requireApproval } from './middleware/approvalCheck.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import teamRoutes from './routes/teams.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import clubRoutes from './routes/clubs.js';
import inviteRoutes from './routes/invites.js';
import aiRoutes from './routes/ai.js';

const app = express();

app.use(helmet());
// 멀티 오리진 CORS (ENV: CLIENT_URL=URL1,URL2)
app.use(cors({
  origin(origin, cb){
    if (!origin) return cb(null, true); // Postman 등
    return env.CLIENT_URLS.includes(origin) ? cb(null,true) : cb(new Error('Not allowed by CORS'));
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: false,
}));
app.options('*', cors());

app.use(express.json());

// 정적 업로드 제공
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Public
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/invites', inviteRoutes);

// Protected (최신 역할 동기화)
app.use('/api', requireAuth, enrichRole);

// Approval endpoints (no approval check needed)
app.use('/api/approvals', approvalRoutes);

// Other protected endpoints (require approval)
app.use('/api', requireApproval);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Error handler
app.use(errorHandler);

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`[API] listening on :${env.PORT}`);
    console.log('[CORS] allowed:', env.CLIENT_URLS.join(', '));
  });
});