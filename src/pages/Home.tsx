import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore } from '../store';
import { getJobs, createJob } from '../services/api';
import { AxiosError } from 'axios';

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

function Home() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentUser = useStore((state) => state.currentUser);
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: undefined,
    postedBy: currentUser?.id || '',
    requirements: [],
    type: 'Full-time',
    category: 'IT',
  });
  const isEmployer = currentUser?.role === 'employer';

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const jobCategories = ['IT', 'Marketing', 'Finance', 'Engineering', 'Design'];

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await getJobs();
        const mappedJobs = response.data.map((job: any) => ({
          ...job,
          id: job.id || job._id,
        }));
        setJobs(mappedJobs);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.error || 'Failed to fetch jobs');
          console.error('Fetch error:', err.response?.data || err.message);
        } else {
          setError('An unexpected error occurred');
          console.error('Unexpected error:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isEmployer) {
      setError('Only employers can create jobs');
      setShowCreateForm(false);
      return;
    }
    try {
      const jobData = {
        ...newJob,
        postedBy: currentUser.id || currentUser.name || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const response = await createJob(jobData);
      setJobs([...jobs, { ...response.data, id: response.data.id || response.data._id }]);
      setShowCreateForm(false);
      setNewJob({
        title: '',
        description: '',
        company: '',
        location: '',
        salary: undefined,
        postedBy: currentUser?.id || '',
        requirements: [],
        type: 'Full-time',
        category: 'IT',
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'Failed to create job');
        console.error('Create error:', err.response?.data || err.message);
      } else {
        setError('An unexpected error occurred');
        console.error('Unexpected error:', err);
      }
    }
  };

  const handleRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const requirements = e.target.value.split('\n').filter(req => req.trim() !== '');
    setNewJob({ ...newJob, requirements });
  };

  if (loading) return <div className="text-center py-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} p-4 md:p-6`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Welcome to Job Portal</h1>
        <p className="text-gray-500">Explore opportunities or post your own jobs!</p>
      </div>

      {currentUser && isEmployer && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
        >
          <Plus className="w-6 h-6 mr-2" /> Post Job
        </button>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateJob} className="mb-6 p-6 bg-gray-100 rounded-lg shadow-md">
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Title</label>
            <input
              type="text"
              value={newJob.title || ''}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Description</label>
            <textarea
              value={newJob.description || ''}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Company</label>
            <input
              type="text"
              value={newJob.company || ''}
              onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Location</label>
            <input
              type="text"
              value={newJob.location || ''}
              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Salary</label>
            <input
              type="number"
              value={newJob.salary || ''}
              onChange={(e) => setNewJob({ ...newJob, salary: parseInt(e.target.value) || undefined })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              placeholder="Enter salary (optional)"
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Posted By</label>
            <input
              type="text"
              value={newJob.postedBy || currentUser?.name || ''}
              onChange={(e) => setNewJob({ ...newJob, postedBy: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              readOnly
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Requirements (one per line)</label>
            <textarea
              value={newJob.requirements ? newJob.requirements.join('\n') : ''}
              onChange={handleRequirementsChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              placeholder="Enter requirements, one per line"
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Type</label>
            <select
              value={newJob.type || 'Full-time'}
              onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
            >
              {jobTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-lg font-medium">Category</label>
            <select
              value={newJob.category || 'IT'}
              onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
            >
              {jobCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200">
            Submit
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="ml-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.slice(0, 6).map(job => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className={`${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} p-4 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                <p className="text-gray-500 mb-2">{job.company} - {job.location}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:bg-gray-300 transition-colors duration-200`}>{job.type || 'Full-time'}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:bg-gray-300 transition-colors duration-200`}>{job.category || 'N/A'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-blue-600">{job.salary ? `$${job.salary}` : 'N/A'}</div>
                <p className="text-gray-500 text-sm">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/jobs" className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200">
          View All Jobs
        </Link>
      </div>
    </div>
  );
}

export default Home;