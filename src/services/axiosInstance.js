import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7290';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Crucial for sending HttpOnly Refresh Token cookie
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach the current Access Token from memory
let getAccessTokenFn = () => null;

export const setAccessTokenTracker = (fn) => {
  getAccessTokenFn = fn;
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessTokenFn();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and trigger automatic refresh rotation
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if auth endpoints fail
    if (originalRequest.url.includes('Auth/Login') || originalRequest.url.includes('Auth/refresh-token')) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axios
          .post(`${API_URL}/api/Auth/refresh-token`, {}, { withCredentials: true })
          .then((res) => {
            if (res.data && res.data.success) {
              const newAccessToken = res.data.data.accessToken;
              processQueue(null, newAccessToken);
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              resolve(axiosInstance(originalRequest));
            } else {
              processQueue(new Error('Refresh failed'), null);
              window.dispatchEvent(new Event('session-expired'));
              reject(error);
            }
          })
          .catch((err) => {
            processQueue(err, null);
            window.dispatchEvent(new Event('session-expired'));
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
