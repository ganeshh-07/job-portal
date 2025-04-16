import React, { useState, useEffect, FormEvent } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useStore } from '../store';
import { User } from '../types';
import api, { updateApplicationStatus } from '../services/api';
import { AxiosError } from 'axios';
import { Plus } from 'lucide-react';

// Define COLORS constant at the top level
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Application {
  _id: string;
  job: string;
  applicant: { _id: string; name: string; email: string };
  coverLetter: string;
  status: string;
  appliedAt: string;
}

interface Job {
  id: string;
  _id?: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number;
  postedBy?: string;
  createdAt: string;
  type?: string;
  category?: string;
  requirements?: string[];
}

interface JobFormData {
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number;
  type?: string;
  category?: string;
  requirements?: string[];
}

interface MonthlyData {
  month: string;
  jobs: number;
}

interface CategoryData {
  name: string;
  value: number;
}

function EmployerDashboard() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentUser = useStore((state) => state.currentUser) as User;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: undefined,
    type: 'Full-time',
    category: 'IT',
    requirements: [],
  });

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const jobCategories = ['IT', 'Marketing', 'Finance', 'Engineering', 'Design'];

  useEffect(() => {
    const fetchEmployerData = async () => {
      setLoading(true);
      try {
        const jobsResponse = await api.get('/jobs', { params: { postedBy: currentUser.id } });
        const fetchedJobs = jobsResponse.data.map((job: any) => ({
          ...job,
          id: job._id || job.id,
        }));
        setJobs(fetchedJobs);

        const validJobs = fetchedJobs.filter((job: Job) => job.postedBy === currentUser.id);
        if (validJobs.length === 0) {
          setApplications([]);
          setLoading(false);
          return;
        }

        const allApplications = await Promise.all(
          validJobs.map((job: Job) =>
            api.get(`/applications/jobs/${job.id}/applicants`).then((res) => res.data).catch((err) => {
              console.error(`Failed to fetch applicants for job ${job.id}:`, err.response?.data || err.message);
              return [];
            })
          )
        );
        setApplications(allApplications.flat());
      } catch (err) {
        setError(err instanceof AxiosError ? err.response?.data?.error || 'Failed to fetch dashboard data' : 'An unexpected error occurred');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === 'employer') fetchEmployerData();
  }, [currentUser]);

  // Generate dynamic monthly data
  const getMonthlyData = (): MonthlyData[] => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toLocaleString('default', { month: 'short' });
    });
    const jobCounts = months.map(month => ({
      month,
      jobs: jobs.filter(job => {
        const jobMonth = new Date(job.createdAt).toLocaleString('default', { month: 'short' });
        return jobMonth === month;
      }).length,
    }));
    return jobCounts;
  };

  // Generate dynamic category data
  const getCategoryData = (): CategoryData[] => {
    const categoryCounts = jobCategories.map(category => ({
      name: category,
      value: jobs.filter(job => job.category === category).length,
    }));
    const totalJobs = categoryCounts.reduce((sum, cat) => sum + cat.value, 0);
    return totalJobs > 0
      ? categoryCounts.map(cat => ({
          name: cat.name,
          value: Math.round((cat.value / totalJobs) * 100),
        }))
      : categoryCounts.map(cat => ({ name: cat.name, value: 0 }));
  };

  const handleCreateJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'employer') {
      setError('Only employers can create jobs');
      setShowCreateForm(false);
      return;
    }
    try {
      const jobData = { ...formData, postedBy: currentUser.id, createdAt: new Date().toISOString() };
      const response = await api.post('/jobs', jobData);
      setJobs([...jobs, { ...response.data, id: response.data._id || response.data.id }]);
      setShowCreateForm(false);
      setFormData({ title: '', description: '', company: '', location: '', salary: undefined, type: 'Full-time', category: 'IT', requirements: [] });
      setError(null);
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.error || 'Failed to create job' : 'An unexpected error occurred');
      console.error('Create error:', err);
    }
  };

  const handleUpdateJob = async (id: string) => {
    try {
      const response = await api.put(`/jobs/${id}`, formData);
      setJobs(jobs.map(job => job.id === id ? { ...response.data, id: response.data._id || response.data.id } : job));
      setEditingJob(null);
      setFormData({ title: '', description: '', company: '', location: '', salary: undefined, type: 'Full-time', category: 'IT', requirements: [] });
      setError(null);
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.error || 'Failed to update job' : 'An unexpected error occurred');
      console.error('Update error:', err);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await api.delete(`/jobs/${id}`);
      setJobs(jobs.filter(job => job.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.error || 'Failed to delete job' : 'An unexpected error occurred');
      console.error('Delete error:', err);
    }
  };

  const handleRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const requirements = e.target.value.split('\n').filter(req => req.trim() !== '');
    setFormData({ ...formData, requirements });
  };

  const handleAcceptApplication = async (appId: string) => {
    try {
      console.log('Attempting to accept application with ID:', appId);
      const response = await updateApplicationStatus(appId, { status: 'accepted' });
      setApplications(applications.map(app => app._id === appId ? { ...app, ...response.data.application } : app));
      setApplications(prevApps => prevApps.filter(app => app._id !== appId));
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof AxiosError ? `Failed to accept application: ${err.response?.data?.error || err.message}` : 'An unexpected error occurred';
      setError(errorMsg);
      console.error('Accept error:', err, 'Response:', (err as any).response?.data, 'Status:', (err as any).response?.status);
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      console.log('Attempting to reject application with ID:', appId);
      const response = await updateApplicationStatus(appId, { status: 'rejected' });
      setApplications(applications.map(app => app._id === appId ? { ...app, ...response.data.application } : app));
      setApplications(prevApps => prevApps.filter(app => app._id !== appId));
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof AxiosError ? `Failed to reject application: ${err.response?.data?.error || err.message}` : 'An unexpected error occurred';
      setError(errorMsg);
      console.error('Reject error:', err, 'Response:', (err as any).response?.data, 'Status:', (err as any).response?.status);
    }
  };

  const handleViewApplication = (appId: string) => {
    console.log(`Viewing application with ID: ${appId}`);
    // Implement modal or navigation logic here
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!currentUser || currentUser.role !== 'employer') return <div className="text-center py-8">Access denied</div>;

  const dynamicMonthlyData = getMonthlyData();
  const dynamicCategoryData = getCategoryData();

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} p-4 md:p-6`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Employer Dashboard</h1>
        <p className="text-gray-500">Welcome back, {currentUser?.name}</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h3 className="text-lg font-semibold mb-2">Active Jobs</h3>
          <p className="text-3xl font-bold text-blue-600">{jobs.length}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h3 className="text-lg font-semibold mb-2">Total Applications</h3>
          <p className="text-3xl font-bold text-green-600">{applications.length}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h3 className="text-lg font-semibold mb-2">Pending Review</h3>
          <p className="text-3xl font-bold text-yellow-600">{applications.filter(app => app.status === 'pending').length}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h3 className="text-lg font-semibold mb-2">Hired</h3>
          <p className="text-3xl font-bold text-purple-600">{applications.filter(app => app.status === 'accepted').length}</p>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
        >
          <Plus className="w-6 h-6 mr-2" /> Create Job
        </button>
      </div>
      {showCreateForm && (
        <form onSubmit={handleCreateJob} className="mb-6 p-6 bg-gray-100 rounded-lg shadow-md">
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Salary</label>
            <input
              type="number"
              value={formData.salary || ''}
              onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || undefined })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              placeholder="Enter salary (optional)"
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Requirements (one per line)</label>
            <textarea
              value={formData.requirements ? formData.requirements.join('\n') : ''}
              onChange={handleRequirementsChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              placeholder="Enter requirements, one per line"
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Type</label>
            <select
              value={formData.type || 'Full-time'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
            >
              {jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Category</label>
            <select
              value={formData.category || 'IT'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
            >
              {jobCategories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <button type="submit" className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200">
            Submit
          </button>
          <button
            type="button"
            onClick={() => { setShowCreateForm(false); setFormData({ title: '', description: '', company: '', location: '', salary: undefined, type: 'Full-time', category: 'IT', requirements: [] }); }}
            className="ml-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Job Listings</h2>
        {jobs.map((job) => (
          <div key={job.id} className="mb-2 p-4 border rounded-lg flex justify-between items-center shadow-md hover:shadow-lg transition-all duration-200">
            <span className="mr-2">{job.title}</span>
            <div>
              <button
                onClick={() => { setEditingJob(job); setFormData({ ...job, requirements: job.requirements || [] }); }}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-1 rounded-lg mr-2 hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteJob(job.id)}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {editingJob && (
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateJob(editingJob.id); }} className="mb-6 p-6 bg-gray-100 rounded-lg shadow-md">
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Salary</label>
              <input
                type="number"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || undefined })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                placeholder="Enter salary (optional)"
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Requirements (one per line)</label>
              <textarea
                value={formData.requirements ? formData.requirements.join('\n') : ''}
                onChange={handleRequirementsChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                placeholder="Enter requirements, one per line"
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Type</label>
              <select
                value={formData.type || 'Full-time'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              >
                {jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Category</label>
              <select
                value={formData.category || 'IT'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              >
                {jobCategories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200">
              Save
            </button>
            <button
              type="button"
              onClick={() => { setEditingJob(null); setFormData({ title: '', description: '', company: '', location: '', salary: undefined, type: 'Full-time', category: 'IT', requirements: [] }); }}
              className="ml-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Monthly Job Postings</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="jobs" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Jobs by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dynamicCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dynamicCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
        <h2 className="text-xl font-bold p-6 border-b border-gray-200 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Recent Applications</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-3 text-left">Job Title</th>
                <th className="px-6 py-3 text-left">Applicant</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.slice(0, 5).map((app) => {
                const job = jobs.find((j) => j.id === app.job);
                return (
                  <tr key={app._id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-all duration-200`}>
                    <td className="px-6 py-4">{job?.title || 'Unknown'}</td>
                    <td className="px-6 py-4">{app.applicant.name}</td>
                    <td className="px-6 py-4">{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${app.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : app.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptApplication(app._id)}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-lg mr-2 hover:from-green-600 hover:to-green-700 transition-all duration-200"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectApplication(app._id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EmployerDashboard;