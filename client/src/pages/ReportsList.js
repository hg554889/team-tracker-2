import React, { useEffect, useMemo, useState } from "react";
import { listReports, sendBulkReminders } from "../api/reports";
import { listTeams } from "../api/teams";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as XLSX from 'xlsx';
import "./ReportsList.css";

export default function ReportsList() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [sending, setSending] = useState(false);
  const page = Number(params.get("page") || 1);
  const teamId = params.get("teamId") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const status = params.get("status") || "all";
  const weekOf = params.get("weekOf") || "";
  const limit = 10;

  // 관리자 권한 확인 (useEffect 전에 정의)
  const isAdmin = user?.role === 'ADMIN';
  const isExecutive = user?.role === 'EXECUTIVE';
  const canManage = isAdmin || isExecutive;

  useEffect(() => {
    (async () => {
      // 관리자는 모든 팀을 볼 수 있도록 scope 조정
      const teamScope = isAdmin ? "all" : "mine";

      const [tRes, rRes] = await Promise.all([
        listTeams({ scope: teamScope }),
        listReports({
          teamId: teamId || undefined,
          page,
          limit,
          from: from || undefined,
          to: to || undefined,
          status: status || undefined,
          weekOf: weekOf || undefined,
          includeEmpty: (status === 'missing' || status === 'all' || weekOf) ? 'true' : undefined,
        }),
      ]);
      setTeams(tRes.data.items || []);
      setRows(rRes.data || { items: [], total: 0, page: 1, limit });
      setSummary(rRes.data.summary || null);
      setLoading(false);
    })();
  }, [teamId, page, from, to, status, weekOf, isAdmin]); // eslint-disable-line

  const teamMap = useMemo(() => {
    const m = {};
    (teams || []).forEach((t) => (m[t._id] = t.name));
    return m;
  }, [teams]);

  function updateQuery(next) {
    const q = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === "" || v === undefined || v === null) q.delete(k);
      else q.set(k, v);
    });
    setParams(q);
  }

  const total = rows.total || 0;
  const maxPage = Math.max(1, Math.ceil(total / limit));

  // 미제출 팀 목록 추출
  const missingTeams = rows.items?.filter(item => item.isMissingTeam) || [];

  // 일괄 알림 발송 함수
  const handleBulkReminder = async () => {
    if (!canManage || missingTeams.length === 0) return;

    setSending(true);
    try {
      const teamIds = missingTeams.map(team => team.team._id);
      const response = await sendBulkReminders(teamIds, weekOf);

      const { sentCount, notifications } = response.data;

      // 성공 메시지와 함께 발송 결과 표시
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "success",
            msg: `${sentCount}개 팀에 미제출 알림을 발송했습니다.`,
          },
        })
      );

      // 콘솔에 상세 정보 표시 (개발용)
      console.log('알림 발송 결과:', notifications);

    } catch (error) {
      console.error('알림 발송 오류:', error);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "error",
            msg: error.response?.data?.error || "알림 발송 중 오류가 발생했습니다.",
          },
        })
      );
    } finally {
      setSending(false);
    }
  };

  // XLSX 엑셀 내보내기 함수
  const handleExportExcel = () => {
    if (!canManage) return;

    // 데이터 준비
    const excelData = missingTeams.map((team, index) => {
      // 주차 날짜 처리
      let weekStr = '알 수 없음';
      if (team.weekOf) {
        try {
          const weekDate = new Date(team.weekOf);
          if (!isNaN(weekDate.getTime())) {
            weekStr = weekDate.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) + ' 주차';
          }
        } catch (error) {
          console.error('Week date parsing error for team:', team.teamName, error);
          weekStr = team.weekOf + ' (파싱 오류)';
        }
      }

      // 마지막 제출일 처리
      let lastSubmissionStr = '제출 기록 없음';
      if (team.lastSubmissionDate) {
        try {
          const lastDate = new Date(team.lastSubmissionDate);
          if (!isNaN(lastDate.getTime())) {
            lastSubmissionStr = lastDate.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
        } catch (error) {
          console.error('Last submission date parsing error for team:', team.teamName, error);
          lastSubmissionStr = '날짜 파싱 오류';
        }
      }

      return {
        '순번': index + 1,
        '팀명': team.teamName,
        '주차': weekStr,
        '지연일수': team.daysMissing || 0,
        '상태': team.daysMissing > 7 ? '심각한 지연' : team.daysMissing > 3 ? '지연' : '신규 미제출',
        '마지막제출일': lastSubmissionStr,
        '우선순위': team.daysMissing > 7 ? '높음' : team.daysMissing > 3 ? '중간' : '낮음'
      };
    });

    if (excelData.length === 0) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "info",
            msg: "내보낼 미제출 팀이 없습니다.",
          },
        })
      );
      return;
    }

    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 메인 데이터 시트
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 열 너비 자동 조정
    const wscols = [
      { wch: 6 },   // 순번
      { wch: 20 },  // 팀명
      { wch: 15 },  // 주차
      { wch: 10 },  // 지연일수
      { wch: 12 },  // 상태
      { wch: 18 },  // 마지막제출일
      { wch: 10 }   // 우선순위
    ];
    ws['!cols'] = wscols;

    // 헤더 스타일링 (옵션)
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { bgColor: { indexed: 64 }, fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center" }
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, "미제출 보고서 목록");

    // 요약 정보 시트
    let targetWeekStr = '전체';
    if (weekOf) {
      try {
        let weekDate;
        if (weekOf.includes('-W')) {
          const [year, weekPart] = weekOf.split('-W');
          const weekNum = parseInt(weekPart);

          // ISO 8601 Week 계산
          const jan4 = new Date(parseInt(year), 0, 4);
          const jan4Day = jan4.getDay();
          const firstWeekMonday = new Date(jan4);
          const daysFromMonday = jan4Day === 0 ? 6 : jan4Day - 1;
          firstWeekMonday.setDate(jan4.getDate() - daysFromMonday);
          weekDate = new Date(firstWeekMonday);
          weekDate.setDate(firstWeekMonday.getDate() + (weekNum - 1) * 7);
        } else {
          weekDate = new Date(weekOf);
        }

        if (!isNaN(weekDate.getTime())) {
          targetWeekStr = weekDate.toLocaleDateString('ko-KR') + ' 주차';
        }
      } catch (error) {
        console.error('Week date parsing error:', error);
        targetWeekStr = weekOf + ' (파싱 오류)';
      }
    }

    const summaryData = [
      { '항목': '총 미제출 팀 수', '값': missingTeams.length },
      { '항목': '심각한 지연 (7일+)', '값': missingTeams.filter(t => t.daysMissing > 7).length },
      { '항목': '일반 지연 (3-7일)', '값': missingTeams.filter(t => t.daysMissing > 3 && t.daysMissing <= 7).length },
      { '항목': '신규 미제출 (1-3일)', '값': missingTeams.filter(t => t.daysMissing <= 3).length },
      { '항목': '내보내기 일시', '값': new Date().toLocaleString('ko-KR') },
      { '항목': '대상 주차', '값': targetWeekStr }
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "요약");

    // 파일명 생성
    let weekStr;
    if (weekOf) {
      try {
        let weekDate;
        // HTML5 week input 형식 (2025-W39) 처리 - ISO 8601 표준
        if (weekOf.includes('-W')) {
          const [year, weekPart] = weekOf.split('-W');
          const weekNum = parseInt(weekPart);

          // ISO 8601 Week 계산
          // 1월 4일이 속한 주가 해당 연도의 첫 번째 주
          const jan4 = new Date(parseInt(year), 0, 4);
          const jan4Day = jan4.getDay(); // 0=일, 1=월, ..., 6=토

          // 첫 번째 주의 월요일 찾기
          const firstWeekMonday = new Date(jan4);
          const daysFromMonday = jan4Day === 0 ? 6 : jan4Day - 1; // 일요일=0을 6으로, 나머지는 -1
          firstWeekMonday.setDate(jan4.getDate() - daysFromMonday);

          // 지정된 주차의 월요일 계산
          weekDate = new Date(firstWeekMonday);
          weekDate.setDate(firstWeekMonday.getDate() + (weekNum - 1) * 7);
        } else {
          weekDate = new Date(weekOf);
        }

        if (isNaN(weekDate.getTime())) {
          throw new Error('Invalid date');
        }

        weekStr = weekDate.toISOString().slice(0, 10).replace(/-/g, '');
      } catch (error) {
        console.error('Date parsing error:', error);
        weekStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      }
    } else {
      weekStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    }
    const filename = `미제출_보고서_현황_${weekStr}.xlsx`;

    // 파일 다운로드
    XLSX.writeFile(wb, filename);

    // 성공 메시지
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: {
          type: "success",
          msg: `엑셀 파일이 다운로드되었습니다: ${filename}`,
        },
      })
    );
  };

  return (
    <div className="reports-list-container">
      <div className="reports-header">
        <h1>📈 보고서 목록</h1>
        <p>팀별 보고서를 확인하고 진행상황을 추적하세요</p>
      </div>

      <div className="filters-section">
        <h3>🔍 필터</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>팀 선택</label>
            <select
              className="filter-input"
              value={teamId}
              onChange={(e) =>
                updateQuery({ teamId: e.target.value || undefined, page: 1 })
              }
            >
              <option value="">전체 팀</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>상태</label>
            <select
              className="filter-input"
              value={status}
              onChange={(e) =>
                updateQuery({ status: e.target.value || undefined, page: 1 })
              }
            >
              <option value="all">전체</option>
              <option value="submitted">제출됨</option>
              <option value="missing">미제출</option>
            </select>
          </div>
          <div className="filter-group">
            <label>주차 선택</label>
            <input
              className="filter-input"
              type="week"
              value={weekOf}
              onChange={(e) =>
                updateQuery({ weekOf: e.target.value || undefined, page: 1 })
              }
              placeholder="특정 주차 선택"
            />
          </div>
          <div className="filter-group">
            <label>시작일 (이후)</label>
            <input
              className="filter-input"
              type="date"
              value={from}
              onChange={(e) =>
                updateQuery({ from: e.target.value || undefined, page: 1 })
              }
            />
          </div>
          <div className="filter-group">
            <label>종료일 (이전)</label>
            <input
              className="filter-input"
              type="date"
              value={to}
              onChange={(e) =>
                updateQuery({ to: e.target.value || undefined, page: 1 })
              }
            />
          </div>
        </div>
      </div>

      {summary && (
        <div className="summary-section">
          <h3>📊 제출 현황</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">전체 팀</span>
              <span className="stat-value">{summary.totalTeams}</span>
            </div>
            <div className="stat-item submitted">
              <span className="stat-label">제출 완료</span>
              <span className="stat-value">{summary.submittedCount}</span>
            </div>
            <div className="stat-item missing">
              <span className="stat-label">미제출</span>
              <span className="stat-value">{summary.missingCount}</span>
            </div>
            <div className="stat-item rate">
              <span className="stat-label">제출률</span>
              <span className="stat-value">{summary.submissionRate}%</span>
            </div>
          </div>
        </div>
      )}

      {canManage && missingTeams.length > 0 && (
        <div className="admin-tools-section">
          <h3>🔧 관리자 도구</h3>
          <div className="admin-summary">
            <div className="missing-overview">
              <span className="overview-text">
                <strong>{weekOf ? new Date(weekOf).toLocaleDateString() + ' 주차' : '현재'}</strong>
                {' '}미제출 팀: <span className="missing-count">{missingTeams.length}개</span>
              </span>
              {missingTeams.some(team => team.daysMissing > 7) && (
                <span className="critical-alert">
                  ⚠️ 7일 이상 지연된 팀이 있습니다
                </span>
              )}
            </div>
            <div className="admin-actions">
              <button
                className="admin-btn primary"
                onClick={handleBulkReminder}
                disabled={sending}
              >
                {sending ? "발송 중..." : `📧 일괄 알림 (${missingTeams.length}개)`}
              </button>
              <button
                className="admin-btn secondary"
                onClick={handleExportExcel}
              >
                📊 엑셀 내보내기
              </button>
            </div>
          </div>

          {missingTeams.length > 5 && (
            <div className="missing-teams-preview">
              <h4>미제출 팀 목록 미리보기</h4>
              <div className="preview-list">
                {missingTeams.slice(0, 5).map((team, index) => (
                  <div key={index} className="preview-item">
                    <span className="team-name">{team.teamName}</span>
                    <span className="days-info">
                      {team.daysMissing > 0 ? `${team.daysMissing}일 지연` : '신규'}
                    </span>
                  </div>
                ))}
                {missingTeams.length > 5 && (
                  <div className="preview-more">
                    +{missingTeams.length - 5}개 팀 더...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="reports-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>보고서를 불러오는 중...</p>
          </div>
        ) : (rows.items || []).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>보고서가 없습니다</h3>
            <p>
              아직 작성된 보고서가 없거나 필터 조건에 맞는 보고서가 없습니다.
            </p>
          </div>
        ) : (
          <div className="reports-grid">
            {rows.items.map((r) => {
              // 미제출 팀 카드
              if (r.isMissingTeam) {
                return (
                  <div
                    key={`missing-${r.team._id}-${r.weekOf}`}
                    className="report-card missing-report"
                  >
                    <div className="report-card-header">
                      <div className="report-title">
                        <div className="missing-indicator">
                          ❌ 미제출
                          {r.daysMissing > 0 && (
                            <span className="days-overdue">
                              {r.daysMissing}일 지연
                            </span>
                          )}
                        </div>
                        <h4>{new Date(r.weekOf).toLocaleDateString()} 주차</h4>
                        <span className="team-name">
                          {r.teamName}
                        </span>
                      </div>
                      <div className="report-progress">
                        <div className="missing-progress">
                          <svg width="50" height="50">
                            <circle
                              cx="25"
                              cy="25"
                              r="21"
                              stroke="#e74c3c"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray="5,5"
                            />
                            <text
                              x="25"
                              y="30"
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="600"
                              fill="#e74c3c"
                            >
                              0%
                            </text>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="report-card-content">
                      <div className="report-meta">
                        <div className="meta-item">
                          <span className="meta-label">상태</span>
                          <span className="meta-value missing">미제출</span>
                        </div>
                        {r.lastSubmissionDate && (
                          <div className="meta-item">
                            <span className="meta-label">마지막 제출</span>
                            <span className="meta-value">
                              {new Date(r.lastSubmissionDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // 제출된 보고서 카드 (기존 로직)
              return (
                <Link
                  key={r._id}
                  to={`/reports/${r._id}`}
                  className="report-card submitted-report"
                >
                  <div className="report-card-header">
                    <div className="report-title">
                      <h4>{new Date(r.weekOf).toLocaleDateString()} 보고서</h4>
                      <span className="team-name">
                        {r.team?.name || teamMap[r.team] || r.team}
                      </span>
                    </div>
                    <div className="report-progress">
                      <div className="progress-circle">
                        <svg className="progress-ring" width="50" height="50">
                          <circle
                            className="progress-ring-circle"
                            stroke={
                              r.progress >= 80
                                ? "#10b981"
                                : r.progress >= 50
                                ? "#f59e0b"
                                : "#ef4444"
                            }
                            strokeWidth="4"
                            fill="transparent"
                            r="21"
                            cx="25"
                            cy="25"
                            strokeDasharray={`${2 * Math.PI * 21}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 21 * (1 - r.progress / 100)
                            }`}
                          />
                          <text
                            x="25"
                            y="30"
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="600"
                            fill={
                              r.progress >= 80
                                ? "#10b981"
                                : r.progress >= 50
                                ? "#f59e0b"
                                : "#ef4444"
                            }
                          >
                            {r.progress}%
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="report-card-content">
                    <div className="report-meta">
                      <div className="meta-item">
                        <span className="meta-label">주차</span>
                        <span className="meta-value">
                          {new Date(r.weekOf).toLocaleDateString()}
                        </span>
                      </div>
                      {r.dueAt && (
                        <div className="meta-item">
                          <span className="meta-label">마감일</span>
                          <span className="meta-value">
                            {new Date(r.dueAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {total > limit && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => updateQuery({ page: page - 1 })}
          >
            ← 이전
          </button>
          <div className="pagination-info">
            {page} / {maxPage} 페이지 (총 {total}개)
          </div>
          <button
            className="pagination-btn"
            disabled={page >= maxPage}
            onClick={() => updateQuery({ page: page + 1 })}
          >
            다음 →
          </button>
        </div>
      )}

      <div className="back-button-section">
        <button
          className="btn-back"
          onClick={() => (teamId ? nav(`/teams/${teamId}#reports`) : nav(-1))}
        >
          ← 뒤로 가기
        </button>
      </div>
    </div>
  );
}
