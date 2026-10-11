import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

// if token expired / invalid -> clear and go to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onLoginCall = err.config && err.config.url === "/auth/login";
    if (err.response && err.response.status === 401 && !onLoginCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// small helper to get error text from api error
export function getErrorMsg(err) {
  if (err.response && err.response.data && err.response.data.message) {
    return err.response.data.message;
  }
  return "Server not reachable, try again";
}

export default api;
