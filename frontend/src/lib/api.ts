import axios from "axios";

const api = axios.create({
  baseURL: "https://lms-2-zj5o.onrender.com/api",
});

// attach token to every request if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
