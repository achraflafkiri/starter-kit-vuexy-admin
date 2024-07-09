import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/api/v1",
});

// Request interceptor to include the token in headers
api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    } catch (error) {
        console.log(error);
    }
});

export default api;
