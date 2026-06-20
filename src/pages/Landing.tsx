import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, ShieldAlert, RefreshCcw, History, MessageSquare, Bell, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { dummyTestimonials } from '../data/dummyData';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

const sparklineData = [
  { value: 95000 },
  { value: 98000 },
  { value: 102000 },
  { value: 99000 },
  { value: 110000 },
  { value: 124350 }
];

export const Landing: React.FC = () => {
  React.useEffect(() => {
    document.title = "StockSense — Know Your Portfolio. Before the Market Does.";
  }, []);

  const headline = "Know Your Portfolio. Before the Market Does.";
  const headlineWords = headline.split(" ");

  const features = [
    { icon: <Brain className="text-accent" size={24} />, title: "🧠 AI Portfolio Analysis", desc: "Instant health scores and deep portfolio insights to analyze your investments." },
    { icon: <ShieldAlert className="text-amber-500" size={24} />, title: "⚖️ Risk Scoring", desc: "Know your exact risk level before the market moves, customized to your profile." },
    { icon: <RefreshCcw className="text-emerald-500" size={24} />, title: "🔄 Smart Rebalancing", desc: "Get AI-driven rebalancing recommendations to optimize asset weights." },
    { icon: <History className="text-blue-500" size={24} />, title: "📊 Backtesting Engine", desc: "Test your strategy against 5 years of historical market data before putting money in." },
    { icon: <MessageSquare className="text-purple-500" size={24} />, title: "🤖 AI Tutor Chat", desc: "Ask anything about your portfolio or general investing concepts in plain language." },
    { icon: <Bell className="text-red-500" size={24} />, title: "🔔 Smart Alerts", desc: "Get notified immediately when your portfolio needs attention or sector weights drift." }
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-background flex flex-col justify-between"
    >
      <Navbar />

      {/* Main Page Area */}
      <div className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-indigo-50/40 py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-borderColor/55">
          {/* Blurred Background Orbs */}
          <div className="orb orb-primary top-10 right-[15%]" />
          <div className="orb orb-success bottom-10 left-[10%]" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left Column Text */}
            <div className="space-y-6 text-left">
              <div className="inline-block">
                <Badge variant="accent">AI-POWERED FINTECH</Badge>
              </div>

              {/* Word-by-word reveal */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary leading-tight tracking-tight">
                <motion.span
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.08 } }
                  }}
                >
                  {headlineWords.map((word, i) => (
                    <motion.span
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className="inline-block mr-2.5 sm:mr-3.5"
                    >
                      {word}
                    </motion.span>
                  ))}
                </motion.span>
              </h2>

              <p className="text-textSecondary text-base sm:text-lg max-w-xl leading-relaxed">
                StockSense gives you AI-powered portfolio analysis, risk scoring, and smart rebalancing suggestions — all in one place.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/signup">
                  <Button variant="primary">Get Started Free</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline">Learn More</Button>
                </Link>
              </div>
            </div>

            {/* Right Column Floating Mockup */}
            <div className="flex justify-center items-center">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md"
              >
                {/* Floating card */}
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white rounded-2xl border border-borderColor p-6 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-borderColor pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-accent">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Demo Portfolio</p>
                        <p className="text-sm font-bold text-textPrimary">Growth Tracker</p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-textSecondary">Total Value</p>
                      <p className="text-3xl font-extrabold text-textPrimary tracking-tight">₹1,24,350</p>
                      <p className="text-xs font-semibold text-success mt-1 flex items-center gap-0.5">
                        <span>▲</span> +12.9% (Overall P&L)
                      </p>
                    </div>

                    {/* Sparkline Chart */}
                    <div className="w-[120px] h-[60px] pb-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10B981"
                            strokeWidth={2}
                            fill="#D1FAE5"
                            fillOpacity={0.4}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 bg-white px-4 sm:px-6 lg:px-8 border-b border-borderColor/55">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <div className="space-y-3">
              <Badge variant="accent">WHAT YOU GET</Badge>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                Everything your portfolio needs.
              </h3>
              <p className="text-textSecondary text-sm sm:text-base max-w-2xl mx-auto">
                Discover robust analytics, simulated trading scenarios, and interactive tutoring to maximize your compounding power.
              </p>
            </div>

            {/* 6 Grid features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {features.map((feat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ y: -6, boxShadow: "0 10px 30px rgba(99,102,241,0.15)" }}
                  className="bg-white rounded-xl border border-borderColor p-6 shadow-sm transition-all duration-200"
                >
                  <div className="p-2.5 bg-slate-50 border border-borderColor rounded-lg w-fit mb-4">
                    {feat.icon}
                  </div>
                  <h4 className="text-base font-bold text-textPrimary mb-2">{feat.title}</h4>
                  <p className="text-xs text-textSecondary leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 bg-primary text-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center space-y-14">
            <div className="space-y-3">
              <Badge variant="neutral" className="bg-slate-800 text-slate-200 border-slate-700">WORKFLOW</Badge>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Optimize in 3 simple steps
              </h3>
            </div>

            {/* Step flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-slate-700 z-0" />

              {[
                { step: "01", title: "Add Your Holdings", desc: "Enter your stock tickers, quantity, and buy price. It takes less than a minute." },
                { step: "02", title: "Get Your Health Score", desc: "Our AI engine analyzes your risk tolerances, asset concentration, and performance metrics." },
                { step: "03", title: "Follow Recommendations", desc: "Implement smart suggestions to rebalance allocations, hedge risks, and boost yield." }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                  className="flex flex-col items-center relative z-10 space-y-4"
                >
                  <div className="h-12 w-12 rounded-full bg-accent border-4 border-slate-900 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-indigo-500/20">
                    {step.step}
                  </div>
                  <h4 className="text-base font-bold text-slate-100">{step.title}</h4>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-20 bg-white px-4 sm:px-6 lg:px-8 border-b border-borderColor/55">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <div className="space-y-3">
              <Badge variant="accent">USER STORIES</Badge>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                Trusted by investors across India
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {dummyTestimonials.map((t, index) => {
                const isEven = index % 2 === 0;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="bg-slate-50/50 rounded-xl border border-borderColor p-6 flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <p className="text-xs text-textSecondary italic leading-relaxed">
                      "{t.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-accent">
                        {t.avatar}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-textPrimary">{t.name}</h4>
                        <p className="text-[10px] text-textSecondary">{t.role}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-16 px-4 sm:px-6 lg:px-8 text-center border-b border-indigo-900 shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to take control of your portfolio?
            </h3>
            <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Join thousands of investors using StockSense to make smarter decisions and compound wealth securely.
            </p>
            <div className="pt-2">
              <Link to="/signup">
                <Button className="bg-white text-accent hover:bg-slate-50 font-bold px-6 py-3 flex items-center gap-2 mx-auto">
                  <span>Create Free Account</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </motion.div>
  );
};
export default Landing;
