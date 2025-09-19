import React, { useEffect, useState } from "react";
import { listClubs } from "../api/clubs";
import { listUsers, adminUpdateUser } from "../api/users";
import ClubSwitcher from "../components/ClubSwitcher";
import ClubSettings from "../components/club/ClubSettings";
import ClubStats from "../components/club/ClubStats";
import { useClub } from "../contexts/ClubContext";

export default function AdminUsers() {
  const { currentClub } = useClub();
  const [clubs, setClubs] = useState([]);
  const [clubId, setClubId] = useState("");
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    (async () => {
      const { data } = await listClubs();
      setClubs(data);
      setClubId("");
    })();
  }, []);
  useEffect(() => {
    if (currentClub) setClubId(currentClub);
  }, [currentClub]);
  useEffect(() => {
    (async () => {
      try {
        // ADMIN은 clubId가 없어도 전체 사용자 조회 가능
        const params = clubId ? { clubId, q } : { q };
        const { data } = await listUsers(params);
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
        const errorMsg =
          error?.response?.data?.message ||
          "사용자 목록을 불러오는데 실패했습니다.";
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "error", msg: errorMsg },
          })
        );
        setUsers([]);
      }
    })();
  }, [clubId, q]);

  async function save(u, idx) {
    try {
      const role = document.getElementById(`role-${idx}`).value;
      const club = document.getElementById(`club-${idx}`).value;
      const { data } = await adminUpdateUser(u._id, { role, clubId: club });

      setUsers((prev) =>
        prev.map((x) => (x._id === u._id ? data.user || data : x))
      );
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "success",
            msg: data.message || "사용자 정보가 업데이트되었습니다.",
          },
        })
      );
    } catch (error) {
      console.error("Failed to update user:", error);
      const errorMsg =
        error?.response?.data?.message ||
        "사용자 정보 업데이트에 실패했습니다.";
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: errorMsg },
        })
      );
    }
  }

  const tabs = [
    { id: "users", label: "👥 사용자 관리", component: renderUserManagement },
    {
      id: "settings",
      label: "⚙️ 동아리 설정",
      component: () => <ClubSettings />,
    },
    { id: "stats", label: "📊 통계", component: () => <ClubStats /> },
  ];

  function renderUserManagement() {
    return (
      <>
        <div
          className="card"
          style={{ display: "grid", gap: 12, marginBottom: "16px" }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <span>동아리</span>
            <select
              className="input"
              style={{ maxWidth: 240 }}
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
            >
              <option value="">전체 동아리</option>
              {clubs.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="이름/이메일 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>소속 동아리</th>
                <th>권한</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      id={`club-${idx}`}
                      defaultValue={u.clubId || ""}
                      className="input"
                    >
                      <option value="">동아리 없음</option>
                      {clubs.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      id={`role-${idx}`}
                      defaultValue={u.role}
                      className="input"
                    >
                      {["ADMIN", "EXECUTIVE", "LEADER", "MEMBER"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn" onClick={() => save(u, idx)}>
                      저장
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>ADMIN · 관리 대시보드</h1>
        {/* <ClubSwitcher /> */}
      </div>

      {/* 탭 메뉴 */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e9ecef",
          marginBottom: "20px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              border: "none",
              backgroundColor: "transparent",
              borderBottom: `3px solid ${
                activeTab === tab.id ? "#007bff" : "transparent"
              }`,
              color: activeTab === tab.id ? "#007bff" : "#636e72",
              fontWeight: activeTab === tab.id ? "600" : "400",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      <div>{tabs.find((tab) => tab.id === activeTab)?.component()}</div>
    </div>
  );
}
