"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaBox, 
  FaFileInvoiceDollar, 
  FaChartBar, 
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const menuItems = [
    { name: "Produits", href: "/", icon: FaBox },
    { name: "Factures", href: "/invoices", icon: FaFileInvoiceDollar },
    { name: "Rapports", href: "/reports", icon: FaChartBar },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsCollapsed(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white 
        shadow-2xl z-50 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-64' : 'w-0 md:w-20'}
        overflow-hidden
      `}>
        <div className="p-4 border-b border-indigo-700/50 flex items-center justify-between h-16">
          <div className={`flex items-center gap-3 transition-opacity ${isCollapsed ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-xl shadow-md">
              <FaBox size={20} />
            </div>
            {isCollapsed && (
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-300">
                StockPro
              </h2>
            )}
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-full bg-indigo-700/50 hover:bg-indigo-600 transition-all backdrop-blur-sm"
          >
            {isCollapsed ? <FaTimes size={14} /> : <FaBars size={14} />}
          </button>
        </div>

        <nav className="p-4 space-y-3 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all group relative overflow-hidden
                  ${isActive
                    ? "bg-gradient-to-r from-amber-500/90 to-orange-500/90 shadow-lg"
                    : "hover:bg-indigo-700/50 backdrop-blur-sm"
                  }`}
                onClick={() => isMobile && setIsCollapsed(false)}
              >
                <div className={`p-2 rounded-lg transition-all ${isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'}`}>
                  <Icon size={18} className={isActive ? "text-white" : "text-indigo-200"} />
                </div>
                <span className={`font-medium text-sm ${isCollapsed ? 'block' : 'hidden md:block'} ${isActive ? 'text-white' : 'text-indigo-100'}`}>
                  {item.name}
                </span>
                
                {/* Highlight effect */}
                {isActive && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-amber-400 rounded-l-lg" />
                )}
                
                {/* Tooltip for collapsed state */}
                {!isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
        
      
      </aside>
    </>
  );
};

export default Sidebar;