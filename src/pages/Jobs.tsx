import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Building2, Clock, Plus, X } from 'lucide-react';
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

function Jobs() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentUser = useStore((state) => state.currentUser);
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
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
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const isJobSeeker = currentUser?.role === 'jobseeker';

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const jobCategories = ['IT', 'Marketing', 'Finance', 'Engineering', 'Design'];

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        console.log('Fetching all jobs');
        const response = await getJobs();
        const mappedJobs = response.data.map((job: any) => ({
          ...job,
          id: job.id || job._id,
        }));
        setAllJobs(mappedJobs);
        setFilteredJobs(mappedJobs);
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

  useEffect(() => {
    const filtered = allJobs.filter(job => {
      const matchesSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !selectedLocation || job.location.toLowerCase() === selectedLocation.toLowerCase();
      return matchesSearch && matchesLocation;
    });
    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, selectedLocation, allJobs]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleLocation = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  };

  const locations = [...new Set(allJobs.map(job => job.location || '').filter(Boolean))];

  const handleCreateJob = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'employer') {
      setError('Only employers can create jobs');
      return;
    }
    try {
      const jobData = {
        ...newJob,
        postedBy: currentUser.id || currentUser.name || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const response = await createJob(jobData);
      setAllJobs([...allJobs, { ...response.data, id: response.data.id || response.data._id }]);
      setFilteredJobs([...filteredJobs, { ...response.data, id: response.data.id || response.data._id }]);
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
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Find Your Next Opportunity</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className={`flex items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 shadow-md transition-all duration-200 hover:shadow-lg`}>
              <Search className="w-6 h-6 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full bg-transparent focus:outline-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          
          <select
            value={selectedLocation}
            onChange={handleLocation}
            className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-md w-full md:w-auto focus:outline-none focus:border-blue-500 transition-all duration-200`}
          >
            <option value="">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        {currentUser?.role === 'employer' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
          >
            <Plus className="w-6 h-6 mr-2" /> Create Job
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedJobs.map(job => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className={`${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} p-4 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg`}
            onClick={() => console.log('Navigating to:', `/jobs/${job.id}`, 'Job ID:', job.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                <div className="flex items-center text-gray-500 mb-2">
                  <Building2 className="w-6 h-6 mr-2" />
                  <span className="mr-4">{job.company}</span>
                  <MapPin className="w-6 h-6 mr-2" />
                  <span>{job.location}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:bg-gray-300 transition-colors duration-200`}>{job.type || 'Full-time'}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:bg-gray-300 transition-colors duration-200`}>{job.category || 'N/A'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-blue-600">{job.salary ? `$${job.salary}` : 'N/A'}</div>
                <div className="flex items-center text-gray-500 mt-2">
                  <Clock className="w-6 h-6 mr-2" />
                  <span className="text-sm">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Apply button clicked, currentUser:', currentUser);
                    if (!currentUser) {
                      setShowLoginPopup(true);
                    } else if (isJobSeeker) {
                      navigate(`/jobs/${job.id}`); // Navigate to JobDetails for jobseekers
                    }
                  }}
                  className={`mt-2 px-3 py-1 rounded ${isJobSeeker ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' : 'bg-gray-400 text-gray-700 cursor-not-allowed'} ${!currentUser ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600' : ''}`}
                  disabled={!isJobSeeker && !!currentUser}
                >
                  Apply
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-l-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">{currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-r-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 disabled:opacity-50"
        >
          Next
        </button>
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

export default Jobs;