import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      // 다른 탭에 로그인 알림
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "token",
          newValue: res.data.token,
          oldValue: localStorage.getItem("token"),
        })
      );

      const user = res.data.user;
      if (user.approvalStatus === "pending") {
        nav("/approval-pending");
      } else if (user.approvalStatus === "rejected") {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              msg: "계정이 거절되었습니다. 관리자에게 문의하세요.",
            },
          })
        );
        localStorage.removeItem("token");
        setUser(null);
        return;
      } else {
        nav(user.clubId ? "/" : "/select-club");
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "success", msg: "로그인 성공" },
          })
        );
      }
    } catch {}
  }

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <h1>Team Tracker</h1>
            </div>
            <h2>로그인</h2>
            <p>계정에 로그인하여 팀 협업을 시작하세요</p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <div className="form-group">
              <label>이메일</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label>비밀번호</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <button className="auth-button" type="submit">
              로그인
            </button>

            <div className="auth-footer">
              <p>
                계정이 없나요?{" "}
                <Link to="/signup" className="auth-link">
                  가입하기
                </Link>
              </p>
              <p>
                <Link to="/" className="auth-link">
                  ← 홈으로 돌아가기
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
