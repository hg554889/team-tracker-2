import axios from 'axios';

const client = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api' });

client.interceptors.request.use((config)=>{
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res)=>res,
  (err)=>{
    let msg = err.response?.data?.message || err.response?.data?.error || err.message;
    
    // 403 에러에 대한 사용자 친화적 메시지 처리
    if (err.response?.status === 403) {
      const errorType = err.response?.data?.error;
      if (errorType === 'Forbidden') {
        msg = '해당 리소스에 접근할 권한이 없습니다.';
      } else if (errorType === 'Access denied to this team') {
        msg = '이 팀의 정보에 접근할 권한이 없습니다.';
      } else if (errorType === 'Access denied to this report') {
        msg = '이 보고서에 접근할 권한이 없습니다.';
      } else if (errorType === 'Access denied to modify this team') {
        msg = '이 팀을 수정할 권한이 없습니다.';
      } else if (errorType === 'Access denied to modify this report') {
        msg = '이 보고서를 수정할 권한이 없습니다.';
      } else {
        msg = '접근 권한이 없습니다.';
      }
    }
    
    window.dispatchEvent(new CustomEvent('toast', { detail: { type:'error', msg } }));
    return Promise.reject(err);
  }
);

export default client;