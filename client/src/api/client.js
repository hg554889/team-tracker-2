import axios from "axios";

const isProduction = window.location.hostname !== "localhost";
const apiUrl = isProduction
  ? process.env.REACT_APP_PRODUCTION_API_URL ||
    "https://hollow-jeanna-akjp-dea9c7c9.koyeb.app/api"
  : process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const client = axios.create({ baseURL: apiUrl });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    let msg =
      err.response?.data?.message || err.response?.data?.error || err.message;

    // 403 권한 오류
    if (err.response?.status === 403) {
      const errorType = err.response?.data?.error;
      if (errorType === "Forbidden") {
        msg = "해당 리소스에 접근할 권한이 없습니다.";
      } else if (errorType === "ApprovalRequired") {
        msg = "계정이 승인되어야 이용할 수 있습니다.";
      } else if (errorType === "Access denied to this team") {
        msg = "이 팀 정보에 접근할 권한이 없습니다.";
      } else if (errorType === "Access denied to this report") {
        msg = "이 보고서에 접근할 권한이 없습니다.";
      } else if (errorType === "Access denied to modify this team") {
        msg = "이 팀을 수정할 권한이 없습니다.";
      } else if (errorType === "Access denied to modify this report") {
        msg = "이 보고서를 수정할 권한이 없습니다.";
      } else {
        msg = "접근 권한이 없습니다.";
      }
    }

    // 400 잘못된 요청 (검증 오류 포함)
    if (err.response?.status === 400) {
      const errorType = err.response?.data?.error;
      if (errorType === "UserNotFound") {
        msg = err.response.data.message || "사용자를 찾을 수 없습니다.";
      } else if (errorType === "UserNotApproved") {
        msg = err.response.data.message || "승인되지 않은 사용자입니다.";
      } else if (errorType === "DifferentClub") {
        msg =
          err.response.data.message ||
          "같은 동아리의 사용자만 초대할 수 있습니다.";
      } else if (errorType === "AlreadyMember") {
        msg = err.response.data.message || "이미 멤버입니다.";
      } else if (errorType === "AlreadyLeader") {
        msg = err.response.data.message || "이미 리더입니다.";
      } else if (errorType === "ValidationError") {
        const details = err.response?.data?.details;
        const fieldErrors = details?.fieldErrors || {};
        const firstKey = Object.keys(fieldErrors)[0];
        const firstMsg =
          firstKey && Array.isArray(fieldErrors[firstKey])
            ? fieldErrors[firstKey][0]
            : null;
        const labels = {
          email: "이메일",
          username: "사용자명",
          password: "비밀번호",
          studentId: "학번",
          clubId: "동아리",
        };
        if (firstKey) {
          msg =
            firstMsg ||
            `입력값이 유효하지 않습니다: ${labels[firstKey] || firstKey}`;
        } else {
          msg = "입력값이 유효하지 않습니다. 다시 확인해 주세요.";
        }
      }
    }

    // 404 리소스 없음
    if (err.response?.status === 404) {
      const errorType = err.response?.data?.error;
      if (errorType === "UserNotFound") {
        msg =
          err.response.data.message ||
          "해당 이메일의 사용자를 찾을 수 없습니다.";
      } else if (errorType === "TeamNotFound") {
        msg = "팀을 찾을 수 없습니다.";
      }
    }

    // 401 인증 오류
    if (err.response?.status === 401) {
      const errorType = err.response?.data?.error;
      if (errorType === "InvalidCredentials") {
        msg = "로그인 정보가 일치하지 않습니다.";
      } else if (errorType === "Unauthorized") {
        msg = "인증이 필요합니다. 다시 로그인해 주세요.";
      }
    }

    // 409 충돌 (중복 등)
    if (err.response?.status === 409) {
      const errorType = err.response?.data?.error;
      if (errorType === "EmailInUse") {
        msg = "이미 사용 중인 이메일입니다.";
      } else if (errorType === "StudentIdInUse") {
        msg = "이미 사용 중인 학번입니다.";
      }
    }

    // 429 과도한 요청 (레이트 리미트)
    if (err.response?.status === 429) {
      msg = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    }

    window.dispatchEvent(
      new CustomEvent("toast", { detail: { type: "error", msg } })
    );
    return Promise.reject(err);
  }
);

export default client;
