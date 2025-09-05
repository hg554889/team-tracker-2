import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const [typedText, setTypedText] = useState("");
  const [currentRisk, setCurrentRisk] = useState(0);

  const codeSnippet = `// AI 분석 중...
const analyzeProject = async () => {
  const risks = await ai.detectRisks();
  const insights = await ai.generateInsights();
  return { risks, insights };
};`;

  const riskData = [
    { label: "일정 지연 위험", value: 23, color: "#ff6b6b" },
    { label: "리소스 부족", value: 15, color: "#ffd93d" },
    { label: "기술적 이슈", value: 8, color: "#6bcf7f" },
  ];

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < codeSnippet.length) {
        setTypedText(codeSnippet.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const riskTimer = setInterval(() => {
      setCurrentRisk((prev) => (prev + 1) % riskData.length);
    }, 2000);

    return () => clearInterval(riskTimer);
  }, []);

  const features = [
    {
      icon: "👥",
      title: "스마트 팀 관리",
      description:
        "팀원들의 역할, 스킬, 작업 현황을 한눈에 파악하고 효율적으로 업무를 분배할 수 있습니다.",
      demo: "team-demo",
    },
    {
      icon: "📊",
      title: "AI 기반 보고서 생성",
      description:
        "프로젝트 진행 상황을 자동으로 분석하여 명확하고 체계적인 보고서를 즉시 생성합니다.",
      demo: "report-demo",
    },
    {
      icon: "💬",
      title: "실시간 협업 채팅",
      description:
        "팀원 간의 원활한 소통을 위한 실시간 채팅과 파일 공유, 화상회의 기능을 제공합니다.",
      demo: "chat-demo",
    },
    {
      icon: "📅",
      title: "지능형 일정 관리",
      description:
        "AI가 팀의 작업 패턴을 학습하여 최적의 일정과 마일스톤을 자동으로 제안합니다.",
      demo: "schedule-demo",
    },
  ];

  const painPoints = [
    {
      problem: "복잡한 보고서 작성",
      solution: "AI로 3초 만에 완성",
      icon: "📝→🤖",
    },
    {
      problem: "예측 불가능한 프로젝트 리스크",
      solution: "사전 위험 감지 및 대응",
      icon: "❌→✅",
    },
    {
      problem: "팀원 간 소통 부족",
      solution: "실시간 협업 환경",
      icon: "😵→💬",
    },
  ];

  return (
    <div className="landing-container">
      <div className="particles-bg">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          ></div>
        ))}
      </div>

      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🚀 대학생 팀을 위한 AI 프로젝트 매니저</span>
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">AI가 만드는</span>
            <br />
            <span className="typing-text">완벽한 팀워크</span>
          </h1>
          <p className="hero-subtitle">
            복잡한 보고서는 3초만에, 프로젝트 리스크는 미리 예측하고,
            <br />
            팀의 성공률을 <span className="highlight">300% 향상</span>시키는
            똑똑한 협업 도구
          </p>

          <div className="live-demo">
            <div className="demo-window">
              <div className="window-header">
                <div className="window-controls">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="window-title">Team Tracker AI</div>
              </div>
              <div className="demo-content">
                <pre className="code-demo">{typedText}</pre>
                <div className="cursor"></div>
              </div>
            </div>
          </div>

          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary">
              <span>회원가입</span>
              <div className="btn-glow"></div>
            </Link>
            <Link to="/login" className="btn btn-secondary">
              <span>로그인</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="pain-points-section">
          <div className="section-header">
            <h2 className="section-title">더 이상 이런 고민 하지 마세요</h2>
            <p className="section-subtitle">
              매번 반복되는 프로젝트 문제들, AI가 한 번에 해결합니다
            </p>
          </div>
          <div className="pain-points-grid">
            {painPoints.map((point, index) => (
              <div key={index} className="pain-point-card">
                <div className="problem-side">
                  <div className="problem-icon">😤</div>
                  <h3>{point.problem}</h3>
                </div>
                <div className="arrow">{point.icon}</div>
                <div className="solution-side">
                  <div className="solution-icon">✨</div>
                  <h3>{point.solution}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="visual-proof-section">
          <div className="section-header">
            <h2 className="section-title">실제로 작동하는 AI를 확인하세요</h2>
          </div>
          <div className="proof-container">
            <div className="ai-dashboard">
              <div className="dashboard-header">
                <h3>실시간 리스크 분석</h3>
                <div className="status-indicator">
                  <span className="dot active"></span>
                  <span>AI 분석 중</span>
                </div>
              </div>
              <div className="risk-visualization">
                {riskData.map((risk, index) => (
                  <div
                    key={index}
                    className={`risk-item ${
                      index === currentRisk ? "active" : ""
                    }`}
                  >
                    <div className="risk-label">{risk.label}</div>
                    <div className="risk-bar">
                      <div
                        className="risk-fill"
                        style={{
                          width: `${risk.value}%`,
                          backgroundColor: risk.color,
                          animation:
                            index === currentRisk
                              ? "pulse 1s infinite"
                              : "none",
                        }}
                      ></div>
                    </div>
                    <div className="risk-value">{risk.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">Team Tracker 핵심 기능</h2>
            <p className="section-subtitle">
              대학생 팀을 위한 완벽한 프로젝트 관리 솔루션
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-badge">AI</div>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <div className="cta-stats">
              <div className="stat">
                <div className="stat-number">3초</div>
                <div className="stat-label">보고서 생성</div>
              </div>
              <div className="stat">
                <div className="stat-number">300%</div>
                <div className="stat-label">성공률 향상</div>
              </div>
              <div className="stat">
                <div className="stat-number">24/7</div>
                <div className="stat-label">AI 모니터링</div>
              </div>
            </div>
            <h2 className="cta-title">
              프로젝트 성공, 더 이상 운에 맡기지 마세요
            </h2>
            <p className="cta-subtitle">
              AI가 팀의 잠재력을 최대한 끌어내는 순간을 경험해보세요
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary">
                <span>회원가입</span>
                <div className="btn-glow"></div>
              </Link>
              <Link to="/login" className="btn btn-secondary">
                <span>로그인</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer-section">
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} Team Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
