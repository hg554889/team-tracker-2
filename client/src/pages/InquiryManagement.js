import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAllInquiries, updateInquiry } from "../api/inquiries";
import { useNavigate } from "react-router-dom";

export default function InquiryManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "",
    category: "",
    priority: "",
  });
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [response, setResponse] = useState("");
  const [updating, setUpdating] = useState(false);

  // Check permissions
  useEffect(() => {
    if (!user || !["ADMIN", "EXECUTIVE"].includes(user.role)) {
      navigate("/dashboard");
      return;
    }
    loadInquiries();
  }, [user, navigate]);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const { data } = await getAllInquiries(filter);
      setInquiries(data.items || []);
    } catch (err) {
      console.error("Failed to load inquiries:", err);
      setInquiries([]);

      const errorMsg =
        err?.response?.data?.message || "문의 목록을 불러오는데 실패했습니다.";
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: errorMsg },
        })
      );

      // 403 에러(동아리 미할당)인 경우 특별 처리
      if (err?.response?.status === 403) {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "warning",
              msg: "프로필에서 동아리를 선택해주세요.",
            },
          })
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ["ADMIN", "EXECUTIVE"].includes(user.role)) {
      loadInquiries();
    }
  }, [filter]);

  const handleStatusChange = async (inquiryId, newStatus) => {
    setUpdating(true);
    try {
      await updateInquiry(inquiryId, { status: newStatus });
      loadInquiries();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "상태가 업데이트되었습니다." },
        })
      );
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "상태 업데이트에 실패했습니다." },
        })
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleResponseSubmit = async () => {
    if (!selectedInquiry || !response.trim()) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "답변을 입력해주세요." },
        })
      );
      return;
    }

    setUpdating(true);
    try {
      await updateInquiry(selectedInquiry._id, {
        response: response.trim(),
        status: "resolved",
      });
      setSelectedInquiry(null);
      setResponse("");
      loadInquiries();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "답변이 저장되었습니다." },
        })
      );
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "답변 저장에 실패했습니다." },
        })
      );
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { bg: "#fef3c7", color: "#d97706" };
      case "in_progress":
        return { bg: "var(--primary-light)", color: "var(--primary)" };
      case "resolved":
        return { bg: "#dcfce7", color: "#16a34a" };
      case "closed":
        return { bg: "#f3f4f6", color: "#6b7280" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return { bg: "#fee2e2", color: "#dc2626" };
      case "high":
        return { bg: "#fef3c7", color: "#d97706" };
      case "normal":
        return { bg: "#f0fdf4", color: "#16a34a" };
      case "low":
        return { bg: "#f8fafc", color: "#64748b" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  if (!user || !["ADMIN", "EXECUTIVE"].includes(user.role)) {
    return <div className="container">권한이 없습니다.</div>;
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h1>문의 관리</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            className="input"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            style={{ width: "120px" }}
          >
            <option value="">모든 상태</option>
            <option value="pending">대기중</option>
            <option value="in_progress">처리중</option>
            <option value="resolved">해결됨</option>
            <option value="closed">종료</option>
          </select>
          <select
            className="input"
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            style={{ width: "120px" }}
          >
            <option value="">모든 카테고리</option>
            <option value="general">일반</option>
            <option value="technical">기술</option>
            <option value="account">계정</option>
            <option value="feature">기능</option>
            <option value="bug">버그</option>
            <option value="other">기타</option>
          </select>
          <select
            className="input"
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            style={{ width: "120px" }}
          >
            <option value="">모든 우선순위</option>
            <option value="urgent">긴급</option>
            <option value="high">높음</option>
            <option value="normal">보통</option>
            <option value="low">낮음</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p>문의를 불러오는 중...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
          <p>문의가 없습니다.</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>사용자</th>
                  <th>카테고리</th>
                  <th>우선순위</th>
                  <th>상태</th>
                  <th>생성일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => {
                  const statusStyle = getStatusColor(inquiry.status);
                  const priorityStyle = getPriorityColor(inquiry.priority);

                  return (
                    <tr key={inquiry._id}>
                      <td>
                        <div style={{ maxWidth: "200px" }}>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "var(--text)",
                              marginBottom: "4px",
                              cursor: "pointer",
                            }}
                            onClick={() => setSelectedInquiry(inquiry)}
                          >
                            {inquiry.title}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {inquiry.content}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: "14px" }}>
                        {inquiry.userId?.username || "알 수 없음"}
                        <br />
                        <small style={{ color: "var(--text-muted)" }}>
                          {inquiry.userId?.email || ""}
                        </small>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                            background: "var(--surface-hover)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {inquiry.category === "general"
                            ? "일반"
                            : inquiry.category === "technical"
                            ? "기술"
                            : inquiry.category === "account"
                            ? "계정"
                            : inquiry.category === "feature"
                            ? "기능"
                            : inquiry.category === "bug"
                            ? "버그"
                            : "기타"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                            background: priorityStyle.bg,
                            color: priorityStyle.color,
                          }}
                        >
                          {inquiry.priority === "urgent"
                            ? "긴급"
                            : inquiry.priority === "high"
                            ? "높음"
                            : inquiry.priority === "normal"
                            ? "보통"
                            : "낮음"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="input"
                          value={inquiry.status}
                          onChange={(e) =>
                            handleStatusChange(inquiry._id, e.target.value)
                          }
                          disabled={updating}
                          style={{
                            fontSize: "12px",
                            padding: "4px 8px",
                            minWidth: "100px",
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: "none",
                          }}
                        >
                          <option value="pending">대기중</option>
                          <option value="in_progress">처리중</option>
                          <option value="resolved">해결됨</option>
                          <option value="closed">종료</option>
                        </select>
                      </td>
                      <td
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        {new Date(inquiry.createdAt).toLocaleDateString(
                          "ko-KR"
                        )}
                      </td>
                      <td>
                        <button
                          className="btn"
                          onClick={() => {
                            setSelectedInquiry(inquiry);
                            setResponse(inquiry.response || "");
                          }}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          {inquiry.response ? "답변 수정" : "답변하기"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInquiry && (
        <div className="card" style={{ marginTop: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>문의 상세 및 답변</h3>

          <div
            style={{
              padding: "16px",
              background: "var(--surface-hover)",
              borderRadius: "var(--radius)",
              marginBottom: "16px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <strong style={{ fontSize: "16px" }}>
                {selectedInquiry.title}
              </strong>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  작성자: {selectedInquiry.userId?.username} (
                  {selectedInquiry.userId?.email})
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  작성일:{" "}
                  {new Date(selectedInquiry.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text)",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedInquiry.content}
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              관리자 답변
            </label>
            <textarea
              className="input"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="사용자에게 답변을 작성해주세요..."
              rows={6}
              style={{ marginBottom: "12px" }}
            />
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn"
                onClick={() => {
                  setSelectedInquiry(null);
                  setResponse("");
                }}
                disabled={updating}
              >
                취소
              </button>
              <button
                className="btn primary"
                onClick={handleResponseSubmit}
                disabled={updating || !response.trim()}
              >
                {updating ? "저장 중..." : "답변 저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
