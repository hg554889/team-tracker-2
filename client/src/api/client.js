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
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    window.dispatchEvent(new CustomEvent('toast', { detail: { type:'error', msg } }));
    return Promise.reject(err);
  }
);

export default client;