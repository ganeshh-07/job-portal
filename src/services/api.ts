import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Define the login response interface
interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'employer' | 'jobseeker';
    company?: string;
  };
}

const api = axios.create({
  baseURL: 'https://job-portal-i76b.onrender.com/api',
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  }
);

// Authentication Endpoints
export const login = (data: { email: string; password: string }): Promise<AxiosResponse<LoginResponse>> =>
  api.post('/auth/login', data);

export const register = (userData: { name: string; email: string; password: string; role: string; company?: string }) =>
  api.post('/auth/register', userData);

// Job Endpoints
export const getJobs = (params?: any) => api.get('/jobs', { params });
export const getJobById = (id: string) => api.get(`/jobs/${id}`);
export const createJob = (jobData: any) => api.post('/jobs', jobData);
export const updateJob = (id: string, jobData: any) => api.put(`/jobs/${id}`, jobData);
export const deleteJob = (id: string) => api.delete(`/jobs/${id}`);

// Application Endpoints
export const applyForJob = (jobId: string, data: { coverLetter: string }) =>
  api.post(`/applications/apply/${jobId}`, data);
export const getApplicants = (jobId: string) => api.get(`/applications/jobs/${jobId}/applicants`);
// export const getApplications = () => api.get('/applications');
export const getApplications = () => api.get('/applications/applications');
export const updateApplicationStatus = (id: string, data: { status: string }) => api.put(`/applications/${id}`, data);

export default api;




// import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// // Define the login response interface
// interface LoginResponse {
//   token: string;
//   user: {
//     id: string;
//     name: string;
//     email: string;
//     role: 'employer' | 'jobseeker';
//     company?: string;
//   };
// }

// const api = axios.create({
//   baseURL: 'https://job-portal-i76b.onrender.com/api', // Updated URL
// });

// api.interceptors.request.use(
//   (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
//     const token = localStorage.getItem('token');
//     if (token && config.headers) {
//       config.headers.set('Authorization', `Bearer ${token}`);
//     }
//     return config;
//   }
// );

// // Authentication Endpoints
// export const login = (data: { email: string; password: string }): Promise<AxiosResponse<LoginResponse>> =>
//   api.post('/auth/login', data);

// export const register = (userData: { name: string; email: string; password: string; role: string; company?: string }) =>
//   api.post('/auth/register', userData);

// // Job Endpoints
// export const getJobs = (params?: any) => api.get('/jobs', { params });
// export const getJobById = (id: string) => api.get(`/jobs/${id}`);
// export const createJob = (jobData: any) => api.post('/jobs', jobData);
// export const updateJob = (id: string, jobData: any) => api.put(`/jobs/${id}`, jobData);
// export const deleteJob = (id: string) => api.delete(`/jobs/${id}`);

// // Application Endpoints
// export const applyForJob = (jobId: string, data: { coverLetter: string }) =>
//   api.post(`/applications/apply/${jobId}`, data);
// export const getApplicants = (jobId: string) => api.get(`/applications/jobs/${jobId}/applicants`);
// export const getApplications = () => api.get('/applications');
// export const updateApplicationStatus = (id: string, data: { status: string }) => api.put(`/applications/${id}`, data);

// export default api;