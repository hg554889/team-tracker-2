import React, { useEffect, useState } from "react";
import { listTeams } from "../api/teams";
import { createOrUpdateReport } from "../api/reports";
import { useLocation, useNavigate } from "react-router-dom";
import AIAssistant from "../components/AIAssistant";
import "./ReportForm.css";

export default function ReportForm() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamId, setTeamId] = useState("");
  const [weekOf, setWeekOf] = useState("");
  const [progress, setProgress] = useState(0);
  const [weeklyGoalsPeriod, setWeeklyGoalsPeriod] = useState("");
  const [progressDetails, setProgressDetails] = useState("");
  const [achievements, setAchievements] = useState("");
  const [completedTasks, setCompletedTasks] = useState("");
  const [incompleteTasks, setIncompleteTasks] = useState("");
  const [issues, setIssues] = useState("");
  const [nextWeekPlans, setNextWeekPlans] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [done, setDone] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();


  useEffect(() => {
    (async () => {
      const { data } = await listTeams({ scope: "mine" });
      setTeams(data.items);
      const preset = loc.state?.teamId;
      if (preset) {
        setTeamId(preset);
        const team = data.items.find((t) => t._id === preset);
        setSelectedTeam(team || null);
      }
      if (!weekOf) setWeekOf(new Date().toISOString().slice(0, 10));
    })();
  }, [loc.state]);

  const handleTeamChange = (e) => {
    const newTeamId = e.target.value;
    setTeamId(newTeamId);
    const team = teams.find((t) => t._id === newTeamId);
    setSelectedTeam(team || null);
  };

  const handleTemplateGenerated = (template) => {
    if (template.weeklyGoalsPeriod) setWeeklyGoalsPeriod(template.weeklyGoalsPeriod);
    if (template.progressDetails) setProgressDetails(template.progressDetails);
    if (template.achievements) setAchievements(template.achievements);
    if (template.completedTasks) setCompletedTasks(template.completedTasks);
    if (template.incompleteTasks) setIncompleteTasks(template.incompleteTasks);
    if (template.issues) setIssues(template.issues);
    if (template.nextWeekPlans) setNextWeekPlans(template.nextWeekPlans);
    if (template.suggestedProgress) {
      const numValue = Number(template.suggestedProgress);
      setProgress(isNaN(numValue) ? 0 : numValue);
    }
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: {
          type: "info",
          msg: "AI 템플릿이 필드에 적용되었습니다. 필요에 맞게 조정해주세요.",
        },
      })
    );
  };

  const handleProgressPredicted = (prediction) => {
    if (prediction.predictedProgress) {
      const numValue = Number(prediction.predictedProgress);
      setProgress(isNaN(numValue) ? 0 : numValue);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "info",
            msg: `예측 진행률 ${prediction.predictedProgress}%가 적용되었습니다.`,
          },
        })
      );
    }
  };

  const handleGoalsSuggested = (suggestions) => {
    if (suggestions.weeklyGoalsPeriod) {
      let goalsText = "";
      suggestions.weeklyGoalsPeriod.forEach((goal, index) => {
        goalsText += `${index + 1}. ${goal}\n`;
      });
      setWeeklyGoalsPeriod(goalsText);
    }
    if (suggestions.achievements) {
      let achievementsText = "";
      suggestions.achievements.forEach((achievement, index) => {
        achievementsText += `${index + 1}. ${achievement}\n`;
      });
      setAchievements(achievementsText);
    }
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: {
          type: "info",
          msg: "AI 제안이 적용되었습니다. 현재 상황에 맞게 다듬어 주세요.",
        },
      })
    );
  };

  const handleNextWeekPlanSuggested = (planData) => {
    if (planData.timeline) {
      let planText = "[다음주 계획]\n";
      planData.timeline.forEach((step, index) => {
        planText += `${index + 1}. ${step.task} (${step.duration}${
          step.assignee ? `, 담당: ${step.assignee}` : ""
        })\n`;
      });
      if (planData.checkpoints) {
        planText += "\n[체크포인트]\n";
        planData.checkpoints.forEach((checkpoint) => {
          planText += `- ${checkpoint}\n`;
        });
      }
      setNextWeekPlans(planText);
    }
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "info", msg: "AI 다음주 계획이 적용되었습니다." },
      })
    );
  };

  const handleApplyToWeeklyGoalsPeriod = (content) => {
    setWeeklyGoalsPeriod(content);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "success", msg: "주간 목표가 적용되었습니다." },
      })
    );
  };
  const handleApplyToProgressDetails = (content) => {
    setProgressDetails(content);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "success", msg: "진행 내역이 적용되었습니다." },
      })
    );
  };
  const handleApplyToAchievements = (content) => {
    setAchievements(content);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "success", msg: "주요 성과가 적용되었습니다." },
      })
    );
  };
  const handleApplyToNextWeekPlans = (content) => {
    setNextWeekPlans(content);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "success", msg: "다음주 계획이 적용되었습니다." },
      })
    );
  };

  async function submit(e) {
    e.preventDefault();
    try {
      const payload = {
        teamId,
        weekOf: new Date().toISOString(),
        progress: Number(progress),
        // 서버 스키마에 맞춰 goals 필드에 '목표설정' 내용을 담습니다.
        goals: weeklyGoalsPeriod,
        progressDetails,
        achievements,
        completedTasks,
        incompleteTasks,
        issues,
        nextWeekPlans,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      };
      await createOrUpdateReport(payload);
      setDone(true);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "보고서가 저장되었습니다" },
        })
      );
      window.dispatchEvent(
        new CustomEvent("report:saved", { detail: { teamId } })
      );
      nav(`/teams/${teamId}#reports`, { replace: true });
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "저장 실패" },
        })
      );
    }
  }

  if (done)
    return (
      <div className="report-container">
        <div
          className="report-success"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            padding: "40px 0",
          }}
        >
          <div style={{ fontSize: 48 }}>✅</div>
          <div style={{ fontSize: 18 }}>보고서가 저장되었습니다</div>
        </div>
      </div>
    );

  return (
    <div className="report-container">
      <div className="report-header">
        <div className="report-title">
          <h1>주간 보고서 작성</h1>
          <p>이번 주 진행 상황과 목표를 체계적으로 기록하세요</p>
        </div>
        <button
          onClick={() => setShowAI(!showAI)}
          className={`ai-toggle-btn ${showAI ? "active" : ""}`}
        >
          <span className="ai-icon">🤖</span>
          AI 제안 {showAI ? "접기" : "보기"}
        </button>
      </div>

      {showAI && selectedTeam && (
        <div className="ai-assistant-container">
          <AIAssistant
            teamId={teamId}
            currentProgress={progress}
            onTemplateGenerated={handleTemplateGenerated}
            onProgressPredicted={handleProgressPredicted}
            onGoalsSuggested={handleGoalsSuggested}
            onNextWeekPlanSuggested={handleNextWeekPlanSuggested}
            onApplyToWeeklyGoalsPeriod={handleApplyToWeeklyGoalsPeriod}
            onApplyToProgressDetails={handleApplyToProgressDetails}
            onApplyToAchievements={handleApplyToAchievements}
            onApplyToNextWeekPlans={handleApplyToNextWeekPlans}
            currentGoals={{ weeklyGoalsPeriod }}
            currentPlans={{ progressDetails, achievements, nextWeekPlans }}
          />
        </div>
      )}

      <form onSubmit={submit} className="report-form">
        <div className="form-section">
          <h3>기본 정보</h3>
          <div className="form-group">
            <label>팀 선택 *</label>
            <select
              className="form-input"
              value={teamId}
              onChange={handleTeamChange}
              required
            >
              <option value="">팀을 선택하세요</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                  {t.description
                    ? ` - ${t.description.substring(0, 30)}${
                        t.description.length > 30 ? "..." : ""
                      }`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>주차 시작일 *</label>
            <input
              className="form-input"
              type="date"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>진행 상황</h3>
          <div className="form-group">
            <label>진행률(%) *</label>
            <div
              className="progress-input-container"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <input
                className="form-input progress-input"
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : Number(value);
                  if (isNaN(numValue)) setProgress(0);
                  else if (numValue < 0) setProgress(0);
                  else if (numValue > 100) setProgress(100);
                  else setProgress(numValue);
                }}
                placeholder="0-100"
              />
              <div
                style={{
                  flex: 1,
                  height: '20px',
                  minHeight: '20px',
                  background: '#e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid #d1d5db',
                  marginLeft: '8px',
                  marginRight: '8px'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(0, Math.min(100, progress || 0))}%`,
                    transition: 'all 0.3s ease',
                    borderRadius: '8px',
                    background: progress >= 80 ? '#10b981' :
                               progress >= 50 ? '#f59e0b' :
                               '#ef4444',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              <span
                className={`progress-text ${
                  progress >= 80 ? "high" : progress >= 50 ? "medium" : "low"
                }`}
                style={{
                  flex: '0 0 60px',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '1rem',
                  color: progress >= 80 ? '#10b981' :
                         progress >= 50 ? '#f59e0b' :
                         '#ef4444'
                }}
              >
                {progress || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="report-sections-container">
          <div className="form-section">
            <h3>📅 주간 목표 및 기간</h3>
            <div className="form-group">
              <label>이번 주 목표와 수행 기간</label>
              <textarea
                className="form-textarea"
                value={weeklyGoalsPeriod}
                onChange={(e) => setWeeklyGoalsPeriod(e.target.value)}
                placeholder={`이번 주 목표와 기간을 입력하세요\n예)\n• 목표: 사용자 인증 시스템 구축\n• 기간: 2024.01.15 ~ 2024.01.19\n• 담당자: 김개발`}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>📝 진행 내역</h3>
            <div className="form-group">
              <label>이번 주 실제 진행한 작업 내용</label>
              <textarea
                className="form-textarea"
                value={progressDetails}
                onChange={(e) => setProgressDetails(e.target.value)}
                placeholder={`이번 주 진행한 구체적인 작업을 입력하세요\n예)\n• 월요일: 요구사항 분석 및 설계 문서 작성\n• 화요일: 로그인 API 개발 시작\n• 수요일: JWT 토큰 인증 로직 구현`}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>🏆 주요 성과</h3>
            <div className="form-group">
              <label>이번 주 달성한 주요 성과와 결과물</label>
              <textarea
                className="form-textarea"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder={`이번 주 달성한 성과를 입력하세요\n예)\n• 로그인/회원가입 API 완성\n• 사용자 인증 테스트 100% 통과\n• 보안 검증 완료`}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>✅ 완료/미완료 업무</h3>
            <div className="form-group">
              <label>완료된 업무</label>
              <textarea
                className="form-textarea"
                value={completedTasks}
                onChange={(e) => setCompletedTasks(e.target.value)}
                placeholder={`완료된 업무 목록\n예)\n✅ 로그인 API 개발\n✅ 단위 테스트 작성\n✅ 코드 리뷰 완료`}
              />
            </div>
            <div className="form-group">
              <label>미완료 업무</label>
              <textarea
                className="form-textarea"
                value={incompleteTasks}
                onChange={(e) => setIncompleteTasks(e.target.value)}
                placeholder={`미완료 업무 목록과 사유\n예)\n❌ 비밀번호 재설정 기능 (설계 변경으로 지연)\n❌ 소셜 로그인 연동 (외부 API 문제)`}
              />
            </div>
          </div>

        <div className="form-section">
          <h3>이슈 및 고민사항</h3>
          <div className="form-group">
            <label>이슈/요청 사항</label>
            <textarea
              className="form-textarea issues-textarea"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder={`현재 겪고 있는 이슈와 요청 사항을 입력하세요...\n예)\n• API 응답 속도 개선 필요\n• 레거시 코드 리팩터링 필요`}
            />
          </div>
        </div>

          <div className="form-section">
            <h3>📋 다음주 계획</h3>
            <div className="form-group">
              <label>다음 주 진행할 업무와 계획</label>
              <textarea
                className="form-textarea"
                value={nextWeekPlans}
                onChange={(e) => setNextWeekPlans(e.target.value)}
                placeholder={`다음주 계획을 입력하세요\n예)\n• 소셜 로그인 기능 개발\n• 사용자 프로필 관리 기능\n• 통합 테스트 및 배포 준비`}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>⏰ 마감 일정</h3>
            <div className="form-group">
              <label>마감일</label>
              <input
                className="form-input"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() =>
              teamId ? nav(`/teams/${teamId}#reports`) : nav("/teams")
            }
            className="btn-cancel"
          >
            취소
          </button>
          <button
            className="btn-submit"
            disabled={
              !teamId || !weeklyGoalsPeriod.trim()
            }
          >
            저장
          </button>
        </div>
      </form>

      {!selectedTeam && teamId && (
        <div className="warning-message">
          팀을 선택해야 AI 제안을 사용할 수 있습니다.
        </div>
      )}
    </div>
  );
}
