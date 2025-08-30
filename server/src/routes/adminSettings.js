import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// 시스템 설정 데이터 (임시로 메모리에 저장)
let systemSettings = {
  siteName: 'Team Tracker',
  allowRegistration: true,
  requireApproval: true,
  maxTeamsPerUser: 5,
  reportSubmissionDeadline: 7,
  emailNotifications: true,
  maintenanceMode: false,
  maxFileSize: 10, // MB
  allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'gif'],
  sessionTimeout: 30, // minutes
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  }
};

// 시스템 설정 조회
router.get('/', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    res.json(systemSettings);
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    next(error);
  }
});

// 시스템 설정 업데이트
router.put('/', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const updates = req.body;
    
    // 설정 검증
    if (updates.maxTeamsPerUser && (updates.maxTeamsPerUser < 1 || updates.maxTeamsPerUser > 20)) {
      return res.status(400).json({ error: '팀 최대 생성 수는 1-20 사이여야 합니다.' });
    }
    
    if (updates.reportSubmissionDeadline && (updates.reportSubmissionDeadline < 1 || updates.reportSubmissionDeadline > 30)) {
      return res.status(400).json({ error: '보고서 제출 기한은 1-30일 사이여야 합니다.' });
    }

    if (updates.maxFileSize && (updates.maxFileSize < 1 || updates.maxFileSize > 100)) {
      return res.status(400).json({ error: '파일 최대 크기는 1-100MB 사이여야 합니다.' });
    }

    if (updates.sessionTimeout && (updates.sessionTimeout < 5 || updates.sessionTimeout > 480)) {
      return res.status(400).json({ error: '세션 타임아웃은 5-480분 사이여야 합니다.' });
    }

    // 설정 업데이트
    systemSettings = { ...systemSettings, ...updates };
    
    res.json({ 
      message: '시스템 설정이 업데이트되었습니다.',
      settings: systemSettings
    });
  } catch (error) {
    console.error('Failed to update system settings:', error);
    next(error);
  }
});

// 특정 설정 카테고리 조회
router.get('/category/:category', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { category } = req.params;
    
    switch (category) {
      case 'user':
        res.json({
          allowRegistration: systemSettings.allowRegistration,
          requireApproval: systemSettings.requireApproval,
          maxTeamsPerUser: systemSettings.maxTeamsPerUser,
          passwordPolicy: systemSettings.passwordPolicy
        });
        break;
      case 'system':
        res.json({
          siteName: systemSettings.siteName,
          maintenanceMode: systemSettings.maintenanceMode,
          maxFileSize: systemSettings.maxFileSize,
          allowedFileTypes: systemSettings.allowedFileTypes,
          sessionTimeout: systemSettings.sessionTimeout
        });
        break;
      case 'notification':
        res.json({
          emailNotifications: systemSettings.emailNotifications
        });
        break;
      case 'report':
        res.json({
          reportSubmissionDeadline: systemSettings.reportSubmissionDeadline
        });
        break;
      default:
        res.status(404).json({ error: '잘못된 설정 카테고리입니다.' });
    }
  } catch (error) {
    console.error('Failed to fetch settings category:', error);
    next(error);
  }
});

// 시스템 상태 조회
router.get('/status', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const status = {
      serverStatus: 'online',
      databaseStatus: 'connected',
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      lastRestart: new Date().toISOString(),
      maintenanceMode: systemSettings.maintenanceMode
    };

    res.json(status);
  } catch (error) {
    console.error('Failed to fetch system status:', error);
    next(error);
  }
});

// 시스템 유지보수 모드 토글
router.post('/maintenance', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { enabled } = req.body;
    
    systemSettings.maintenanceMode = Boolean(enabled);
    
    res.json({
      message: `유지보수 모드가 ${enabled ? '활성화' : '비활성화'}되었습니다.`,
      maintenanceMode: systemSettings.maintenanceMode
    });
  } catch (error) {
    console.error('Failed to toggle maintenance mode:', error);
    next(error);
  }
});

export default router;