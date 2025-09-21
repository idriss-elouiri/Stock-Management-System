"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
           onClick={() => setSidebarOpen(false)} />
      
      <div className={`fixed md:relative top-0 left-0 h-full z-50 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-h-screen md:ml-0 transition-all">
        <TopNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-4 md:p-6 min-h-full border border-white/50">
            {children}
          </div>
        </main>
        
        <footer className="bg-white/50 border-t border-gray-200/50 py-3 px-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} StockPro - Système de Gestion de Stock. Tous droits réservés.
        </footer>
      </div>
    </div>
  );
}