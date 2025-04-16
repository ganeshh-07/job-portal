import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Building2, Clock, Send, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import api, { getJobById, updateJob, deleteJob } from '../services/api';
import { AxiosError } from 'axios';
import { User, Job } from '../types';

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const jobCategories = ['IT', 'Marketing', 'Finance', 'Engineering', 'Design'];

function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Partial<Job>>({});
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Invalid job ID');
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser && !currentUser) {
      const user: User = JSON.parse(storedUser);
      setCurrentUser(user);
      console.log('Loaded user from localStorage:', JSON.stringify(user, null, 2));
    }

    const fetchJob = async () => {
      setLoading(true);
      try {
        console.log('Fetching job with id:', id);
        const response = await getJobById(id);
        const mappedJob = {
          ...response.data,
          postedDate: response.data.createdAt ? new Date(response.data.createdAt).toLocaleDateString() : undefined,
        };
        setJob(mappedJob);
        setEditedJob(mappedJob);
      } catch (err) {
        const errorMsg = handleError(err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, currentUser, setCurrentUser]);

  useEffect(() => {
    console.log('Current User (Detailed):', JSON.stringify(currentUser, null, 2));
  }, [currentUser]);

  const handleUpdateJob = async () => {
    if (!currentUser || currentUser.role !== 'employer') {
      setError('Only employers can update jobs');
      return;
    }
    try {
      const response = await updateJob(id!, editedJob);
      setJob(response.data);
      setIsEditing(false);
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
    }
  };

  const handleDeleteJob = async () => {
    if (!currentUser || currentUser.role !== 'employer') {
      setError('Only employers can delete jobs');
      return;
    }
    if (window.confirm('Are you sure?')) {
      try {
        await deleteJob(id!);
        window.location.href = '/jobs';
      } catch (err) {
        const errorMsg = handleError(err);
        setError(errorMsg);
      }
    }
  };

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'jobseeker') {
      if (!currentUser) {
        setShowLoginPopup(true);
      } else {
        setError('Only job seekers can apply for jobs');
      }
      return;
    }
    if (!coverLetter || coverLetter.trim() === '') {
      setError('Cover letter is required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      console.log('Applying with coverLetter:', coverLetter, 'for jobId:', id, 'user:', currentUser.id, 'token:', token);
      const response = await api.post(`/applications/apply/${id}`, { coverLetter }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Application submitted:', response.data);
      setCoverLetter('');
      window.alert('Applied successfully');
      navigate('/jobs');
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      console.error('Apply error details:', err);
    }
  };

  const handleError = (err: unknown): string => {
    if (err instanceof AxiosError) {
      if (err.response?.status === 404) {
        return 'Job not found';
      }
      return err.response?.data?.error || 'Failed to perform action';
    }
    console.error('Unexpected error:', err);
    return 'An unexpected error occurred';
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!job) return <div className="text-center py-8 text-red-500">Job not found</div>;

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} p-4 min-h-0 max-h-screen overflow-hidden`}>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6 transition-all duration-200 hover:shadow-lg`}>
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b-2 border-gray-200 pb-4">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">{job.title}</h1>
            <div className="flex items-center text-gray-500 mb-3">
              <Building2 className="w-6 h-6 mr-3" />
              <span className="mr-6">{job.company}</span>
              <MapPin className="w-6 h-6 mr-3" />
              <span>{job.location}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:bg-gray-300 transition-colors duration-200`}>{job.type}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:bg-gray-300 transition-colors duration-200`}>{job.category}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400 mb-3">{job.salary ? `$${job.salary}` : 'N/A'}</div>
            <div className="flex items-center text-gray-500">
              <Clock className="w-6 h-6 mr-3" />
              <span>Posted {job.postedDate}</span>
            </div>
          </div>
        </div>

        {(currentUser?.role === 'employer' || currentUser?.role === 'jobseeker') && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {currentUser?.role === 'employer' && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 flex items-center w-full md:w-auto"
                >
                  <Edit className="w-5 h-5 mr-2" /> {isEditing ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={handleDeleteJob}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center w-full md:w-auto"
                >
                  <Trash2 className="w-5 h-5 mr-2" /> Delete
                </button>
              </>
            )}
            {currentUser?.role === 'jobseeker' && !isEditing && (
              <form onSubmit={handleApply} className="w-full">
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Write your cover letter..."
                  className="w-full p-3 mb-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                  required
                />
                <button
                  type="submit"
                  className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 flex items-center"
                >
                  <Send className="w-5 h-5 mr-2" /> Apply Now
                </button>
              </form>
            )}
            {!currentUser && !isEditing && (
              <button
                onClick={() => setShowLoginPopup(true)}
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 flex items-center"
              >
                <Send className="w-5 h-5 mr-2" /> Apply Now
              </button>
            )}
          </div>
        )}

        {isEditing && (
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateJob(); }} className="space-y-5">
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Title</label>
              <input
                type="text"
                value={editedJob.title || ''}
                onChange={(e) => setEditedJob({ ...editedJob, title: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Description</label>
              <textarea
                value={editedJob.description || ''}
                onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Requirements (one per line)</label>
              <textarea
                value={editedJob.requirements ? editedJob.requirements.join('\n') : ''}
                onChange={(e) => setEditedJob({ ...editedJob, requirements: e.target.value.split('\n').filter(req => req.trim() !== '') })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-lg font-medium">Type</label>
              <select
                value={editedJob.type || 'Full-time'}
                onChange={(e) => setEditedJob({ ...editedJob, type: e.target.value })}
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
                value={editedJob.category || 'IT'}
                onChange={(e) => setEditedJob({ ...editedJob, category: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              >
                {jobCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200">
              Save
            </button>
          </form>
        )}

        {!isEditing && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6`}>
            <h2 className="text-2xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Job Description</h2>
            <p className="mb-5 text-gray-500 whitespace-pre-line">{job.description}</p>
            <h3 className="text-xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Requirements</h3>
            <ul className="list-disc pl-6 space-y-3">
              {(job.requirements || []).map((req, index) => (
                <li key={index} className="text-gray-500">{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div></div>
        <div>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
            <h2 className="text-xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Company Overview</h2>
            <div className="flex items-center mb-5">
              <Building2 className="w-12 h-12 text-blue-600 mr-4" />
              <div>
                <h3 className="text-xl font-semibold">{job.company}</h3>
                <p className="text-gray-500">{job.location}</p>
              </div>
            </div>
            <p className="text-gray-500">
              Leading technology company specializing in innovative solutions...
            </p>
          </div>
        </div>
      </div>

      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
            <h2 className="text-xl font-bold mb-4">Please Log In</h2>
            <p className="mb-4">You need to log in to apply for this job.</p>
            <button
              onClick={() => { setShowLoginPopup(false); navigate('/login'); }}
              className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-teal-600"
            >
              Go to Login
            </button>
            <button
              onClick={() => setShowLoginPopup(false)}
              className="ml-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetails;