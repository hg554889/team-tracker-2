import { Router } from 'express';
import { z } from 'zod';
import { Report } from '../models/Report.js';
import { Team } from '../models/Team.js';
import { validate } from '../middleware/validate.js';
import { requireClubAccess, validateReportAccess } from '../middleware/clubAccess.js';
import { reportCreateSchema, commentCreateSchema } from '../validators/reports.js';
import { requireAuth } from '../middleware/auth.js';
import { Roles } from '../utils/roles.js';

const router = Router();

// Date.parse 가능한 문자열 허용
const dateLike = z.string().min(1).refine(v => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

const createBody = z.object({
  teamId: z.string().min(1),
  weekOf: dateLike,
  progress: z.coerce.number().min(0).max(100),
  // 새로운 보고서 형식
  goals: z.string().default(''), // 주간 목표 및 기간 (하위 호환)
  progressDetails: z.string().default(''), // 진행 내역
  achievements: z.string().default(''), // 주요 성과
  completedTasks: z.string().default(''), // 완료 업무
  incompleteTasks: z.string().default(''), // 미완료 업무
  issues: z.string().default(''), // 이슈 및 고민사항
  nextWeekPlans: z.string().default(''), // 다음주 계획
  dueAt: dateLike.optional(),
  attachments: z.array(z.any()).optional(),
  // 하위 호환성을 위한 기존 필드들
  shortTermGoals: z.string().default(''),
  actionPlans: z.string().default(''),
  milestones: z.string().default(''),
});

function toDateOrNull(v){ if(!v) return null; const d=new Date(v); return Number.isNaN(d.getTime())?null:d; }

// 생성/업서트
router.post('/', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error:'ValidationError', details:parsed.error.flatten() });
    const { teamId, weekOf, progress, goals, progressDetails, achievements, completedTasks, incompleteTasks, issues, nextWeekPlans, dueAt, attachments, shortTermGoals, actionPlans, milestones } = parsed.data;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'TeamNotFound' });

    const { id: userId, role, clubId: userClubId } = req.user;
    
    // 동아리 접근 권한 확인
    if (role !== Roles.ADMIN && team.clubId !== userClubId) {
      return res.status(403).json({ error: 'ClubAccessDenied' });
    }
    
    // 팀 멤버십 확인 (EXECUTIVE는 예외)
    const isMember = (team.members || []).some(m => m?.user?.toString() === userId);
    if (role !== Roles.ADMIN && role !== Roles.EXECUTIVE && !isMember) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const weekDate = toDateOrNull(weekOf);
    const dueDate  = toDateOrNull(dueAt);
    if (!weekDate) return res.status(400).json({ error: 'InvalidWeekOf' });

    // 항상 새로운 보고서 생성
    const report = new Report({
      team: teamId,
      author: userId,
      weekOf: weekDate,
      clubId: team.clubId,
      progress,
      goals,
      progressDetails,
      achievements,
      completedTasks,
      incompleteTasks,
      issues,
      nextWeekPlans,
      dueAt: dueDate || undefined,
      // 하위 호환성을 위한 기존 필드들
      shortTermGoals,
      actionPlans,
      milestones,
      ...(attachments && { attachments })
    });

    await report.save();

    res.status(201).json(report);
  } catch (e) { next(e); }
});

// (추가) 마감 임박 보고서
router.get('/due-soon', requireAuth, async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(14, Number(req.query.days || 3)));
    const scope = req.query.scope || 'mine'; // 'mine' | 'club' | 'global'
    const now = new Date();
    const until = new Date(Date.now() + days*24*3600*1000);

    let teamQuery = {};
    if (scope === 'global' && req.user.role === Roles.ADMIN) {
      if (req.query.clubId) teamQuery.clubId = req.query.clubId;
    } else if (scope === 'club' && (req.user.role === Roles.ADMIN || req.user.role === Roles.EXECUTIVE)) {
      teamQuery.clubId = req.user.clubId;
    } else {
      teamQuery = { 'members.user': req.user.id };
    }

    const teams = await Team.find(teamQuery);
    const teamIds = teams.map(t => t._id);

    const items = await Report.find({
      team: { $in: teamIds },
      dueAt: { $gte: now, $lte: until }
    }).sort({ dueAt: 1 });

    // 프론트 편의를 위한 매핑 (팀명/담당자)
    const teamMap = new Map(teams.map(t => [String(t._id), t]));
    const response = items.map(r => ({
      teamId: r.team,
      teamName: teamMap.get(String(r.team))?.name || '(팀)',
      dueAt: r.dueAt,
      assignee: '' // 필요 시 author populate
    }));

    res.json(response);
  } catch (e) { next(e); }
});

// 팀별 목록 (권한 체크 강화)
router.get('/team/:teamId', requireAuth, async (req, res, next) => {
  try {
    const teamId = req.params.teamId;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'TeamNotFound' });

    const { id: userId, role, clubId: userClubId } = req.user;
    
    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 모든 LEADER/MEMBER
    let hasAccess = false;
    if (role === Roles.ADMIN) {
      hasAccess = true;
    } else if (role === Roles.EXECUTIVE && team.clubId === userClubId) {
      hasAccess = true;
    } else {
      // LEADER/MEMBER는 모든 팀 보고서 조회 가능
      hasAccess = true;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const items = await Report.find({ team: teamId }).sort({ weekOf: -1 });
    res.json(items);
  } catch (e) { next(e); }
});

// 전체/팀별 목록 (페이징) - 미제출 팀 정보 포함
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, teamId, from, to, status, weekOf, includeEmpty } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));
    const skip = (p - 1) * l;

    let allowedTeamIds = [];
    let allowedTeams = [];
    const { role, clubId: userClubId, id: userId } = req.user;

    if (role === Roles.ADMIN) {
      if (teamId) {
        const team = await Team.findById(teamId);
        if (team) {
          allowedTeamIds = [teamId];
          allowedTeams = [team];
        }
      } else {
        allowedTeams = await Team.find({});
        allowedTeamIds = allowedTeams.map(t => t._id);
      }
    } else if (role === Roles.EXECUTIVE) {
      // EXECUTIVE는 본인 동아리 모든 팀
      const clubTeams = await Team.find({ clubId: userClubId });
      if (teamId) {
        const requestedTeam = clubTeams.find(t => t._id.toString() === teamId);
        if (requestedTeam) {
          allowedTeamIds = [teamId];
          allowedTeams = [requestedTeam];
        } else {
          return res.status(403).json({ error: 'Forbidden' });
        }
      } else {
        allowedTeams = clubTeams;
        allowedTeamIds = clubTeams.map(t => t._id);
      }
    } else {
      // LEADER/MEMBER는 모든 팀의 보고서 조회 가능
      if (teamId) {
        const team = await Team.findById(teamId);
        if (team) {
          allowedTeamIds = [teamId];
          allowedTeams = [team];
        }
      } else {
        allowedTeams = await Team.find({});
        allowedTeamIds = allowedTeams.map(t => t._id);
      }
    }

    // allowedTeamIds가 빈 배열이면 빈 결과 반환
    if (allowedTeamIds.length === 0) {
      return res.json({
        items: [],
        page: p,
        limit: l,
        total: 0,
        summary: null
      });
    }

    // 날짜 범위 설정
    let targetWeek = null;
    if (weekOf) {
      // HTML5 week input 형식 (2025-W39) 처리 - ISO 8601 표준
      if (weekOf.includes('-W')) {
        const [year, weekStr] = weekOf.split('-W');
        const weekNum = parseInt(weekStr);

        // ISO 8601 Week 계산
        // 1월 4일이 속한 주가 해당 연도의 첫 번째 주
        const jan4 = new Date(parseInt(year), 0, 4);
        const jan4Day = jan4.getDay(); // 0=일, 1=월, ..., 6=토

        // 첫 번째 주의 월요일 찾기
        const firstWeekMonday = new Date(jan4);
        const daysFromMonday = jan4Day === 0 ? 6 : jan4Day - 1; // 일요일=0을 6으로, 나머지는 -1
        firstWeekMonday.setDate(jan4.getDate() - daysFromMonday);

        // 지정된 주차의 월요일 계산
        targetWeek = new Date(firstWeekMonday);
        targetWeek.setDate(firstWeekMonday.getDate() + (weekNum - 1) * 7);
      } else {
        // 일반 날짜 형식 처리
        targetWeek = new Date(weekOf);
      }

      // Invalid date 체크
      if (isNaN(targetWeek.getTime())) {
        return res.status(400).json({ error: 'InvalidWeekOf' });
      }
    }

    let dateQuery = {};
    if (targetWeek) {
      // 특정 주차의 보고서 조회
      const weekStart = new Date(targetWeek);
      const weekEnd = new Date(targetWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      dateQuery = { $gte: weekStart, $lt: weekEnd };
    } else if (from || to) {
      // 일반적인 날짜 범위 필터
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          dateQuery.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          dateQuery.$lte = toDate;
        }
      }
    }

    const q = { team: { $in: allowedTeamIds } };
    if (Object.keys(dateQuery).length > 0) {
      q.weekOf = dateQuery;
    }

    // 미제출 팀 정보 포함 여부 결정
    const shouldIncludeMissing = includeEmpty === 'true' || status === 'missing' || status === 'all';

    if (!shouldIncludeMissing) {
      // 기존 로직: 제출된 보고서만
      const [items, total] = await Promise.all([
        Report.find(q).sort({ weekOf: -1 }).skip(skip).limit(l).populate('team', 'name'),
        Report.countDocuments(q),
      ]);

      return res.json({ items, page: p, limit: l, total });
    }

    // 미제출 팀 정보 포함 로직
    const reports = await Report.find(q).sort({ weekOf: -1 }).populate('team', 'name');

    let allItems = [];

    if (targetWeek) {
      // 특정 주차에 대한 팀별 제출 현황
      const reportedTeamIds = new Set(reports.map(r => r.team._id.toString()));

      // 제출된 보고서들
      const submittedReports = reports.filter(r => {
        if (status === 'submitted') return true;
        if (status === 'missing') return false;
        return true; // status === 'all'
      });

      // 미제출 팀들
      const missingTeams = allowedTeams.filter(team =>
        !reportedTeamIds.has(team._id.toString())
      );

      if (status !== 'submitted') {
        // 각 미제출 팀의 마지막 제출일 찾기
        const missingTeamItems = await Promise.all(
          missingTeams.map(async (team) => {
            const lastReport = await Report.findOne({
              team: team._id
            }).sort({ weekOf: -1 });

            // 주차 종료일 (일요일) 기준으로 지연 일수 계산
            let daysMissing = 0;
            if (targetWeek) {
              const weekEnd = new Date(targetWeek.getTime() + 7 * 24 * 60 * 60 * 1000); // 해당 주차 종료일
              const now = new Date();
              if (now > weekEnd) {
                daysMissing = Math.floor((now - weekEnd) / (1000 * 60 * 60 * 24));
              }
            }

            return {
              _id: null,
              team: {
                _id: team._id,
                name: team.name
              },
              teamName: team.name,
              status: 'missing',
              weekOf: targetWeek,
              lastSubmissionDate: lastReport ? lastReport.weekOf : null,
              daysMissing: Math.max(0, daysMissing),
              progress: 0,
              isMissingTeam: true
            };
          })
        );

        if (status === 'missing') {
          allItems = missingTeamItems;
        } else {
          allItems = [...submittedReports, ...missingTeamItems];
        }
      } else {
        allItems = submittedReports;
      }

      // 정렬: 미제출 팀들을 위에, 제출된 팀들을 아래에
      allItems.sort((a, b) => {
        if (a.isMissingTeam && !b.isMissingTeam) return -1;
        if (!a.isMissingTeam && b.isMissingTeam) return 1;
        if (a.isMissingTeam && b.isMissingTeam) {
          return (b.daysMissing || 0) - (a.daysMissing || 0); // 더 오래된 것부터
        }
        return new Date(b.weekOf) - new Date(a.weekOf);
      });

    } else {
      // 일반적인 보고서 목록 (기존 로직)
      allItems = reports;
    }

    // 페이징 적용
    const total = allItems.length;
    const paginatedItems = allItems.slice(skip, skip + l);

    // 통계 정보 계산
    const summary = targetWeek ? {
      totalTeams: allowedTeams.length,
      submittedCount: allItems.filter(item => !item.isMissingTeam).length,
      missingCount: allItems.filter(item => item.isMissingTeam).length,
      submissionRate: allowedTeams.length > 0 ?
        Math.round((allItems.filter(item => !item.isMissingTeam).length / allowedTeams.length) * 100) : 0,
      targetWeek: targetWeek.toISOString()
    } : null;

    res.json({
      items: paginatedItems,
      page: p,
      limit: l,
      total,
      summary
    });
  } catch (e) {
    console.error('Reports list error:', e);
    next(e);
  }
});

// 단건 조회 (댓글 작성자 이름 포함) - EXECUTIVE 권한 추가
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id)
      .populate('comments.author', 'username')
      .populate('team', 'name');
    
    if (!r) return res.status(404).json({ error: 'NotFound' });

    const { id: userId, role, clubId: userClubId } = req.user;

    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 모든 LEADER/MEMBER
    let hasAccess = false;
    
    if (role === Roles.ADMIN) {
      hasAccess = true;
    } else if (role === Roles.EXECUTIVE && r.clubId === userClubId) {
      hasAccess = true;
    } else {
      // LEADER/MEMBER는 모든 보고서 조회 가능
      hasAccess = true;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(r);
  } catch (e) { 
    console.error('Report get error:', e);
    next(e); 
  }
});

// 수정 (ADMIN, EXECUTIVE, 작성자, 또는 리더)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'NotFound' });

    const team = await Team.findById(r.team);
    const { id: userId, role, clubId: userClubId } = req.user;
    
    const isLeader = team?.leader?.toString() === userId;
    const isAuthor = r.author.toString() === userId;
    const isExecutiveInSameClub = (role === Roles.EXECUTIVE && r.clubId === userClubId);
    
    if (!(role === Roles.ADMIN || isExecutiveInSameClub || isLeader || isAuthor)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const up = {};
    if (req.body.progress !== undefined) up.progress = Number(req.body.progress);
    if (req.body.goals !== undefined) up.goals = req.body.goals;
    if (req.body.progressDetails !== undefined) up.progressDetails = req.body.progressDetails;
    if (req.body.achievements !== undefined) up.achievements = req.body.achievements;
    if (req.body.completedTasks !== undefined) up.completedTasks = req.body.completedTasks;
    if (req.body.incompleteTasks !== undefined) up.incompleteTasks = req.body.incompleteTasks;
    if (req.body.issues !== undefined) up.issues = req.body.issues;
    if (req.body.nextWeekPlans !== undefined) up.nextWeekPlans = req.body.nextWeekPlans;
    // 하위 호환성을 위한 기존 필드들
    if (req.body.shortTermGoals !== undefined) up.shortTermGoals = req.body.shortTermGoals;
    if (req.body.actionPlans !== undefined) up.actionPlans = req.body.actionPlans;
    if (req.body.milestones !== undefined) up.milestones = req.body.milestones;
    if (req.body.dueAt) up.dueAt = new Date(req.body.dueAt);

    const updated = await Report.findByIdAndUpdate(req.params.id, up, { new: true });
    res.json(updated);
  } catch (e) { 
    console.error('Report update error:', e);
    next(e); 
  }
});

// 코멘트 작성 (EXECUTIVE 권한 추가)
router.post('/:id/comments', requireAuth, validate(commentCreateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const { id: userId, role, clubId: userClubId } = req.user;

    const report = await Report.findById(id).populate({ path: 'team', select: 'members' });
    if (!report) return res.status(404).json({ error: 'ReportNotFound' });

    let canComment = false;
    
    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 모든 LEADER/MEMBER
    if (role === Roles.ADMIN) {
      canComment = true;
    } else if (role === Roles.EXECUTIVE && report.clubId === userClubId) {
      canComment = true;
    } else {
      // LEADER/MEMBER는 모든 보고서에 코멘트 가능
      canComment = true;
    }
    
    if (!canComment) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // author 필드 사용
    report.comments.push({ author: userId, text, createdAt: new Date() });
    await report.save();

    // populate 수정
    const populated = await Report.findById(report._id)
      .select('comments')
      .populate('comments.author', 'username');
    const created = populated.comments[populated.comments.length - 1];

    res.status(201).json(created);
  } catch (e) {
    console.error('[comments.post] ', e);
    next(e);
  }
});

// 코멘트 목록 (EXECUTIVE 권한 추가)
router.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role, clubId: userClubId } = req.user;
    
    const report = await Report.findById(id)
      .select('comments team clubId')
      .populate('comments.author', 'username')
      .populate({ path: 'team', select: 'members' });

    if (!report) return res.status(404).json({ error: 'ReportNotFound' });

    let canViewComments = false;
    
    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 모든 LEADER/MEMBER
    if (role === Roles.ADMIN) {
      canViewComments = true;
    } else if (role === Roles.EXECUTIVE && report.clubId === userClubId) {
      canViewComments = true;
    } else {
      // LEADER/MEMBER는 모든 보고서 코멘트 조회 가능
      canViewComments = true;
    }
    
    if (!canViewComments) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(report.comments || []);
  } catch (e) {
    console.error('[comments.get] ', e);
    next(e);
  }
});

// 삭제 (ADMIN, EXECUTIVE, 작성자, 또는 리더)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'NotFound' });

    const team = await Team.findById(r.team);
    const { id: userId, role, clubId: userClubId } = req.user;
    
    const isLeader = team?.leader?.toString() === userId;
    const isAuthor = r.author.toString() === userId;
    const isExecutiveInSameClub = (role === Roles.EXECUTIVE && r.clubId === userClubId);
    
    if (!(role === Roles.ADMIN || isExecutiveInSameClub || isLeader || isAuthor)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (e) { 
    console.error('Report delete error:', e);
    next(e); 
  }
});

// 일괄 미제출 알림 발송
router.post('/send-bulk-reminders', requireAuth, async (req, res, next) => {
  try {
    const { teamIds, weekOf } = req.body;
    const { role, clubId: userClubId, id: userId } = req.user;

    // 권한 확인: ADMIN 또는 EXECUTIVE만 가능
    if (role !== Roles.ADMIN && role !== Roles.EXECUTIVE) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ error: 'TeamIds required' });
    }

    // 팀 정보 조회 및 권한 확인
    const teams = await Team.find({ _id: { $in: teamIds } }).populate('leader', 'username email');

    if (role === Roles.EXECUTIVE) {
      // EXECUTIVE는 자신의 동아리 팀들만
      const unauthorizedTeams = teams.filter(team => team.clubId !== userClubId);
      if (unauthorizedTeams.length > 0) {
        return res.status(403).json({ error: 'Forbidden: Cannot send alerts to other club teams' });
      }
    }

    const notifications = [];
    const weekStr = weekOf ? new Date(weekOf).toLocaleDateString('ko-KR') : '이번 주';

    for (const team of teams) {
      if (team.leader) {
        // 실제 알림 시스템이 있다면 여기서 발송
        // 예시: await sendEmail(team.leader.email, subject, message);
        // 예시: await createNotification(team.leader._id, message);

        notifications.push({
          teamId: team._id,
          teamName: team.name,
          leaderName: team.leader.username,
          leaderEmail: team.leader.email,
          message: `[미제출 알림] ${team.name} 팀의 ${weekStr} 주차 보고서가 미제출되었습니다. 빠른 시일 내에 제출해주시기 바랍니다.`,
          sentAt: new Date(),
          method: 'system_notification' // 현재는 시스템 내 알림만
        });
      }
    }

    // TODO: 실제 알림 발송 로직
    // - 이메일 발송 (nodemailer 등)
    // - 시스템 내 알림 (Notification 모델)
    // - 푸시 알림
    // - 슬랙/디스코드 웹훅

    // 현재는 로그만 남김
    console.log(`Bulk reminders sent to ${notifications.length} teams:`,
      notifications.map(n => ({ team: n.teamName, leader: n.leaderName }))
    );

    res.json({
      success: true,
      sentCount: notifications.length,
      notifications: notifications.map(n => ({
        teamName: n.teamName,
        leaderName: n.leaderName,
        message: n.message,
        sentAt: n.sentAt
      }))
    });
  } catch (e) {
    console.error('Bulk reminder error:', e);
    next(e);
  }
});

export default router;
