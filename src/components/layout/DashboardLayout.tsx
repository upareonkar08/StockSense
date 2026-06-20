import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Get current page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/portfolio':
        return 'Portfolio Analyzer';
      case '/health':
        return 'Portfolio Health';
      case '/optimizer':
        return 'Portfolio Optimizer';
      case '/suggestions':
        return 'Suggestions';
      case '/trading':
        return 'Paper Trading';
      case '/backtest':
        return 'Backtesting';
      case '/tutor':
        return 'Analyst Chat';
      case '/profile':
        return 'Profile Settings';
      default:
        return 'StockSense';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex text-textPrimary">
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <Sidebar
            isMobile
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[240px]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-borderColor bg-white flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-textSecondary hover:text-textPrimary hover:bg-background rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-primary tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                whileHover={{ rotate: [0, -15, 15, -15, 15, 0] }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-textSecondary hover:text-textPrimary hover:bg-background rounded-full transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-danger rounded-full ring-2 ring-white" />
              </motion.button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    {/* Backdrop to close */}
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-borderColor rounded-xl shadow-xl z-40 overflow-hidden text-left"
                    >
                      <div className="px-4 py-3 border-b border-borderColor bg-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">Recent Alerts</span>
                        <span className="text-[10px] font-bold text-accent bg-indigo-50 px-2 py-0.5 rounded-full">3 New</span>
                      </div>
                      <div className="divide-y divide-borderColor max-h-64 overflow-y-auto">
                        <Link 
                          to="/optimizer" 
                          onClick={() => setIsNotificationsOpen(false)}
                          className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-xs font-bold text-textPrimary">💡 Portfolio Optimizer Alert</p>
                          <p className="text-[11px] text-textSecondary mt-0.5 leading-normal">
                            Equal-weight rebalancing suggestions are available for your current holdings.
                          </p>
                          <span className="text-[9px] text-accent font-semibold mt-1 block">Click to optimize</span>
                        </Link>
                        <Link 
                          to="/health" 
                          onClick={() => setIsNotificationsOpen(false)}
                          className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-xs font-bold text-textPrimary">⚠️ Concentration Risk Detected</p>
                          <p className="text-[11px] text-textSecondary mt-0.5 leading-normal">
                            Some stocks exceed 30% weighting. Review diversification metrics.
                          </p>
                          <span className="text-[9px] text-accent font-semibold mt-1 block">Click to view health report</span>
                        </Link>
                        <Link 
                          to="/suggestions" 
                          onClick={() => setIsNotificationsOpen(false)}
                          className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-xs font-bold text-textPrimary">📈 New Buy Suggestions</p>
                          <p className="text-[11px] text-textSecondary mt-0.5 leading-normal">
                            New high-conviction dividend and growth additions are suggested for your risk level.
                          </p>
                          <span className="text-[9px] text-accent font-semibold mt-1 block">Click to view suggestions</span>
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar */}
            {user && (
              <Link to="/profile" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-accent cursor-pointer hover:ring-2 hover:ring-accent/20 transition-all">
                  {user.avatar || getInitials(user.name)}
                </div>
              </Link>
            )}
          </div>
        </header>

        {/* Content body wrapper */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto relative z-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
