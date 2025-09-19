import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: "Team Tracker",
    allowRegistration: true,
    requireApproval: true,
    maxTeamsPerUser: 5,
    reportSubmissionDeadline: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data } = await client.get("/admin/settings");
      setSettings({ ...settings, ...data });
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.put("/admin/settings", settings);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "설정이 저장되었습니다." },
        })
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#636e72" }}>
          시스템 설정을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "32px",
            color: "#2c3e50",
            fontWeight: "700",
          }}
        >
          ⚙️ 시스템 설정
        </h1>
        <p style={{ margin: 0, fontSize: "16px", color: "#636e72" }}>
          전체 시스템 환경 설정 및 관리
        </p>
      </div>

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
          style={{ fontSize: "20px", color: "#2c3e50", marginBottom: "24px" }}
        >
          🏢 사이트 설정
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#2c3e50",
            }}
          >
            사이트 이름
          </label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) =>
              setSettings({ ...settings, siteName: e.target.value })
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
        </div>
      </div>

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
          style={{ fontSize: "20px", color: "#2c3e50", marginBottom: "24px" }}
        >
          👥 사용자 관리 설정
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "14px",
              color: "#2c3e50",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={settings.allowRegistration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allowRegistration: e.target.checked,
                })
              }
              style={{ marginRight: "8px" }}
            />
            신규 사용자 가입 허용
          </label>
          <p
            style={{
              fontSize: "12px",
              color: "#636e72",
              margin: "4px 0 0 24px",
            }}
          >
            체크 해제 시 새로운 사용자의 회원가입이 차단됩니다
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "14px",
              color: "#2c3e50",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={settings.requireApproval}
              onChange={(e) =>
                setSettings({ ...settings, requireApproval: e.target.checked })
              }
              style={{ marginRight: "8px" }}
            />
            신규 사용자 승인 필요
          </label>
          <p
            style={{
              fontSize: "12px",
              color: "#636e72",
              margin: "4px 0 0 24px",
            }}
          >
            새로 가입한 사용자는 관리자 승인 후 서비스 이용 가능
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#2c3e50",
            }}
          >
            사용자당 최대 팀 생성 수
          </label>
          <input
            type="number"
            value={settings.maxTeamsPerUser}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxTeamsPerUser: parseInt(e.target.value),
              })
            }
            style={{
              width: "120px",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
            }}
            min="1"
            max="20"
          />
          <p
            style={{ fontSize: "12px", color: "#636e72", margin: "4px 0 0 0" }}
          >
            개별 사용자가 생성할 수 있는 팀의 최대 개수
          </p>
        </div>
      </div>

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
          style={{ fontSize: "20px", color: "#2c3e50", marginBottom: "24px" }}
        >
          📊 보고서 설정
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#2c3e50",
            }}
          >
            보고서 제출 기한 (일)
          </label>
          <input
            type="number"
            value={settings.reportSubmissionDeadline}
            onChange={(e) =>
              setSettings({
                ...settings,
                reportSubmissionDeadline: parseInt(e.target.value),
              })
            }
            style={{
              width: "120px",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
            }}
            min="1"
            max="30"
          />
          <p
            style={{ fontSize: "12px", color: "#636e72", margin: "4px 0 0 0" }}
          >
            보고서 작성 후 제출까지의 기본 기한
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? "#95a5a6" : "#3498db",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "저장 중..." : "설정 저장"}
        </button>
      </div>
    </div>
  );
}
