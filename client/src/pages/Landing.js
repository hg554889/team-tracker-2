import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo">
          <h1>Team Tracker</h1>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              팀 협업을 더 쉽게, 더 효율적으로
            </h1>
            <p className="hero-subtitle">
              Team Tracker로 팀 프로젝트 관리, 진행상황 추적, 그리고 팀원 간의 소통을 한 곳에서 해결하세요.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={handleLogin}>
                로그인하고 시작하기
              </button>
              <button className="btn-secondary" onClick={handleSignup}>
                회원가입
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="mockup-dashboard">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="mockup-content">
                <div className="mockup-card">
                  <div className="mockup-line long"></div>
                  <div className="mockup-line short"></div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-line medium"></div>
                  <div className="mockup-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="features-container">
            <h2 className="features-title">주요 기능</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>프로젝트 대시보드</h3>
                <p>모든 팀 프로젝트의 진행상황을 한눈에 파악하고 관리할 수 있습니다.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3>팀 관리</h3>
                <p>팀원 초대, 역할 분배, 권한 관리를 통해 효율적인 팀 운영이 가능합니다.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <h3>보고서 작성</h3>
                <p>진행상황 보고서를 쉽게 작성하고 팀원들과 공유할 수 있습니다.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h3>실시간 소통</h3>
                <p>팀 채팅과 알림 시스템으로 실시간 협업이 가능합니다.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>AI 분석</h3>
                <p>AI를 통한 프로젝트 분석과 개선 제안으로 더 나은 성과를 달성하세요.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>진행률 추적</h3>
                <p>프로젝트 일정 관리와 마일스톤 추적으로 목표를 달성하세요.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>지금 바로 시작해보세요</h2>
            <p>Team Tracker와 함께 더 효율적인 팀 협업을 경험해보세요.</p>
            <button className="btn-primary large" onClick={handleLogin}>
              로그인하고 시작하기
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2024 Team Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}