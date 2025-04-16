import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store';
import { User } from '../types';
import api, { getApplications } from '../services/api';
import { AxiosError } from 'axios';

interface Application {
  _id: string;
  job: { _id: string; title: string; company: string } | null;
  status: string;
  appliedAt: string;
}

function JobSeekerDashboard() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentUser = useStore((state) => state.currentUser) as User;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching applications with token:', token);
        const response = await getApplications();
        console.log('API Response:', response.data);
        const safeApplications = response.data.map((app: any) => ({
          ...app,
          job: app.job || null,
        }));
        setApplications(safeApplications);
      } catch (err) {
        const errorMsg = handleError(err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.role === 'jobseeker') fetchApplications();
  }, [currentUser]);

  const handleWithdraw = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const url = `/applications/${id}`;
      console.log('Withdrawing application with id:', id, 'token:', token, 'full URL:', `${api.defaults.baseURL}${url}`, 'user ID:', currentUser.id);
      const response = await api.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(applications.filter(app => app._id !== id));
      window.alert('Job withdrawn successfully');
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      console.error('Withdraw error details:', err, 'Response:', (err as any).response?.data, 'Status:', (err as any).response?.status);
    }
  };

  const handleError = (err: unknown): string => {
    if (err instanceof AxiosError) {
      return err.response?.data?.error || 'Failed to perform action';
    }
    console.error('Unexpected error:', err);
    return 'An unexpected error occurred';
  };

  const getDisplayStatus = (status: string) => {
    if (status === 'accepted') return 'Pending to Approve';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getApplicationActivity = (): { week: string; applications: number }[] => {
    const now = new Date();
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (5 - i) * 7);
      return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
             ' - ' +
             new Date(weekStart.setDate(weekStart.getDate() + 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const activity = weeks.map(week => ({
      week,
      applications: applications.filter(app => {
        const appliedDate = new Date(app.appliedAt);
        const [startMonth, startDay] = week.split(' - ')[0].split(' ');
        const [endMonth, endDay] = week.split(' - ')[1].split(' ');
        const start = new Date(now.getFullYear(), months.indexOf(startMonth), parseInt(startDay));
        const end = new Date(now.getFullYear(), months.indexOf(endMonth), parseInt(endDay));
        return appliedDate >= start && appliedDate <= end;
      }).length,
    }));

    return activity;
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!currentUser || currentUser.role !== 'jobseeker') return <div className="text-center py-8">Access denied</div>;

  const dynamicApplicationData = getApplicationActivity();

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} p-4 md:p-6`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Job Seeker Dashboard</h1>
        <p className="text-gray-500">Welcome back, {currentUser?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h3 className="text-lg font-semibold mb-2">Total Applications</h3>
          <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h3 className="text-lg font-semibold mb-2">Under Review</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {applications.filter(app => app.status === 'pending').length}
          </p>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h3 className="text-lg font-semibold mb-2">Accepted</h3>
          <p className="text-3xl font-bold text-green-600">
            {applications.filter(app => app.status === 'accepted').length}
          </p>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
          <h3 className="text-lg font-semibold mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-red-600">
            {applications.filter(app => app.status === 'rejected').length}
          </p>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mb-8`}>
        <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Application Activity</h2>
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dynamicApplicationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
        <h2 className="text-xl font-bold p-6 border-b border-gray-200 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Application History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-3 md:px-6 md:py-4 text-left">Job Title</th>
                <th className="px-6 py-3 md:px-6 md:py-4 text-left">Company</th>
                <th className="px-6 py-3 md:px-6 md:py-4 text-left">Applied Date</th>
                <th className="px-6 py-3 md:px-6 md:py-4 text-left">Status</th>
                <th className="px-6 py-3 md:px-6 md:py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-all duration-200`}>
                  <td className="px-6 py-4">{app.job?.title || 'Title Unavailable'}</td>
                  <td className="px-6 py-4">{app.job?.company || 'Company Unavailable'}</td>
                  <td className="px-6 py-4">{new Date(app.appliedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-sm ${
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getDisplayStatus(app.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {app.status === 'pending' && (
                      <button onClick={() => handleWithdraw(app._id)} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200">
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default JobSeekerDashboard;