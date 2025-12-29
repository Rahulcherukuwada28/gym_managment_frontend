import axios from 'axios';

// ✅ SMART SWITCH:
// If running on your laptop (localhost), use your local IP.
// If running on Vercel (internet), use the Render Backend.
const BASE_URL = window.location.hostname === 'localhost'
    ? 'http://192.168.1.5:8000/api/'
    : 'https://gym-management-system-mudh.onrender.com/api/';

// 1. Create the Instance
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Request Interceptor (Automatically attaches token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Response Interceptor (Auto-Refresh Logic)
api.interceptors.response.use(
    (response) => response, // Return success responses directly
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 (Unauthorized) and we haven't retried yet
        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true; // Mark as retried

            const refreshToken = localStorage.getItem('refresh');

            if (refreshToken) {
                try {
                    // ✅ FIXED: Uses the dynamic BASE_URL to refresh the token
                    const response = await axios.post(`${BASE_URL}token/refresh/`, {
                        refresh: refreshToken
                    });

                    // Save new token
                    const newAccessToken = response.data.access;
                    localStorage.setItem('access', newAccessToken);

                    // Retry the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest); 

                } catch (refreshError) {
                    console.error("Session expired. Please login again.");
                    localStorage.clear();
                    window.location.href = '/login'; 
                }
            } else {
                localStorage.clear();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;