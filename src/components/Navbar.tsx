import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, User, LogOut } from 'lucide-react';
import { useStore } from '../store';
import { User as UserType } from '../types'; // Import User type to avoid naming conflict

function Navbar() {
  const { isDarkMode, toggleDarkMode, currentUser } = useStore();
  const navigate = useNavigate();
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
    console.log('Logged out');
  };

  return (
    <nav className={`${isDarkMode ? 'dark bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">
            JobPortal
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/jobs" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-blue-600 transition-all duration-200`}>
              Jobs
            </Link>
            
            {currentUser ? (
              <>
                <Link 
                  to={`/${currentUser.role}/dashboard`}
                  className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-blue-600 transition-all duration-200`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center"
                >
                  <LogOut size={20} className="mr-2" /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-blue-600 transition-all duration-200`}>
                Login
              </Link>
            )}
            
            <button
              onClick={toggleDarkMode}
              className="bg-gradient-to-r from-gray-500 to-gray-600 p-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;