import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2,
  FolderOpen,
  Heart,
  Settings2,
  TrendingUp,
  MessageSquare,
  User,
  LogOut,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isMobile = false
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart2 },
    { name: 'Portfolio Analyzer', path: '/portfolio', icon: FolderOpen },
    { name: 'Portfolio Health', path: '/health', icon: Heart },
    { name: 'Optimizer', path: '/optimizer', icon: Settings2 },
    { name: 'Suggestions', path: '/suggestions', icon: Sparkles },
    { name: 'Paper Trading', path: '/trading', icon: Zap },
    { name: 'Backtesting', path: '/backtest', icon: TrendingUp },
    { name: 'Analyst Chat', path: '/tutor', icon: MessageSquare },
    { name: 'Profile Settings', path: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
    if (onClose) onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const containerClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-borderColor flex flex-col justify-between shadow-2xl`
    : `fixed inset-y-0 left-0 z-30 w-[240px] bg-white border-r border-borderColor hidden md:flex flex-col justify-between`;

  const sidebarContent = (
    <>
      <div>
        {/* Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-borderColor gap-2">
          <TrendingUp className="text-accent" size={24} />
          <span className="font-bold text-lg text-primary">
            Stock<span className="text-accent">Sense</span>
          </span>
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07, ease: "easeOut" }}
            >
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-accent text-white shadow-sm shadow-indigo-100'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-slate-50'
                  }
                `}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-borderColor space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-semibold text-accent">
              {user.avatar || getInitials(user.name)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-textPrimary truncate">{user.name}</p>
              <p className="text-[10px] text-textSecondary truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <LogOut size={16} />
            <span>Sign Out</span>
          </span>
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return isOpen ? (
      <>
        {/* Backdrop for mobile */}
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
        />
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'tween', duration: 0.25 }}
          className={containerClasses}
        >
          {sidebarContent}
        </motion.div>
      </>
    ) : null;
  }

  return (
    <aside className={containerClasses}>
      {sidebarContent}
    </aside>
  );
};
export default Sidebar;
