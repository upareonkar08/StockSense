import React from 'react';
import { TrendingUp } from 'lucide-react';
import VisitorCounter from '../ui/VisitorCounter';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 font-bold text-xl">
              <TrendingUp className="text-accent" size={24} />
              <span>Stock<span className="text-accent">Sense</span></span>
            </div>
            <p className="text-xs text-slate-400">Smart investing, simplified.</p>
          </div>

          {/* Visitor Counter */}
          <div className="flex flex-col items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2">
            <VisitorCounter variant="badge" className="bg-slate-800/80 border-slate-700 text-slate-200" />
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© 2024 StockSense. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
