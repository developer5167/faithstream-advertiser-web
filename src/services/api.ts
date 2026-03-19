import axios from 'axios';

const API_URL = 'http://192.168.15.175:9000/api';

const api = axios.create({
  baseURL: API_URL,
  // ✅ Required for HttpOnly cookies: tells the browser to include cookies
  // on every cross-origin request automatically. JS never touches the token.
  withCredentials: true,
});

export default api;
