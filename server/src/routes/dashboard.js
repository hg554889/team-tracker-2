import { Router } from 'express';
import { Report } from '../models/Report.js';
import { Team } from '../models/Team.js';
import { requireAuth } from '../middleware/auth.js';
import { Roles } from '../utils/roles.js';

const router = Router();

/**
 * KPI + DueSoon(요약) + myTeamsProgress(간단)
 * ADMIN: clubId 쿼리로 특정 동아리 필터 가능
 * EXECUTIVE: 자신의 clubId로 제한
 * LEADER/MEMBER: 본인 팀들만
 */
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const role = req.user.role;
    const meId = req.user.id;
    const clubIdParam = req.query.clubId;
    const scope = req.query.scope; // 'global' | 'club' | 'mine' (선택)

    let teams = [];
    if (role === Roles.ADMIN) {
      teams = await Team.find(clubIdParam ? { clubId: clubIdParam } : {});
    } else if (role === Roles.EXECUTIVE) {
      teams = await Team.find({ clubId: req.user.clubId });
    } else {
      teams = await Team.find({ 'members.user': meId });
    }

    const teamIds = teams.map(t => t._id);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 대략 주 시작(일)

    const reportsThisWeek = await Report.find({ team: { $in: teamIds }, weekOf: { $gte: startOfWeek } });
    const avgByTeam = await Report.aggregate([
      { $match: { team: { $in: teamIds } } },
      { $group: { _id: '$team', avgProgress: { $avg: '$progress' } } }
    ]);

    const dueSoon = await Report.find({
      team: { $in: teamIds },
      dueAt: { $gte: now, $lte: new Date(Date.now() + 3*24*3600*1000) }
    }).sort({ dueAt: 1 });

    const kpi = {};
    if (role === Roles.ADMIN || role === Roles.EXECUTIVE) {
      kpi.teams = teams.length;
      kpi.activeTeams = teams.filter(t => t.status === 'ACTIVE').length;
      kpi.avgProgress = Math.round((avgByTeam.reduce((a,c)=>a+(c.avgProgress||0),0) / Math.max(1, avgByTeam.length))*10)/10 || 0;
      const teamWeeks = await Report.aggregate([
        { $match: { team: { $in: teamIds }, weekOf: { $gte: startOfWeek } } },
        { $group: { _id: '$team', count: { $sum: 1 } } }
      ]);
      const submittedCount = teamWeeks.length;
      const totalTeams = teams.length || 1;
      kpi.submitRateThisWeek = Math.round((submittedCount/totalTeams)*100);
      if (role === Roles.EXECUTIVE) {
        // 대략적인 멤버 수 추정 (중복 제외)
        const members = new Set();
        teams.forEach(t => (t.members||[]).forEach(m => members.add(String(m.user))));
        kpi.members = members.size;
      }
    } else {
      kpi.myTeams = teams.length;
      kpi.myReportsThisWeek = reportsThisWeek.filter(r => String(r.author) === String(meId)).length;
      kpi.overdue = await Report.countDocuments({ team: { $in: teamIds }, dueAt: { $lt: now } });
      kpi.avgProgress = Math.round((avgByTeam.reduce((a,c)=>a+(c.avgProgress||0),0) / Math.max(1, avgByTeam.length))*10)/10 || 0;
    }

    // 간단 progress 히스토리(최근 4주)
    const fourWeeksAgo = new Date(Date.now() - 28*24*3600*1000);
    const recent = await Report.find({ team: { $in: teamIds }, weekOf: { $gte: fourWeeksAgo } })
      .sort({ weekOf: 1 });

    const histByTeam = {};
    recent.forEach(r => {
      const key = String(r.team);
      if (!histByTeam[key]) histByTeam[key] = [];
      histByTeam[key].push({ weekOf: r.weekOf, progress: r.progress });
    });
    const myTeamsProgress = teams.slice(0, 6).map(t => ({
      teamId: t._id,
      teamName: t.name,
      history: (histByTeam[String(t._id)] || []).slice(-4).map(x => x.progress)
    }));

    res.json({
      scope: role === Roles.ADMIN ? 'GLOBAL' : (role === Roles.EXECUTIVE ? 'CLUB' : 'MY'),
      kpi,
      dueSoon,
      myTeamsProgress
    });
  } catch (e) { next(e); }
});

// 팀별 건강도(최근 4주) — ADMIN은 clubId 선택 가능, EXEC는 본인 클럽
router.get('/health', requireAuth, async (req, res, next) => {
  try {
    const role = req.user.role;
    const meId = req.user.id;
    const clubIdParam = req.query.clubId;

    let teams = [];
    if (role === Roles.ADMIN) {
      teams = await Team.find(clubIdParam ? { clubId: clubIdParam } : {});
    } else if (role === Roles.EXECUTIVE) {
      teams = await Team.find({ clubId: req.user.clubId });
    } else {
      teams = await Team.find({ 'members.user': meId });
    }
    const teamIds = teams.map(t => t._id);
    const fourWeeksAgo = new Date(Date.now() - 28*24*3600*1000);
    const recent = await Report.find({ team: { $in: teamIds }, weekOf: { $gte: fourWeeksAgo } })
      .sort({ weekOf: 1 });

    const map = {};
    teams.forEach(t => { map[String(t._id)] = { teamId: t._id, teamName: t.name, weeks: [] }; });
    recent.forEach(r => {
      const key = String(r.team);
      if (!map[key]) return;
      map[key].weeks.push({ week: r.weekOf, progress: r.progress });
    });

    res.json(Object.values(map));
  } catch (e) { next(e); }
});

// 활동 피드(간이): 최근 팀 생성/보고서 생성 중심
router.get('/activity', requireAuth, async (req, res, next) => {
  try {
    const role = req.user.role;
    const meId = req.user.id;
    const clubIdParam = req.query.clubId;
    const limit = Math.min(50, Number(req.query.limit || 20));

    let teams = [];
    if (role === Roles.ADMIN) {
      teams = await Team.find(clubIdParam ? { clubId: clubIdParam } : {});
    } else if (role === Roles.EXECUTIVE) {
      teams = await Team.find({ clubId: req.user.clubId });
    } else {
      teams = await Team.find({ 'members.user': meId });
    }
    const teamIds = teams.map(t => t._id);

    const recentTeams = await Team.find({ _id: { $in: teamIds } }).sort({ createdAt: -1 }).limit(limit);
    const recentReports = await Report.find({ team: { $in: teamIds } }).sort({ createdAt: -1 }).limit(limit);

    const feed = [
      ...recentTeams.map(t => ({ type:'team.created', title:`팀 생성: ${t.name}`, at: t.createdAt })),
      ...recentReports.map(r => ({ type:'report.created', title:`보고서 제출: ${r.team}`, at: r.createdAt }))
    ].sort((a,b)=> new Date(b.at) - new Date(a.at)).slice(0, limit);

    res.json(feed);
  } catch (e) { next(e); }
});

export default router;
