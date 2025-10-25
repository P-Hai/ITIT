import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    return response.data;
  },
};

// ============================================
// PATIENTS API
// ============================================

export const patientsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get("/patients", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/patients", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },
};

// ============================================
// MEDICAL RECORDS API
// ============================================

export const medicalRecordsAPI = {
  getByPatientId: async (patientId) => {
    const response = await api.get(`/medical-records/patient/${patientId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/medical-records/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/medical-records", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/medical-records/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/medical-records/${id}`);
    return response.data;
  },
};

// ============================================
// FILES API
// ============================================

export const filesAPI = {
  upload: async (file, medicalRecordId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("medical_record_id", medicalRecordId);

    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  download: async (fileId) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });
    return response;
  },

  getInfo: async (fileId) => {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  },

  delete: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },
};

// ============================================
// AUDIT LOGS API
// ============================================

export const auditAPI = {
  getLogs: async (params = {}) => {
    const response = await api.get("/audit", { params });
    return response.data;
  },
};

export default api;
