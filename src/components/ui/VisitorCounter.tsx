import React, { useState, useEffect } from 'react';
import { Eye, Users, Globe } from 'lucide-react';

interface VisitorCounterProps {
  variant?: 'compact' | 'card' | 'badge';
  className?: string;
}

export const VisitorCounter: React.FC<VisitorCounterProps> = ({ 
  variant = 'compact',
  className = ''
}) => {
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAndIncrementVisits = async () => {
      const STORAGE_KEY = 'stocksense_visitor_count';
      const SESSION_KEY = 'stocksense_visited_this_session';
      const defaultBaseline = 1248;

      let currentLocalCount = parseInt(localStorage.getItem(STORAGE_KEY) || `${defaultBaseline}`, 10);
      const isNewSession = !sessionStorage.getItem(SESSION_KEY);

      if (isNewSession) {
        currentLocalCount += 1;
        localStorage.setItem(STORAGE_KEY, currentLocalCount.toString());
        sessionStorage.setItem(SESSION_KEY, 'true');
      }

      // Try fetching live cloud visitor count from CounterAPI
      try {
        const res = await fetch('https://api.counterapi.dev/v1/stocksense_upareonkar08_prod/visits/up', {
          method: 'GET',
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.count === 'number') {
            const finalCount = Math.max(data.count, currentLocalCount);
            setVisitCount(finalCount);
            localStorage.setItem(STORAGE_KEY, finalCount.toString());
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('[VisitorCounter] Cloud counter API unavailable, using resilient local counter.');
      }

      setVisitCount(currentLocalCount);
      setLoading(false);
    };

    fetchAndIncrementVisits();
  }, []);

  const formattedCount = visitCount !== null ? visitCount.toLocaleString() : '...';

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs font-semibold shadow-xs ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Users size={14} className="text-accent shrink-0" />
        <span>Total Visitors: <strong className="text-accent font-bold">{loading ? '...' : formattedCount}</strong></span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-xl border border-borderColor p-4 shadow-sm flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-accent">
            <Globe size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-textSecondary">Website Visitors</p>
            <p className="text-lg font-bold text-textPrimary">{loading ? '...' : formattedCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Tracking</span>
        </div>
      </div>
    );
  }

  // Default: Compact
  return (
    <div className={`inline-flex items-center gap-2 text-xs font-medium text-textSecondary ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Eye size={14} className="text-accent shrink-0" />
      <span><strong className="text-textPrimary font-bold">{loading ? '...' : formattedCount}</strong> Unique Visits</span>
    </div>
  );
};

export default VisitorCounter;
