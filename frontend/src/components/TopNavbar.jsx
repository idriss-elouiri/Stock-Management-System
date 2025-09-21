"use client";

import { FaBell, FaUserCircle, FaSearch, FaMoon, FaSun } from "react-icons/fa";
import { useState, useEffect } from "react";

const TopNavbar = ({ onMenuToggle }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("fr-FR"));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className="bg-gradient-to-r from-white to-gray-50 shadow-md border-b border-gray-200/70 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-indigo-600 bg-indigo-100 p-2 rounded-xl shadow-sm hover:bg-indigo-200 transition-colors"
          onClick={onMenuToggle}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-gray-700">Gestion de Stock</p>
          <p className="text-xs text-gray-500">{currentTime}</p>
        </div>

        <div className="flex items-center gap-3 bg-indigo-50/80 py-1.5 px-3 rounded-xl shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
            <FaUserCircle size={14} />
          </div>
          <div className="hidden md:block">
            <span className="text-sm font-medium text-indigo-900">
              Administrateur
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
