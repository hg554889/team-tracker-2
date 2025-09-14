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
  const [shortTermGoals, setShortTermGoals] = useState("");
  const [actionPlans, setActionPlans] = useState("");
  const [milestones, setMilestones] = useState("");
  const [issues, setIssues] = useState("");
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
    if (template.shortTermGoals) setShortTermGoals(template.shortTermGoals);
    if (template.actionPlans) setActionPlans(template.actionPlans);
    if (template.milestones) setMilestones(template.milestones);
    if (template.issues) setIssues(template.issues);
    if (template.suggestedProgress) setProgress(template.suggestedProgress);
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
      setProgress(prediction.predictedProgress);
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
    if (suggestions.shortTermGoals) {
      let shortTermText = "";
      suggestions.shortTermGoals.forEach((goal, index) => {
        shortTermText += `${index + 1}. ${goal}\n`;
      });
      setShortTermGoals(shortTermText);
    }
    if (suggestions.keyMilestones) {
      let milestonesText = "";
      suggestions.keyMilestones.forEach((milestone, index) => {
        milestonesText += `${index + 1}. ${milestone}\n`;
      });
      setMilestones(milestonesText);
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

  const handleActionPlanSuggested = (actionPlan) => {
    if (actionPlan.timeline) {
      let planText = "[실행 계획]\n";
      actionPlan.timeline.forEach((step, index) => {
        planText += `${index + 1}. ${step.task} (${step.duration}${
          step.assignee ? `, 담당: ${step.assignee}` : ""
        })\n`;
      });
      if (actionPlan.checkpoints) {
        planText += "\n[체크포인트]\n";
        actionPlan.checkpoints.forEach((checkpoint) => {
          planText += `- ${checkpoint}\n`;
        });
      }
      setActionPlans(planText);
    }
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "info", msg: "AI 실행 계획이 적용되었습니다." },
      })
    );
  };

  const handleApplyToShortTermGoals = (content) => {
    setShortTermGoals(content);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "success", msg: "단기 목표가 적용되었습니다." },
      })
    );
  };
  const handleApplyToActionPlans = (content) => {
    setActionPlans(content);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "success", msg: "실행 계획이 적용되었습니다." },
      })
    );
  };
  const handleApplyToMilestones = (content) => {
    setMilestones(content);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "success", msg: "마일스톤이 적용되었습니다." },
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
        goals: shortTermGoals,
        // 참고: 추가 필드들은 서버에서 무시될 수 있습니다.
        actionPlans,
        milestones,
        issues,
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
            onActionPlanSuggested={handleActionPlanSuggested}
            onApplyToShortTermGoals={handleApplyToShortTermGoals}
            onApplyToActionPlans={handleApplyToActionPlans}
            onApplyToMilestones={handleApplyToMilestones}
            currentGoals={{ shortTermGoals }}
            currentPlans={{ actionPlans, milestones }}
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
            <div className="progress-input-container">
              <input
                className="form-input progress-input"
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                placeholder="0-100"
              />
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    progress >= 80 ? "high" : progress >= 50 ? "medium" : "low"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span
                className={`progress-text ${
                  progress >= 80 ? "high" : progress >= 50 ? "medium" : "low"
                }`}
              >
                {progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="goals-plans-container">
          <div className="section-header">
            <h3>목표 및 실행 계획</h3>
            <p className="section-description">
              목표를 명확히 설정하고 구체적인 실행 계획을 수립하세요
            </p>
          </div>

          <div className="goals-grid">
            <div className="form-section goals-section">
              <h4>단기 목표 (1주)</h4>
              <div className="form-group">
                <label>이번 주 달성할 구체적 목표</label>
                <textarea
                  className="form-textarea short-goals"
                  value={shortTermGoals}
                  onChange={(e) => setShortTermGoals(e.target.value)}
                  placeholder={`이번 주 달성할 구체적인 목표를 입력하세요\n예)\n• 로그인 API 개발 완료\n• 메인 페이지 UI 마크업 완성`}
                  required
                />
              </div>
            </div>

            <div className="form-section plans-section">
              <h4>실행 계획</h4>
              <div className="form-group">
                <label>목표 달성을 위한 구체적 실행 방안</label>
                <textarea
                  className="form-textarea action-plans"
                  value={actionPlans}
                  onChange={(e) => setActionPlans(e.target.value)}
                  placeholder={`목표 달성을 위한 구체적인 실행 방법을 입력하세요\n예)\n1. 월요일: 요구사항 분석 및 정리\n2. 화요일: API 설계 및 개발 착수\n3. 수요일: 핵심 기능 코드 구현 및 테스트\n4. 금요일: UI 컴포넌트 개발`}
                />
              </div>
            </div>

            <div className="form-section milestones-section">
              <h4>주요 마일스톤</h4>
              <div className="form-group">
                <label>중요한 중간 목표 및 검증 지점</label>
                <textarea
                  className="form-textarea milestones"
                  value={milestones}
                  onChange={(e) => setMilestones(e.target.value)}
                  placeholder={`주요 마일스톤과 검증 기준을 작성하세요\n예)\n• 1주차: 기본 인증 로직 완성 (80%)\n• 2주차: UI/UX 시안 검토 완료 (90%)\n• 3주차: 통합 테스트 결과 (95%)\n• 4주차: 배포 및 모니터링 체계 구축 (100%)`}
                />
              </div>
            </div>
          </div>

          <div className="form-hint goals-hint">
            힌트: 상단의 “AI 제안 보기” 버튼을 누르면 프로젝트 맥락에 맞는
            템플릿을 불러옵니다.
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
          <h3>마감 일정</h3>
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
              !teamId || (!shortTermGoals.trim() && !actionPlans.trim())
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
