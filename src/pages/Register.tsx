import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { register } from '../services/api';
import { AxiosError } from 'axios';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: 'jobseeker' | 'employer';
  company: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'employer' | 'jobseeker';
  company?: string;
}

function Register() {
  const navigate = useNavigate();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    role: 'jobseeker',
    company: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'role' ? (value as 'jobseeker' | 'employer') : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        company: formData.role === 'employer' ? formData.company : undefined,
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'Registration failed');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-0 max-h-screen flex items-center justify-center bg-white overflow-hidden">
      <div className="w-full max-w-md p-6 space-y-6 bg-gray-50 rounded-lg shadow-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"></div>
        </div>
        <h1 className="text-2xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Create Your Account</h1>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 p-3 rounded-lg text-sm">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Account Type</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              required
            >
              <option value="jobseeker">Job Seeker</option>
              <option value="employer">Employer</option>
            </select>
          </div>
          {formData.role === 'employer' && (
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200"
          >
            Create Account
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-800">Already a user? Then move to login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;