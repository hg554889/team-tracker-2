import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data } = await client.get(`/users/${id}/profile`);
      setUser(data);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#636e72" }}>
          사용자 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#e74c3c" }}>
          사용자를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "개요", icon: "👤" },
    { id: "activity", label: "활동", icon: "📊" },
    { id: "teams", label: "팀", icon: "👥" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "24px",
          border: "1px solid #e9ecef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3498db, #2ecc71)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              color: "white",
              fontWeight: "700",
            }}
          >
            {user.username?.charAt(0)?.toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: "0 0 8px 0",
                fontSize: "28px",
                color: "#2c3e50",
              }}
            >
              {user.username}
            </h1>
            <p
              style={{
                margin: "0 0 8px 0",
                fontSize: "16px",
                color: "#636e72",
              }}
            >
              {user.email}
            </p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span
                style={{
                  background: "#3498db20",
                  color: "#3498db",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {user.role}
              </span>
              <span
                style={{
                  background: user.isActive ? "#2ecc7120" : "#95a5a620",
                  color: user.isActive ? "#2ecc71" : "#95a5a6",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {user.isActive ? "활성" : "비활성"}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            style={{
              background: "#95a5a6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ← 뒤로가기
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          marginBottom: "24px",
          border: "1px solid #e9ecef",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e9ecef",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "16px",
                border: "none",
                background: activeTab === tab.id ? "#f8f9fa" : "transparent",
                color: activeTab === tab.id ? "#3498db" : "#636e72",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid #3498db"
                    : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px" }}>
          {activeTab === "overview" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      color: "#2c3e50",
                      marginBottom: "16px",
                    }}
                  >
                    📋 기본 정보
                  </h3>
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <strong>학번:</strong> {user.studentId || "N/A"}
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <strong>동아리:</strong> {user.clubName || "N/A"}
                    </div>
                    <div>
                      <strong>가입일:</strong>{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      color: "#2c3e50",
                      marginBottom: "16px",
                    }}
                  >
                    📊 활동 통계
                  </h3>
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <strong>참여 팀:</strong> {user.teamCount || 0}개
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <strong>작성 보고서:</strong> {user.reportCount || 0}개
                    </div>
                    <div>
                      <strong>최근 활동:</strong>{" "}
                      {user.lastActivityAt
                        ? new Date(user.lastActivityAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
              <h3
                style={{
                  fontSize: "18px",
                  color: "#2c3e50",
                  marginBottom: "8px",
                }}
              >
                활동 내역
              </h3>
              <p style={{ fontSize: "14px", color: "#636e72" }}>
                사용자의 상세 활동 내역을 확인할 수 있습니다.
              </p>
            </div>
          )}

          {activeTab === "teams" && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
              <h3
                style={{
                  fontSize: "18px",
                  color: "#2c3e50",
                  marginBottom: "8px",
                }}
              >
                참여 팀 목록
              </h3>
              <p style={{ fontSize: "14px", color: "#636e72" }}>
                사용자가 참여하고 있는 팀 목록을 확인할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
