import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import client from "../api/client";
import { updateMe, changeMyPassword } from "../api/users";
import { createRoleRequest, getMyRoleRequests } from "../api/roleRequests";
import { createInquiry, getMyInquiries } from "../api/inquiries";
import "./Profile.css";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [clubId, setClubId] = useState(user?.clubId || "");
  const [clubs, setClubs] = useState([]);
  const [saving, setSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [roleRequestOpen, setRoleRequestOpen] = useState(false);
  const [requestedRole, setRequestedRole] = useState("");
  const [reason, setReason] = useState("");
  const [roleRequestLoading, setRoleRequestLoading] = useState(false);
  const [myRoleRequests, setMyRoleRequests] = useState([]);

  // Inquiry states
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState("");
  const [inquiryContent, setInquiryContent] = useState("");
  const [inquiryCategory, setInquiryCategory] = useState("general");
  const [inquiryPriority, setInquiryPriority] = useState("normal");
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [myInquiries, setMyInquiries] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/clubs");
        setClubs(data);
      } catch {}
    })();
    loadMyRoleRequests();
    loadMyInquiries();
  }, []);

  const loadMyRoleRequests = async () => {
    try {
      const { data } = await getMyRoleRequests();
      setMyRoleRequests(data.requests);
    } catch (err) {
      console.error("Failed to load role requests:", err);
    }
  };

  const loadMyInquiries = async () => {
    try {
      const { data } = await getMyInquiries();
      setMyInquiries(data.items);
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    }
  };
  const hasClub = !!user?.clubId;

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = hasClub ? {} : { clubId }; // username 제거
      if (Object.keys(payload).length === 0 && hasClub) {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "info", msg: "변경할 내용이 없습니다." },
          })
        );
        setSaving(false);
        return;
      }
      const { data } = await updateMe(payload);
      setUser(data);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "저장되었습니다." },
        })
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitPassword() {
    if (!currentPassword || !newPassword)
      return window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "현재/새 비밀번호를 입력하세요." },
        })
      );
    if (newPassword.length < 8)
      return window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "error",
            msg: "새 비밀번호는 8자 이상이어야 합니다.",
          },
        })
      );
    if (newPassword !== newPassword2)
      return window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "새 비밀번호가 일치하지 않습니다." },
        })
      );
    setPwLoading(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setPwOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "비밀번호가 변경되었습니다." },
        })
      );
    } catch (e) {
      const msg = e.response?.data?.message || "변경에 실패했습니다.";
      window.dispatchEvent(
        new CustomEvent("toast", { detail: { type: "error", msg } })
      );
    } finally {
      setPwLoading(false);
    }
  }

  async function submitRoleRequest() {
    if (!requestedRole || !reason.trim()) {
      return window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "요청할 권한과 사유를 입력하세요." },
        })
      );
    }

    setRoleRequestLoading(true);
    try {
      await createRoleRequest({ requestedRole, reason: reason.trim() });
      setRoleRequestOpen(false);
      setRequestedRole("");
      setReason("");
      loadMyRoleRequests();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "권한 요청이 제출되었습니다." },
        })
      );
    } catch (err) {
      const msg =
        err.response?.data?.error === "You already have a pending role request"
          ? "이미 처리 중인 권한 요청이 있습니다."
          : "권한 요청에 실패했습니다.";
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg },
        })
      );
    } finally {
      setRoleRequestLoading(false);
    }
  }

  async function submitInquiry() {
    if (!inquiryTitle.trim() || !inquiryContent.trim()) {
      return window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg: "제목과 내용을 모두 입력해주세요." },
        })
      );
    }

    setInquiryLoading(true);
    try {
      await createInquiry({
        title: inquiryTitle.trim(),
        content: inquiryContent.trim(),
        category: inquiryCategory,
        priority: inquiryPriority,
      });

      setInquiryOpen(false);
      setInquiryTitle("");
      setInquiryContent("");
      setInquiryCategory("general");
      setInquiryPriority("normal");
      loadMyInquiries();

      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "문의가 성공적으로 제출되었습니다." },
        })
      );
    } catch (err) {
      const msg = err.response?.data?.message || "문의 제출에 실패했습니다.";
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", msg },
        })
      );
    } finally {
      setInquiryLoading(false);
    }
  }

  const clubName =
    clubs.find((c) => (c.key || c._id) === user?.clubId)?.name ||
    user?.clubId ||
    "-";
  const availableRoles =
    user?.role === "MEMBER"
      ? ["LEADER", "EXECUTIVE"]
      : user?.role === "LEADER"
      ? ["EXECUTIVE"]
      : [];
  const hasPendingRequest = myRoleRequests.some(
    (req) => req.status === "pending"
  );

  // Get role display name with emoji
  const getRoleDisplay = (role) => {
    switch (role) {
      case "ADMIN":
        return "🔰 관리자";
      case "EXECUTIVE":
        return "⭐ 임원";
      case "LEADER":
        return "👑 리더";
      case "MEMBER":
        return "👤 멤버";
      default:
        return role;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user?.username?.charAt(0)?.toUpperCase() || "👤"}
          </div>
          <div className="avatar-info">
            <h1>{user?.username || "사용자"}</h1>
            <p>{getRoleDisplay(user?.role)}</p>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-label">이메일</span>
            <span className="stat-value">{user?.email}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">학번</span>
            <span className="stat-value">{user?.studentId}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">동아리</span>
            <span className="stat-value">{clubName}</span>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <form onSubmit={save} className="profile-form">
          <div className="form-section">
            <h3>👤 기본 정보</h3>

            <div className="form-group">
              <label>이메일</label>
              <input
                className="form-input disabled"
                value={user?.email || ""}
                disabled
              />
            </div>

            <div className="form-group">
              <label>이름</label>
              <input
                className="form-input disabled"
                value={user?.username || ""}
                disabled
              />
              <div className="form-hint">
                ⚠️ 사용자 이름은 변경할 수 없습니다.
              </div>
            </div>

            <div className="form-group">
              <label>학번</label>
              <input
                className="form-input disabled"
                value={user?.studentId || ""}
                disabled
              />
            </div>

            <div className="form-group">
              <label>현재 권한</label>
              <input
                className="form-input disabled"
                value={getRoleDisplay(user?.role)}
                disabled
              />
            </div>

            {!hasClub ? (
              <div className="form-group">
                <label>동아리 선택 (최초 1회)</label>
                <select
                  className="form-input"
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  required
                >
                  <option value="">동아리를 선택하세요</option>
                  {clubs.map((c) => (
                    <option key={c._id || c.key} value={c.key || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="form-hint">
                  💡 동아리는 최초 1회만 선택 가능합니다.
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>동아리</label>
                <input
                  className="form-input disabled"
                  value={clubName}
                  disabled
                />
                <div className="form-hint">
                  ⚠️ 동아리는 최초 1회만 선택 가능하며 프로필에서 변경할 수
                  없습니다.
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="profile-actions">
          <h3>🛠️ 계정 관리</h3>
          <div className="action-buttons">
            <button
              className="action-btn security"
              onClick={() => setPwOpen(true)}
            >
              <span className="action-icon">🔒</span>
              <div className="action-content">
                <span className="action-title">비밀번호 변경</span>
                <span className="action-desc">
                  계정 보안을 위해 정기적으로 변경하세요
                </span>
              </div>
            </button>

            <button
              className="action-btn support"
              onClick={() => setInquiryOpen(true)}
            >
              <span className="action-icon">💬</span>
              <div className="action-content">
                <span className="action-title">문의하기</span>
                <span className="action-desc">
                  궁금한 점이나 문제가 있으면 언제든 문의하세요
                </span>
              </div>
            </button>

            {availableRoles.length > 0 && !hasPendingRequest && (
              <button
                className="action-btn role"
                onClick={() => setRoleRequestOpen(true)}
              >
                <span className="action-icon">⬆️</span>
                <div className="action-content">
                  <span className="action-title">권한 요청</span>
                  <span className="action-desc">
                    더 높은 권한이 필요하시면 요청하세요
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Password Change Modal */}
        {pwOpen && (
          <div className="modal-overlay" onClick={() => setPwOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🔒 비밀번호 변경</h3>
                <button
                  className="modal-close"
                  onClick={() => setPwOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>현재 비밀번호</label>
                  <input
                    className="form-input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호 확인</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setPwOpen(false)}
                  disabled={pwLoading}
                >
                  취소
                </button>
                <button
                  className="btn-primary"
                  onClick={submitPassword}
                  disabled={pwLoading}
                >
                  {pwLoading ? "변경 중..." : "🔑 비밀번호 변경"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Request Modal */}
        {roleRequestOpen && (
          <div
            className="modal-overlay"
            onClick={() => setRoleRequestOpen(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>⬆️ 권한 요청</h3>
                <button
                  className="modal-close"
                  onClick={() => setRoleRequestOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>요청할 권한</label>
                  <select
                    className="form-input"
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                    required
                  >
                    <option value="">권한을 선택하세요</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {getRoleDisplay(role)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>요청 사유</label>
                  <textarea
                    className="form-textarea"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="권한이 필요한 이유를 자세히 설명해주세요..."
                    rows={4}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setRoleRequestOpen(false)}
                  disabled={roleRequestLoading}
                >
                  취소
                </button>
                <button
                  className="btn-primary"
                  onClick={submitRoleRequest}
                  disabled={roleRequestLoading}
                >
                  {roleRequestLoading ? "요청 중..." : "📤 요청하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inquiry Modal */}
        {inquiryOpen && (
          <div className="modal-overlay" onClick={() => setInquiryOpen(false)}>
            <div
              className="modal-content large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>💬 문의하기</h3>
                <button
                  className="modal-close"
                  onClick={() => setInquiryOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>제목</label>
                  <input
                    className="form-input"
                    value={inquiryTitle}
                    onChange={(e) => setInquiryTitle(e.target.value)}
                    placeholder="문의 제목을 입력해주세요..."
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>카테고리</label>
                    <select
                      className="form-input"
                      value={inquiryCategory}
                      onChange={(e) => setInquiryCategory(e.target.value)}
                    >
                      <option value="general">일반 문의</option>
                      <option value="technical">기술 지원</option>
                      <option value="account">계정 관련</option>
                      <option value="feature">기능 요청</option>
                      <option value="bug">버그 신고</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>우선순위</label>
                    <select
                      className="form-input"
                      value={inquiryPriority}
                      onChange={(e) => setInquiryPriority(e.target.value)}
                    >
                      <option value="low">낮음</option>
                      <option value="normal">보통</option>
                      <option value="high">높음</option>
                      <option value="urgent">긴급</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>내용</label>
                  <textarea
                    className="form-textarea"
                    value={inquiryContent}
                    onChange={(e) => setInquiryContent(e.target.value)}
                    placeholder="문의 내용을 자세히 작성해주세요..."
                    rows={6}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setInquiryOpen(false)}
                  disabled={inquiryLoading}
                >
                  취소
                </button>
                <button
                  className="btn-primary"
                  onClick={submitInquiry}
                  disabled={inquiryLoading}
                >
                  {inquiryLoading ? "제출 중..." : "📩 문의하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Requests History */}
        {myRoleRequests.length > 0 && (
          <div className="history-section">
            <h3>📋 권한 요청 내역</h3>
            <div className="history-list">
              {myRoleRequests.map((request) => (
                <div key={request._id} className="history-item">
                  <div className="history-header">
                    <div className="history-title">
                      <strong>
                        {getRoleDisplay(request.currentRole)} →{" "}
                        {getRoleDisplay(request.requestedRole)}
                      </strong>
                      <span className={`status-badge ${request.status}`}>
                        {request.status === "pending"
                          ? "⏳ 대기중"
                          : request.status === "approved"
                          ? "✅ 승인됨"
                          : "❌ 거절됨"}
                      </span>
                    </div>
                    <span className="history-date">
                      {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="history-content">
                    <strong>사유:</strong> {request.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inquiries History */}
        {myInquiries.length > 0 && (
          <div className="history-section">
            <h3>💬 문의 내역</h3>
            <div className="history-list">
              {myInquiries.map((inquiry) => (
                <div key={inquiry._id} className="history-item inquiry">
                  <div className="history-header">
                    <div className="history-title">
                      <strong>{inquiry.title}</strong>
                      <div className="inquiry-badges">
                        <span className="category-badge">
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
                        <span className={`status-badge ${inquiry.status}`}>
                          {inquiry.status === "pending"
                            ? "⏳ 대기중"
                            : inquiry.status === "in_progress"
                            ? "🔄 처리중"
                            : inquiry.status === "resolved"
                            ? "✅ 해결됨"
                            : "🔒 종료"}
                        </span>
                        <span className={`priority-badge ${inquiry.priority}`}>
                          {inquiry.priority === "urgent"
                            ? "🔥 긴급"
                            : inquiry.priority === "high"
                            ? "⚠️ 높음"
                            : inquiry.priority === "normal"
                            ? "📝 보통"
                            : "💭 낮음"}
                        </span>
                      </div>
                    </div>
                    <span className="history-date">
                      {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="history-content">
                    {inquiry.content.length > 150
                      ? inquiry.content.substring(0, 150) + "..."
                      : inquiry.content}
                  </div>
                  {inquiry.response && (
                    <div className="response-section">
                      <div className="response-header">
                        <strong>🎯 관리자 답변:</strong>
                      </div>
                      <div className="response-content">{inquiry.response}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
