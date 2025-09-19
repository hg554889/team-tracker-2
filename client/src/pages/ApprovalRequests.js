import React, { useState, useEffect } from "react";
import { getPendingApprovals, approveUser, rejectUser } from "../api/approvals";
import { getRoleRequests, processRoleRequest } from "../api/roleRequests";

export default function ApprovalRequests() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'roles'

  useEffect(() => {
    loadPendingUsers();
    loadRoleRequests();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const res = await getPendingApprovals();
      setPendingUsers(res.data.users);
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "error",
            msg: "승인 요청 목록을 불러오는데 실패했습니다.",
          },
        })
      );
    }
  };

  const loadRoleRequests = async () => {
    try {
      const res = await getRoleRequests();
      setRoleRequests(res.data.requests);
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "error",
            msg: "권한 요청 목록을 불러오는데 실패했습니다.",
          },
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await approveUser(userId);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "사용자가 승인되었습니다." },
        })
      );
      loadPendingUsers();
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "승인 처리에 실패했습니다." },
        })
      );
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("정말로 이 사용자를 거절하시겠습니까?")) return;

    try {
      await rejectUser(userId);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "사용자가 거절되었습니다." },
        })
      );
      loadPendingUsers();
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "거절 처리에 실패했습니다." },
        })
      );
    }
  };

  const handleRoleRequestProcess = async (requestId, action) => {
    try {
      const { data } = await processRoleRequest(requestId, action);

      // 서버에서 새 토큰을 반환한 경우 처리
      if (data.newToken) {
        localStorage.setItem("token", data.newToken);
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "info",
              msg:
                data.message ||
                "권한이 변경되었습니다. 페이지를 새로고침합니다.",
            },
          })
        );
        // 잠시 후 페이지 새로고침
        setTimeout(() => window.location.reload(), 2000);
      } else {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "success",
              msg: `권한 요청이 ${
                action === "approve" ? "승인" : "거절"
              }되었습니다.`,
            },
          })
        );
        loadRoleRequests();
      }
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "권한 요청 처리에 실패했습니다." },
        })
      );
    }
  };

  if (loading) {
    return <div className="container">로딩 중...</div>;
  }

  return (
    <div className="container">
      <h1>승인 요청 관리</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          className={`btn ${activeTab === "users" ? "primary" : "secondary"}`}
          onClick={() => setActiveTab("users")}
          style={{ marginRight: "8px" }}
        >
          사용자 승인 ({pendingUsers.length})
        </button>
        <button
          className={`btn ${activeTab === "roles" ? "primary" : "secondary"}`}
          onClick={() => setActiveTab("roles")}
        >
          권한 요청 ({roleRequests.length})
        </button>
      </div>

      {activeTab === "users" && (
        <>
          {pendingUsers.length === 0 ? (
            <div className="card">
              <p>대기 중인 사용자 승인 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="card">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>
                      이메일
                    </th>
                    <th style={{ padding: "12px", textAlign: "left" }}>
                      사용자명
                    </th>
                    <th style={{ padding: "12px", textAlign: "left" }}>학번</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>
                      가입일
                    </th>
                    <th style={{ padding: "12px", textAlign: "left" }}>동작</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr
                      key={user._id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "12px" }}>{user.email}</td>
                      <td style={{ padding: "12px" }}>{user.username}</td>
                      <td style={{ padding: "12px" }}>{user.studentId}</td>
                      <td style={{ padding: "12px" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="btn primary"
                            style={{ fontSize: "12px", padding: "4px 8px" }}
                            onClick={() => handleApprove(user._id)}
                          >
                            승인
                          </button>
                          <button
                            className="btn secondary"
                            style={{ fontSize: "12px", padding: "4px 8px" }}
                            onClick={() => handleReject(user._id)}
                          >
                            거절
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "roles" && (
        <>
          {roleRequests.length === 0 ? (
            <div className="card">
              <p>대기 중인 권한 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="card">
              {roleRequests.map((request) => (
                <div
                  key={request._id}
                  style={{
                    padding: "16px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>{request.userId.username}</strong> (
                        {request.userId.email})
                        <br />
                        <span style={{ color: "#666", fontSize: "14px" }}>
                          학번: {request.userId.studentId}
                        </span>
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <span
                          style={{
                            padding: "2px 6px",
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                            borderRadius: "3px",
                            fontSize: "12px",
                          }}
                        >
                          {request.currentRole} → {request.requestedRole}
                        </span>
                      </div>
                      <div style={{ marginBottom: "8px", fontSize: "14px" }}>
                        <strong>요청 사유:</strong>
                        <br />
                        {request.reason}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        요청일:{" "}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginLeft: "16px",
                      }}
                    >
                      <button
                        className="btn primary"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                        onClick={() =>
                          handleRoleRequestProcess(request._id, "approve")
                        }
                      >
                        승인
                      </button>
                      <button
                        className="btn secondary"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                        onClick={() =>
                          handleRoleRequestProcess(request._id, "reject")
                        }
                      >
                        거절
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
