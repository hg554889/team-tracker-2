import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await client.get(
        `/admin/analytics?period=${selectedPeriod}`
      );
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#636e72" }}>
          분석 데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  const mockData = {
    userGrowth: [
      { date: "2024-01-01", users: 150 },
      { date: "2024-01-15", users: 175 },
      { date: "2024-01-30", users: 200 },
    ],
    teamActivity: {
      active: 45,
      inactive: 12,
      total: 57,
    },
    reportStats: {
      submitted: 234,
      pending: 18,
      overdue: 5,
    },
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "32px",
              color: "#2c3e50",
              fontWeight: "700",
            }}
          >
            📈 시스템 분석
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "#636e72" }}>
            전체 시스템 활동 및 성과 분석
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          style={{
            padding: "8px 16px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "14px",
            background: "white",
          }}
        >
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
          <option value="90d">최근 90일</option>
          <option value="1y">최근 1년</option>
        </select>
      </div>

      {/* 주요 지표 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e9ecef",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "32px", marginRight: "12px" }}>👥</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#2c3e50" }}>
                전체 사용자
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#636e72" }}>
                등록된 사용자 수
              </p>
            </div>
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "700", color: "#3498db" }}
          >
            {mockData.userGrowth[mockData.userGrowth.length - 1]?.users || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#27ae60", marginTop: "4px" }}>
            ↗ +25 (지난 달 대비)
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e9ecef",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "32px", marginRight: "12px" }}>🚀</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#2c3e50" }}>
                활성 팀
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#636e72" }}>
                활동 중인 팀
              </p>
            </div>
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "700", color: "#2ecc71" }}
          >
            {mockData.teamActivity.active}
          </div>
          <div style={{ fontSize: "12px", color: "#f39c12", marginTop: "4px" }}>
            총 {mockData.teamActivity.total}팀 중
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e9ecef",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "32px", marginRight: "12px" }}>📊</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#2c3e50" }}>
                제출된 보고서
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#636e72" }}>
                이번 달 제출
              </p>
            </div>
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "700", color: "#9b59b6" }}
          >
            {mockData.reportStats.submitted}
          </div>
          <div style={{ fontSize: "12px", color: "#e74c3c", marginTop: "4px" }}>
            {mockData.reportStats.overdue}개 지연
          </div>
        </div>
      </div>

      {/* 사용자 증가 추이 */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #e9ecef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{ fontSize: "20px", color: "#2c3e50", marginBottom: "20px" }}
        >
          📈 사용자 증가 추이
        </h2>
        <div
          style={{
            height: "200px",
            display: "flex",
            alignItems: "end",
            justifyContent: "space-around",
            background: "#f8f9fa",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          {mockData.userGrowth.map((item, index) => (
            <div key={index} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "60px",
                  height: `${(item.users / 250) * 150}px`,
                  background: "#3498db",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              />
              <div style={{ fontSize: "12px", color: "#636e72" }}>
                {new Date(item.date).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#2c3e50",
                }}
              >
                {item.users}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 팀 활동 현황 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #e9ecef",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{ fontSize: "20px", color: "#2c3e50", marginBottom: "20px" }}
          >
            🎯 팀 활동 현황
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                background: `conic-gradient(#2ecc71 0deg ${
                  (mockData.teamActivity.active / mockData.teamActivity.total) *
                  360
                }deg, #e74c3c ${
                  (mockData.teamActivity.active / mockData.teamActivity.total) *
                  360
                }deg 360deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  background: "white",
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#2c3e50",
                  }}
                >
                  {Math.round(
                    (mockData.teamActivity.active /
                      mockData.teamActivity.total) *
                      100
                  )}
                  %
                </div>
                <div style={{ fontSize: "12px", color: "#636e72" }}>활성</div>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "#2ecc71",
                  borderRadius: "50%",
                }}
              />
              <span style={{ fontSize: "14px", color: "#636e72" }}>
                활성 ({mockData.teamActivity.active})
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "#e74c3c",
                  borderRadius: "50%",
                }}
              />
              <span style={{ fontSize: "14px", color: "#636e72" }}>
                비활성 ({mockData.teamActivity.inactive})
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #e9ecef",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{ fontSize: "20px", color: "#2c3e50", marginBottom: "20px" }}
          >
            📋 보고서 현황
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#2c3e50" }}>제출됨</span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#2ecc71",
                }}
              >
                {mockData.reportStats.submitted}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "#fff3cd",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#2c3e50" }}>
                대기 중
              </span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#f39c12",
                }}
              >
                {mockData.reportStats.pending}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "#f8d7da",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#2c3e50" }}>지연</span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#e74c3c",
                }}
              >
                {mockData.reportStats.overdue}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
