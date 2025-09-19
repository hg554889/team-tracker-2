import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function TaskManagement() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await client.get("/tasks");
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await client.post("/tasks", newTask);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
      setShowCreateModal(false);
      loadTasks();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", msg: "작업이 생성되었습니다." },
        })
      );
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await client.put(`/tasks/${taskId}`, { status });
      loadTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#e74c3c";
      case "medium":
        return "#f39c12";
      case "low":
        return "#2ecc71";
      default:
        return "#95a5a6";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#2ecc71";
      case "in_progress":
        return "#3498db";
      case "pending":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    switch (activeFilter) {
      case "pending":
        return task.status === "pending";
      case "in_progress":
        return task.status === "in_progress";
      case "completed":
        return task.status === "completed";
      case "overdue":
        return (
          new Date(task.dueDate) < new Date() && task.status !== "completed"
        );
      default:
        return true;
    }
  });

  const filters = [
    { id: "all", label: "전체", count: tasks.length },
    {
      id: "pending",
      label: "대기",
      count: tasks.filter((t) => t.status === "pending").length,
    },
    {
      id: "in_progress",
      label: "진행중",
      count: tasks.filter((t) => t.status === "in_progress").length,
    },
    {
      id: "completed",
      label: "완료",
      count: tasks.filter((t) => t.status === "completed").length,
    },
    {
      id: "overdue",
      label: "지연",
      count: tasks.filter(
        (t) => new Date(t.dueDate) < new Date() && t.status !== "completed"
      ).length,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#636e72" }}>
          작업 목록을 불러오는 중...
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
            📋 작업 관리
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "#636e72" }}>
            내 작업과 할 일을 효율적으로 관리하세요
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: "#2ecc71",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            + 새 작업
          </button>
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

      {/* 필터 탭 */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid #e9ecef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                padding: "10px 16px",
                border: "none",
                background:
                  activeFilter === filter.id ? "#3498db" : "transparent",
                color: activeFilter === filter.id ? "white" : "#636e72",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {filter.label}
              <span
                style={{
                  background:
                    activeFilter === filter.id
                      ? "rgba(255,255,255,0.3)"
                      : "#e9ecef",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 작업 목록 */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #e9ecef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
            <h3
              style={{
                fontSize: "18px",
                color: "#2c3e50",
                marginBottom: "8px",
              }}
            >
              {activeFilter === "all"
                ? "작업이 없습니다"
                : `${
                    filters.find((f) => f.id === activeFilter)?.label
                  } 작업이 없습니다`}
            </h3>
            <p style={{ fontSize: "14px", color: "#636e72" }}>
              새로운 작업을 만들어 시작해보세요
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                style={{
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  padding: "20px",
                  transition: "all 0.2s ease",
                  borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        color: "#2c3e50",
                        margin: "0 0 8px 0",
                        fontWeight: "600",
                      }}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#636e72",
                          margin: "0 0 12px 0",
                          lineHeight: 1.5,
                        }}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        background: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority),
                        fontWeight: "600",
                      }}
                    >
                      {task.priority}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleUpdateTaskStatus(task._id, e.target.value)
                      }
                      style={{
                        padding: "4px 8px",
                        border: `1px solid ${getStatusColor(task.status)}`,
                        borderRadius: "4px",
                        fontSize: "12px",
                        background: "white",
                        color: getStatusColor(task.status),
                      }}
                    >
                      <option value="pending">대기</option>
                      <option value="in_progress">진행중</option>
                      <option value="completed">완료</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "#95a5a6",
                  }}
                >
                  <span>
                    생성일: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                  {task.dueDate && (
                    <span
                      style={{
                        color:
                          new Date(task.dueDate) < new Date() &&
                          task.status !== "completed"
                            ? "#e74c3c"
                            : "#95a5a6",
                      }}
                    >
                      마감: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 작업 생성 모달 */}
      {showCreateModal && (
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
              새 작업 만들기
            </h2>

            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "#2c3e50",
                  }}
                >
                  작업 제목
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
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

              <div style={{ marginBottom: "16px" }}>
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
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
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
                  placeholder="작업에 대한 상세한 설명을 입력하세요"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      color: "#2c3e50",
                    }}
                  >
                    우선순위
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "14px",
                      background: "white",
                    }}
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      color: "#2c3e50",
                    }}
                  >
                    마감일
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
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
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                    background: "#2ecc71",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
