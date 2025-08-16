import React, { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import AIWidget from '../components/dashboard/AIWidget';
import KPIGroup from '../components/dashboard/KPIGroup';
import DueSoonList from '../components/dashboard/DueSoonList';
import TeamHealth from '../components/dashboard/TeamHealth';
import QuickActions from '../components/dashboard/QuickActions';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard(){
  const { user } = useAuth();

  // 메인 요약
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // 폴백용 개별 위젯 데이터
  const [dueSoon, setDueSoon] = useState([]);
  const [loadingDueSoon, setLoadingDueSoon] = useState(false);

  const [healthRows, setHealthRows] = useState([]); // TeamHealth용
  const [loadingHealth, setLoadingHealth] = useState(false);

  // 1) 요약 불러오기 (신/구 API 모두 지원)
  useEffect(()=>{ (async()=>{
    try {
      setLoadingSummary(true);
      // 신 API 형태(개선판): { scope, kpi, dueSoon, myTeamsProgress }
      // 구 API 형태(기존): { scope, teams, avgProgressByTeam, dueSoon }
      const { data } = await client.get('/dashboard/summary');
      setSummary(data);
    } finally {
      setLoadingSummary(false);
    }
  })(); },[]);

  // 2) DueSoon 폴백 (요약에 없으면 개별 API 호출)
  useEffect(()=>{ (async()=>{
    if (loadingSummary) return;
    if (summary?.dueSoon) { setDueSoon(summary.dueSoon); return; }
    try{
      setLoadingDueSoon(true);
      const { data } = await client.get('/reports/due-soon', { params: { days: 3, scope: 'mine' } });
      setDueSoon(data || []);
    } finally { setLoadingDueSoon(false); }
  })(); }, [loadingSummary, summary]);

  // 3) TeamHealth 데이터 정규화
  // - 구 API: summary.avgProgressByTeam 그대로 사용
  // - 신 API: summary.myTeamsProgress(최근 주차 히스토리) → 평균값으로 변환하여 유사 형태 제공
  useEffect(()=>{ (async()=>{
    if (loadingSummary) return;
    if (Array.isArray(summary?.avgProgressByTeam)) {
      setHealthRows(summary.avgProgressByTeam);
      return;
    }
    if (Array.isArray(summary?.myTeamsProgress)) {
      const rows = summary.myTeamsProgress.map(t => ({
        _id: t.teamId,
        team: t.teamName,  // teamName 사용
        avgProgress: Math.round(
          (t.history || []).reduce((a,c)=> a + (Number(c)||0), 0) / Math.max(1,(t.history||[]).length)
        )
      }));
      setHealthRows(rows);
      return;
    }
    // 추가 폴백: 별도 health 엔드포인트가 있다면 사용
    try{
      setLoadingHealth(true);
      const { data } = await client.get('/dashboard/health');
      // data: [{ teamId, teamName, weeks:[{week,progress}...] }]
      const rows2 = (data || []).map(r => ({
        _id: r.teamId,
        team: r.teamName,
        avgProgress: Math.round(
          (r.weeks || []).reduce((a,c)=> a + (Number(c.progress)||0), 0) / Math.max(1,(r.weeks||[]).length)
        )
      }));
      setHealthRows(rows2);
    } finally { setLoadingHealth(false); }
  })(); }, [loadingSummary, summary]);

  // 4) KPI 구성 (역할별 라벨 + 신/구 데이터 지원)
  const kpis = useMemo(()=>{
    if (!summary) return [];

    // 신 API (개선판)
    if (summary.kpi) {
      const k = summary.kpi;
      if (user?.role === 'ADMIN') {
        return [
          { label: '총 팀', value: k.teams ?? 0 },
          { label: '활성 팀', value: k.activeTeams ?? 0 },
          { label: '평균 진행률', value: (k.avgProgress ?? 0) + '%' },
          { label: '이번 주 제출률', value: (k.submitRateThisWeek ?? 0) + '%' },
        ];
      }
      if (user?.role === 'EXECUTIVE') {
        return [
          { label: '팀 수', value: k.teams ?? 0 },
          { label: '멤버 수', value: k.members ?? 0 },
          { label: '평균 진행률', value: (k.avgProgress ?? 0) + '%' },
          { label: '이번 주 제출률', value: (k.submitRateThisWeek ?? 0) + '%' },
        ];
      }
      // LEADER / MEMBER
      return [
        { label: '내 팀 수', value: k.myTeams ?? 0 },
        { label: '이번 주 내 보고서', value: k.myReportsThisWeek ?? 0 },
        { label: '지연 항목', value: k.overdue ?? 0 },
        { label: '팀 평균 진행률', value: (k.avgProgress ?? 0) + '%' },
      ];
    }

    // 구 API (기존)
    const teams = summary.teams ?? 0;
    const avgCnt = summary.avgProgressByTeam?.length ?? 0;
    const avgProgress = avgCnt
      ? Math.round(summary.avgProgressByTeam.reduce((a,b)=>a+(b.avgProgress||0),0)/avgCnt)
      : 0;
    const dueSoonCount = summary.dueSoon?.length ?? 0;

    return [
      { label: '대상 팀 수', value: teams },
      { label: '평균 완료율', value: `${avgProgress}%` },
      { label: '임박 마감', value: dueSoonCount },
      { label: '집계 팀수', value: avgCnt },
    ];
  },[summary, user?.role]);

  // 5) 타이틀
  const titleSuffix = useMemo(()=>{
    // 신 API: scope: GLOBAL/CLUB/MY
    if (summary?.scope) {
      if (summary.scope === 'GLOBAL') return '(전체)';
      if (summary.scope === 'CLUB') return '(우리 동아리)';
      return '';
    }
    // 구 API: 기존처럼 GLOBAL이면 '(전체)'
    return summary?.scope === 'GLOBAL' ? '(전체)' : '';
  }, [summary]);

  return (
    <div className="dashboard-container">
      <div style={{ 
        padding: '24px',
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        {/* 상단 섹션: AI 위젯 + KPI */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* AI 위젯 */}
          <AIWidget user={user} />
          
          {/* KPI 그룹 */}
          <KPIGroup userId={user._id} />
        </div>

        {/* 중간 섹션: 팀 건강도 + 마감 예정 */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* 팀 건강도 */}
          <TeamHealth 
            userId={user._id} 
            healthRows={healthRows} 
            loading={loadingHealth || loadingSummary} 
          />
          
          {/* 마감 예정 목록 */}
          <DueSoonList 
            userId={user._id} 
            items={dueSoon}
            loading={loadingDueSoon || loadingSummary} 
          />
        </div>

        {/* 하단 섹션: 활동 피드 */}
        <div>
          <ActivityFeed userId={user._id} />
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          background-color: #f9fafb;
          min-height: 100vh;
        }

        .card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }

        @media (max-width: 1024px) {
          .dashboard-container > div {
            padding: 16px;
          }
          
          .dashboard-container > div > div {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
