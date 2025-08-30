import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Club } from '../models/Club.js';
import { ClubSettings } from '../models/ClubSettings.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';

const router = Router();

// 모든 동아리 목록 조회
router.get('/', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    
    // 각 동아리의 멤버 수와 팀 수 계산
    const clubsWithStats = await Promise.all(
      clubs.map(async (club) => {
        const memberCount = await User.countDocuments({ clubId: club.key });
        const teamCount = await Team.countDocuments({ clubId: club.key });
        
        return {
          _id: club._id,
          key: club.key,
          name: club.name,
          memberCount,
          teamCount,
          createdAt: club.createdAt || new Date()
        };
      })
    );

    res.json(clubsWithStats);
  } catch (error) {
    console.error('Failed to fetch clubs:', error);
    next(error);
  }
});

// 새 동아리 생성
router.post('/', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { name, description = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '동아리 이름이 필요합니다.' });
    }

    // 동아리 키 생성 (이름에서 공백 제거하고 소문자로)
    const key = name.toLowerCase().replace(/\s+/g, '');
    
    // 중복 키 확인
    const existingClub = await Club.findOne({ key });
    if (existingClub) {
      return res.status(409).json({ error: '이미 존재하는 동아리입니다.' });
    }

    // 동아리 생성
    const club = await Club.create({ key, name });

    // 동아리 설정 초기화
    await ClubSettings.create({
      clubId: key,
      name,
      description
    });

    res.status(201).json({
      _id: club._id,
      key: club.key,
      name: club.name,
      memberCount: 0,
      teamCount: 0,
      createdAt: club.createdAt
    });
  } catch (error) {
    console.error('Failed to create club:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: '이미 존재하는 동아리입니다.' });
    }
    next(error);
  }
});

// 특정 동아리 정보 조회
router.get('/:clubId', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { clubId } = req.params;
    
    const club = await Club.findOne({ key: clubId });
    if (!club) {
      return res.status(404).json({ error: '동아리를 찾을 수 없습니다.' });
    }

    const clubSettings = await ClubSettings.findOne({ clubId });
    const memberCount = await User.countDocuments({ clubId });
    const teamCount = await Team.countDocuments({ clubId });

    res.json({
      _id: club._id,
      key: club.key,
      name: club.name,
      description: clubSettings?.description || '',
      memberCount,
      teamCount,
      settings: clubSettings?.settings || {},
      theme: clubSettings?.theme || {},
      createdAt: club.createdAt
    });
  } catch (error) {
    console.error('Failed to fetch club:', error);
    next(error);
  }
});

// 동아리 정보 수정
router.put('/:clubId', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { name, description, settings } = req.body;

    const club = await Club.findOne({ key: clubId });
    if (!club) {
      return res.status(404).json({ error: '동아리를 찾을 수 없습니다.' });
    }

    // 동아리 이름 업데이트
    if (name) {
      await Club.findByIdAndUpdate(club._id, { name });
    }

    // 동아리 설정 업데이트
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings) updateData.settings = settings;

    await ClubSettings.findOneAndUpdate(
      { clubId },
      updateData,
      { upsert: true, new: true }
    );

    res.json({ message: '동아리 정보가 업데이트되었습니다.' });
  } catch (error) {
    console.error('Failed to update club:', error);
    next(error);
  }
});

// 동아리 삭제
router.delete('/:clubId', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findOne({ key: clubId });
    if (!club) {
      return res.status(404).json({ error: '동아리를 찾을 수 없습니다.' });
    }

    // 동아리에 속한 사용자가 있는지 확인
    const memberCount = await User.countDocuments({ clubId });
    if (memberCount > 0) {
      return res.status(400).json({ error: '동아리에 속한 멤버가 있어 삭제할 수 없습니다.' });
    }

    // 동아리 삭제
    await Club.findByIdAndDelete(club._id);
    await ClubSettings.findOneAndDelete({ clubId });

    res.json({ message: '동아리가 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete club:', error);
    next(error);
  }
});

export default router;