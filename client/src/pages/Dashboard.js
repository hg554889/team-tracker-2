import React, { useEffect, useState } from "react";
import client from "../api/client";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import ExecutiveDashboard from "../components/dashboard/ExecutiveDashboard";
import LeaderDashboard from "../components/dashboard/LeaderDashboard";
import MemberDashboard from "../components/dashboard/MemberDashboard";
import { useAuth } from "../contexts/AuthContext";
import { useClub } from "../contexts/ClubContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { currentClub } = useClub();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const params = {};

        // ADMIN인 경우에만 currentClub을 사용 (null이면 전체 보기)
        if (user?.role === "ADMIN" && currentClub) {
          params.clubId = currentClub;
        }
        // 다른 역할은 본인 동아리 자동 필터링 (서버에서 처리)

        const { data } = await client.get("/dashboard/summary", { params });
        setSummary(data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              msg: "대시보드 데이터를 불러오는데 실패했습니다.",
            },
          })
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // clubChanged 이벤트 리스너 추가
    const handleClubChange = () => {
      loadDashboardData();
    };

    window.addEventListener("clubChanged", handleClubChange);

    return () => {
      window.removeEventListener("clubChanged", handleClubChange);
    };
  }, [currentClub, user?.role]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div
          style={{
            padding: "24px",
            maxWidth: "1280px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", color: "#636e72" }}>
            대시보드를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  // 권한별 대시보드 렌더링
  const renderDashboard = () => {
    const commonProps = {
      user,
      summary,
      loading,
      currentClub,
    };

    switch (user?.role) {
      case "ADMIN":
        return <AdminDashboard {...commonProps} />;
      case "EXECUTIVE":
        return <ExecutiveDashboard {...commonProps} />;
      case "LEADER":
        return <LeaderDashboard {...commonProps} />;
      case "MEMBER":
        return <MemberDashboard {...commonProps} />;
      default:
        return <MemberDashboard {...commonProps} />;
    }
  };

  return (
    <div className="dashboard-container">
      {renderDashboard()}

      <style jsx>{`
        .dashboard-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}
