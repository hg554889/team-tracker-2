import React, { useEffect, useMemo, useState } from "react";
import { listReports } from "../api/reports";
import { listTeams } from "../api/teams";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import "./ReportsList.css";

export default function ReportsList() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const page = Number(params.get("page") || 1);
  const teamId = params.get("teamId") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const limit = 10;

  useEffect(() => {
    (async () => {
      const [tRes, rRes] = await Promise.all([
        listTeams({ scope: "mine" }), // 내가 볼 수 있는 팀
        listReports({
          teamId: teamId || undefined,
          page,
          limit,
          from: from || undefined,
          to: to || undefined,
        }),
      ]);
      setTeams(tRes.data.items || []);
      setRows(rRes.data || { items: [], total: 0, page: 1, limit });
      setLoading(false);
    })();
  }, [teamId, page, from, to]); // eslint-disable-line

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
            {rows.items.map((r) => (
              <Link
                key={r._id}
                to={`/reports/${r._id}`}
                className="report-card"
              >
                <div className="report-card-header">
                  <div className="report-title">
                    <h4>{new Date(r.weekOf).toLocaleDateString()} 보고서</h4>
                    <span className="team-name">
                      {teamMap[r.team] || r.team}
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
            ))}
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
