import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: "", description: "" });

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const { data } = await client.get("/admin/clubs");
      setClubs(data);
    } catch (error) {
      console.error("Failed to load clubs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClub = async (e) => {
    e.preventDefault();
    try {
      await client.post("/admin/clubs", newClub);
      setNewClub({ name: "", description: "" });
      setShowAddModal(false);
      loadClubs();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "동아리가 생성되었습니다." },
        })
      );
    } catch (error) {
      console.error("Failed to create club:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#636e72" }}>
          동아리 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
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
            🏛️ 동아리 관리
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "#636e72" }}>
            전체 동아리 현황 관리 및 설정
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          + 새 동아리 추가
        </button>
      </div>

      {/* 동아리 목록 */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #e9ecef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "grid", gap: "16px" }}>
          {clubs.map((club) => (
            <div
              key={club._id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                background: "#f8f9fa",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                    color: "#2c3e50",
                  }}
                >
                  {club.name}
                </h3>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "14px",
                    color: "#636e72",
                  }}
                >
                  {club.description || "설명 없음"}
                </p>
                <div style={{ fontSize: "12px", color: "#95a5a6" }}>
                  생성일: {new Date(club.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "14px",
                  color: "#636e72",
                }}
              >
                <span>멤버 {club.memberCount || 0}명</span>
                <span>팀 {club.teamCount || 0}개</span>
              </div>
            </div>
          ))}
        </div>

        {clubs.length === 0 && (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#95a5a6" }}
          >
            등록된 동아리가 없습니다.
          </div>
        )}
      </div>

      {/* 동아리 추가 모달 */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              margin: "20px",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: "20px",
                color: "#2c3e50",
              }}
            >
              새 동아리 추가
            </h2>

            <form onSubmit={handleAddClub}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "#2c3e50",
                  }}
                >
                  동아리명
                </label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={(e) =>
                    setNewClub({ ...newClub, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "#2c3e50",
                  }}
                >
                  설명
                </label>
                <textarea
                  value={newClub.description}
                  onChange={(e) =>
                    setNewClub({ ...newClub, description: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  placeholder="동아리에 대한 설명을 입력하세요"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "#95a5a6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#3498db",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
