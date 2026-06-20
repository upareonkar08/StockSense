import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, ShieldCheck, Scale, Zap } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.08 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

const sectionVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

// Custom Toggle Component
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/20 ${
        checked ? 'bg-accent' : 'bg-slate-200'
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  // Local state for personal info
  const [name, setName] = useState(user?.name || 'Arjun Mehta');
  const [phone, setPhone] = useState('+91 98765 43210');
  
  // Local state for investment pref
  const [risk, setRisk] = useState<'conservative' | 'moderate' | 'aggressive'>(user?.riskTolerance || 'moderate');
  const [goal, setGoal] = useState(user?.investmentGoal || 'Wealth Growth');
  const [horizon, setHorizon] = useState(user?.investmentHorizon || '5+ Years');

  // Local state for toggles
  const [rebalanceAlert, setRebalanceAlert] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [marketNews, setMarketNews] = useState(false);
  const [riskChanges, setRiskChanges] = useState(true);

  // Password fields
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: '', color: 'bg-slate-200', width: 'w-0' });

  // Danger Zone
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = "Profile Settings — StockSense";
  }, []);

  // Update local states if user context updates (e.g. after fresh login/signup/reset)
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setRisk(user.riskTolerance);
      setGoal(user.investmentGoal);
      setHorizon(user.investmentHorizon);
    }
  }, [user]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateUser) {
      updateUser({ name });
      triggerToast("Profile updated successfully!");
    }
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateUser) {
      updateUser({
        riskTolerance: risk,
        investmentGoal: goal,
        investmentHorizon: horizon
      });
      triggerToast("Investment preferences updated!");
    }
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    triggerToast("Password updated successfully!");
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdStrength({ score: 0, label: '', color: 'bg-slate-200', width: 'w-0' });
  };

  const handlePasswordChange = (val: string) => {
    setNewPassword(val);
    if (!val) {
      setPwdStrength({ score: 0, label: '', color: 'bg-slate-200', width: 'w-0' });
      return;
    }
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    switch (score) {
      case 1:
        setPwdStrength({ score: 1, label: 'Weak', color: 'bg-danger', width: 'w-1/4' });
        break;
      case 2:
        setPwdStrength({ score: 2, label: 'Fair', color: 'bg-warning', width: 'w-2/4' });
        break;
      case 3:
        setPwdStrength({ score: 3, label: 'Strong', color: 'bg-emerald-400', width: 'w-3/4' });
        break;
      case 4:
        setPwdStrength({ score: 4, label: 'Very Strong', color: 'bg-success', width: 'w-full' });
        break;
      default:
        setPwdStrength({ score: 0, label: '', color: 'bg-slate-200', width: 'w-0' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInputText !== 'DELETE') return;
    setIsDeleting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    // Clear and redirect
    localStorage.removeItem('stocksense_user');
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8 text-left max-w-4xl mx-auto"
      >
        {/* Header Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Profile Settings</h2>
          <p className="text-sm text-textSecondary font-medium">Manage your personal information, preferences, and account security.</p>
        </div>

        {/* Success toast notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: 40 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -40, x: 40 }}
              className="fixed top-4 right-4 bg-emerald-500 text-white py-3 px-5 rounded-lg shadow-xl font-semibold text-sm flex items-center gap-2 z-50"
            >
              <span>✅</span> {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION A — Personal Information */}
        <motion.div variants={sectionVariants}>
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Personal Information</h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-borderColor">
              <div className="h-16 w-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg font-bold text-accent">
                {user?.avatar || getInitials(name)}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <button type="button" className="text-xs font-bold text-accent hover:text-indigo-600 focus:outline-none">
                  Change Photo
                </button>
                <p className="text-[10px] text-textSecondary">PNG or JPG. Max 2MB.</p>
              </div>
            </div>

            <form onSubmit={handlePersonalSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="name"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                id="email"
                label="Email Address"
                value={user?.email || 'arjun@example.com'}
                disabled
                className="bg-slate-50 text-textSecondary border-borderColor cursor-not-allowed"
              />
              <Input
                id="phone"
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="sm:col-span-2 pt-2 text-right">
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* SECTION B — Investment Preferences */}
        <motion.div variants={sectionVariants}>
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Investment Preferences</h3>

            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              {/* Risk Tolerance Radio Cards */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-textPrimary">Risk Tolerance</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'conservative' as const, label: 'Conservative', desc: 'Focus on wealth preservation and stable income.', icon: <ShieldCheck size={18} /> },
                    { key: 'moderate' as const, label: 'Moderate', desc: 'Balance between growth returns and volatile shields.', icon: <Scale size={18} /> },
                    { key: 'aggressive' as const, label: 'Aggressive', desc: 'Maximize compounding through volatile tech assets.', icon: <Zap size={18} /> }
                  ].map((card) => {
                    const isSelected = risk === card.key;
                    return (
                      <div
                        key={card.key}
                        onClick={() => setRisk(card.key)}
                        className={`
                          p-4 rounded-xl border-2 cursor-pointer transition-all duration-250 flex flex-col justify-between text-left space-y-2
                          ${isSelected 
                            ? 'border-accent bg-indigo-50/30' 
                            : 'border-borderColor bg-white hover:bg-slate-50'
                          }
                        `}
                      >
                        <div className={`p-1.5 rounded w-fit ${isSelected ? 'bg-indigo-50 text-accent' : 'bg-slate-50 text-textSecondary'}`}>
                          {card.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-textPrimary">{card.label}</h4>
                          <p className="text-[10px] text-textSecondary leading-normal mt-0.5">{card.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Goal & Horizon Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="goal-select" className="block text-sm font-medium text-textPrimary">Investment Goal</label>
                  <select
                    id="goal-select"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="block w-full rounded-lg border border-borderColor bg-white py-2 px-3 text-sm text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    <option value="Wealth Growth">Wealth Growth</option>
                    <option value="Retirement Savings">Retirement Savings</option>
                    <option value="Regular Income">Regular Income</option>
                    <option value="Capital Preservation">Capital Preservation</option>
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label htmlFor="horizon-select" className="block text-sm font-medium text-textPrimary">Investment Horizon</label>
                  <select
                    id="horizon-select"
                    value={horizon}
                    onChange={(e) => setHorizon(e.target.value)}
                    className="block w-full rounded-lg border border-borderColor bg-white py-2 px-3 text-sm text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  >
                    <option value="Under 1 Year">Under 1 Year</option>
                    <option value="1-3 Years">1-3 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 text-right">
                <Button type="submit" variant="primary">Save Preferences</Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* SECTION C — Notification Settings */}
        <motion.div variants={sectionVariants}>
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Notification Settings</h3>
            
            <div className="divide-y divide-borderColor">
              {[
                { title: "Email Alerts for Rebalancing", desc: "Get notified when portfolio drifts from targeted asset allocations.", val: rebalanceAlert, set: setRebalanceAlert },
                { title: "Weekly Portfolio Summary", desc: "Receive diagnostic score reports and performance trends every Sunday.", val: weeklySummary, set: setWeeklySummary },
                { title: "Market News Digest", desc: "Keep up with sector changes, quarterly earnings, and macro events.", val: marketNews, set: setMarketNews },
                { title: "Risk Score Changes", desc: "Get alerted immediately if volatility spikes or risk ratings adjust.", val: riskChanges, set: setRiskChanges }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-semibold text-textPrimary">{item.title}</p>
                    <p className="text-[10px] text-textSecondary">{item.desc}</p>
                  </div>
                  <Toggle checked={item.val} onChange={() => item.set(!item.val)} />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* SECTION D — Security */}
        <motion.div variants={sectionVariants}>
          <Card className="space-y-8">
            {/* Change Password */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider border-b border-borderColor pb-2">
                Security Credentials
              </h3>
              
              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                <Input
                  id="curr-pwd"
                  type="password"
                  label="Current Password"
                  placeholder="••••••••"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  required
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="new-pwd"
                      type="password"
                      label="New Password"
                      placeholder="Min. 8 chars"
                      value={newPassword}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                    />
                    {/* Password Strength bar */}
                    {newPassword && (
                      <div className="mt-2 text-left space-y-1">
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${pwdStrength.color} ${pwdStrength.width} transition-all duration-300`} />
                        </div>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-textSecondary">Strength</span>
                          <span className="font-semibold text-textPrimary">{pwdStrength.label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Input
                    id="confirm-pwd"
                    type="password"
                    label="Confirm New Password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="text-right pt-2">
                  <Button type="submit" variant="primary">Update Password</Button>
                </div>
              </form>
            </div>

            {/* Two Factor Authentication */}
            <div className="pt-4 border-t border-borderColor space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <p className="text-xs font-semibold text-textPrimary flex items-center gap-1">
                    <Shield size={14} className="text-accent" />
                    Two-Factor Authentication (2FA)
                  </p>
                  <p className="text-[10px] text-textSecondary">Add an extra layer of protection to your investments.</p>
                </div>
                <Badge variant="neutral">Not enabled</Badge>
              </div>
              <div className="text-left">
                <Button variant="outline" className="text-xs py-2 px-3">Enable 2FA</Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* SECTION E — Danger Zone */}
        <motion.div variants={sectionVariants}>
          <Card className="border-red-200 bg-red-50/10 space-y-4">
            <h3 className="text-sm font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={16} />
              Danger Zone
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-textSecondary leading-normal max-w-xl text-left">
                Permanently delete your StockSense account and all historical portfolio trackers. This action is final and cannot be undone.
              </p>
              <Button
                variant="danger"
                className="bg-transparent border border-red-200 text-danger hover:bg-red-50 shadow-none hover:border-danger shrink-0"
                onClick={() => {
                  setDeleteInputText('');
                  setIsDeleteModalOpen(true);
                }}
              >
                Delete Account
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account Permanently"
      >
        <div className="space-y-5 text-left">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-danger text-xs leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <span>
              <strong>Warning:</strong> Deleting your account will wipe out all stock records, settings, and analytical logs immediately.
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-normal">
            To confirm deletion, please type <strong className="text-textPrimary">DELETE</strong> below.
          </p>

          <Input
            id="delete-confirm"
            placeholder="Type DELETE"
            value={deleteInputText}
            onChange={(e) => setDeleteInputText(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteInputText !== 'DELETE' || isDeleting}
              isLoading={isDeleting}
              onClick={handleDeleteAccount}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
export default ProfileSettings;
