import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { login } from '../services/api';
import { AxiosError } from 'axios';
import { User } from '../types';

interface LoginForm {
  email: string;
  password: string;
}

function Login() {
  const navigate = useNavigate();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const currentUser = useStore((state) => state.currentUser);
  const [formData, setFormData] = useState<LoginForm>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !currentUser) {
      const user: User = JSON.parse(storedUser);
      setCurrentUser(user);
    }
  }, [currentUser, setCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      navigate('/jobs');
    }
  }, [currentUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await login({ email: formData.email, password: formData.password });
      localStorage.setItem('token', response.data.token);
      const user: User = response.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      // Navigation handled by useEffect above
    } catch (err) {
      if (err instanceof AxiosError) {
        setError('Invalid credentials or server error');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-0 max-h-screen flex items-center justify-center bg-white overflow-hidden">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-50 rounded-lg shadow-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"></div>
        </div>
        <h1 className="text-2xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Access Your Account</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-800">New user? Register here</a>
        </p>
      </div>
    </div>
  );
}

export default Login;