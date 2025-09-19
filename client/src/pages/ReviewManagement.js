import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function ReviewManagement() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const { data } = await client.get("/reviews");
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (reviewId, action, comment = "") => {
    try {
      await client.post(`/reviews/${reviewId}/${action}`, { comment });
      loadReviews();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "success",
            msg: `리뷰가 ${action === "approve" ? "승인" : "거절"}되었습니다.`,
          },
        })
      );
    } catch (error) {
      console.error("Failed to process review:", error);
    }
  };

  const getReviewTypeColor = (type) => {
    switch (type) {
      case "code":
        return "#3498db";
      case "document":
        return "#9b59b6";
      case "design":
        return "#e74c3c";
      case "report":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#2ecc71";
      case "rejected":
        return "#e74c3c";
      case "pending":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const filteredReviews = reviews.filter((review) => {
    switch (activeTab) {
      case "pending":
        return review.status === "pending";
      case "completed":
        return ["approved", "rejected"].includes(review.status);
      case "my_requests":
        return review.requesterId === "currentUserId"; // 실제 구현시 현재 사용자 ID 사용
      default:
        return true;
    }
  });

  const tabs = [
    {
      id: "pending",
      label: "대기중",
      count: reviews.filter((r) => r.status === "pending").length,
    },
    {
      id: "completed",
      label: "완료됨",
      count: reviews.filter((r) => ["approved", "rejected"].includes(r.status))
        .length,
    },
    {
      id: "my_requests",
      label: "내 요청",
      count: reviews.filter((r) => r.requesterId === "currentUserId").length,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#636e72" }}>
          리뷰 목록을 불러오는 중...
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
            👀 리뷰 관리
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "#636e72" }}>
            코드, 문서, 디자인 등의 리뷰를 관리하세요
          </p>
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

      {/* 탭 네비게이션 */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          marginBottom: "24px",
          border: "1px solid #e9ecef",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", borderBottom: "1px solid #e9ecef" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "16px",
                border: "none",
                background: activeTab === tab.id ? "#f8f9fa" : "white",
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
              {tab.label}
              <span
                style={{
                  background: activeTab === tab.id ? "#3498db20" : "#e9ecef",
                  color: activeTab === tab.id ? "#3498db" : "#636e72",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #e9ecef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {filteredReviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>👀</div>
            <h3
              style={{
                fontSize: "18px",
                color: "#2c3e50",
                marginBottom: "8px",
              }}
            >
              {activeTab === "pending"
                ? "대기중인 리뷰가 없습니다"
                : activeTab === "completed"
                ? "완료된 리뷰가 없습니다"
                : "요청한 리뷰가 없습니다"}
            </h3>
            <p style={{ fontSize: "14px", color: "#636e72" }}>
              새로운 리뷰 요청이 들어올 때까지 기다려주세요
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {filteredReviews.map((review) => (
              <div
                key={review._id}
                style={{
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  padding: "24px",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          color: "#2c3e50",
                          margin: 0,
                          fontWeight: "600",
                        }}
                      >
                        {review.title}
                      </h3>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          background: `${getReviewTypeColor(review.type)}20`,
                          color: getReviewTypeColor(review.type),
                          fontWeight: "600",
                        }}
                      >
                        {review.type}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          background: `${getStatusColor(review.status)}20`,
                          color: getStatusColor(review.status),
                          fontWeight: "600",
                        }}
                      >
                        {review.status === "pending"
                          ? "대기중"
                          : review.status === "approved"
                          ? "승인됨"
                          : "거절됨"}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "14px",
                        color: "#636e72",
                        margin: "0 0 12px 0",
                        lineHeight: 1.5,
                      }}
                    >
                      {review.description}
                    </p>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#95a5a6",
                        display: "flex",
                        gap: "16px",
                      }}
                    >
                      <span>요청자: {review.requesterName}</span>
                      <span>
                        요청일:{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {review.dueDate && (
                        <span>
                          마감: {new Date(review.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 첨부 파일 */}
                {review.attachments && review.attachments.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        color: "#2c3e50",
                        marginBottom: "8px",
                      }}
                    >
                      첨부 파일:
                    </h4>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {review.attachments.map((file, index) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "#f8f9fa",
                            border: "1px solid #e9ecef",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            color: "#3498db",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          📎 {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 (대기중인 리뷰만) */}
                {review.status === "pending" && activeTab === "pending" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => handleReviewAction(review._id, "reject")}
                      style={{
                        background: "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      거절
                    </button>
                    <button
                      onClick={() => handleReviewAction(review._id, "approve")}
                      style={{
                        background: "#2ecc71",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      승인
                    </button>
                  </div>
                )}

                {/* 리뷰 결과 (완료된 리뷰) */}
                {review.status !== "pending" && review.reviewComment && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      background:
                        review.status === "approved" ? "#f0fff0" : "#fff5f5",
                      border: `1px solid ${
                        review.status === "approved" ? "#d4edda" : "#fed7d7"
                      }`,
                      borderRadius: "8px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "14px",
                        color: "#2c3e50",
                        margin: "0 0 8px 0",
                      }}
                    >
                      리뷰 결과:
                    </h4>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#636e72",
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {review.reviewComment}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
