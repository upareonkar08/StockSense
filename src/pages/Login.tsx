import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, CheckCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

interface LoginFormInputs {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // OTP Verification States
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userTypedOtp, setUserTypedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loginInputs, setLoginInputs] = useState<LoginFormInputs | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>();

  React.useEffect(() => {
    document.title = "Log In — StockSense";
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get path to redirect back to if applicable
  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginFormInputs) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setLoginInputs(data);
    setIsOtpStep(true);
    
    triggerToast(`Verification code sent to ${data.email}.`);
    console.warn(`[AuthService] Generated 2FA OTP for ${data.email}: ${otp}`);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInputs) return;

    if (userTypedOtp === generatedOtp || userTypedOtp === '123456') {
      setOtpError('');
      try {
        await login(loginInputs.email, loginInputs.password);
        triggerToast(`Login successful.`);
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1200);
      } catch (err) {
        setOtpError('Failed to authorize login. Please check details.');
      }
    } else {
      setOtpError('Invalid verification code.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError('Please enter a valid email address.');
      return;
    }
    setResetError('');
    setResetLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setResetEmailSent(true);
    } catch (err) {
      setResetError('An error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/40 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Background Orbs */}
      <div className="orb orb-primary top-10 right-10" />
      <div className="orb orb-success bottom-10 left-10" />

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: 40 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -40, x: 40 }}
            className="fixed top-4 right-4 bg-emerald-500 text-white py-3 px-5 rounded-lg shadow-xl font-semibold text-sm flex items-center gap-2 z-50 text-left"
          >
            <span>📧</span> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.45 }}
        className="max-w-md w-full bg-white rounded-2xl border border-borderColor shadow-xl p-8 sm:p-10 relative z-10 text-center"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-xl text-primary mb-6">
          <TrendingUp size={24} className="text-accent" />
          <span>Stock<span className="text-accent">Sense</span></span>
        </Link>

        <AnimatePresence mode="wait">
          {!isOtpStep ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-textPrimary mb-1.5">Welcome back</h3>
              <p className="text-xs text-textSecondary mb-8">Log in to your StockSense account</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  icon={<Mail size={16} />}
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                />

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-textPrimary">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs font-semibold text-accent hover:text-indigo-600 focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    icon={<Lock size={16} />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-textSecondary hover:text-textPrimary focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    error={errors.password?.message}
                    {...register('password', {
                      required: 'Password is required'
                    })}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  className="mt-6"
                >
                  Log In
                </Button>
              </form>

              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-borderColor" />
                </div>
                <span className="relative px-3 bg-white text-xs font-medium text-textSecondary uppercase">
                  or continue with
                </span>
              </div>

              {/* Google SSO Button */}
              <Button
                type="button"
                variant="outline"
                fullWidth
                className="flex items-center justify-center gap-2"
                onClick={async () => {
                  const otp = Math.floor(100000 + Math.random() * 900000).toString();
                  setGeneratedOtp(otp);
                  setLoginInputs({ email: 'arjun@example.com', password: 'google-sso' });
                  setIsOtpStep(true);
                  triggerToast(`Verification code sent to arjun@example.com.`);
                  console.warn(`[AuthService] Generated 2FA OTP for arjun@example.com: ${otp}`);
                }}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.57,11.45 21.35,11.1z" fill="#4285F4" />
                    <path d="M12,20.62c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.98 -3.3,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.7H2.9v2.66C4.38,18.74 7.95,20.62 12,20.62z" fill="#34A853" />
                    <path d="M6.96,13.22c-0.18,-0.54 -0.29,-1.1 -0.29,-1.68s0.11,-1.14 0.29,-1.68V7.2H2.9C2.29,8.41 1.95,9.78 1.95,11.2s0.34,2.79 0.95,4H6.96z" fill="#FBBC05" />
                    <path d="M12,6.38c1.32,0 2.5,0.45 3.44,1.35L17.52,5.7c-2.07,-1.93 -4.79,-3.1 -7.94,-3.1C5.5,2.6 1.93,4.48 0.45,7.4l3.77,2.92C4.93,8.08 6.92,6.38 12,6.38z" fill="#EA4335" />
                  </g>
                </svg>
                <span>Sign In with Google</span>
              </Button>

              <p className="mt-8 text-xs text-textSecondary font-medium">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-accent hover:text-indigo-600">
                  Sign up →
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 text-left"
            >
              <h3 className="text-2xl font-bold text-textPrimary text-center">Verify Identity</h3>
              <p className="text-xs text-textSecondary text-center leading-relaxed mb-4">
                A 6-digit verification code has been sent to <span className="font-semibold">{loginInputs?.email}</span>.
              </p>

              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900 leading-relaxed mb-6">
                <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Demo Environment Helper</span>
                </p>
                <p className="mt-1 text-indigo-900/90 font-medium">
                  Since this is a client-side prototype with no backend email server connected, you can verify using code: <strong className="text-accent text-sm font-black tracking-wider bg-white px-2 py-0.5 rounded border border-indigo-200">{generatedOtp}</strong> (or use fallback code <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold">123456</code>).
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <Input
                  id="otpCode"
                  type="text"
                  label="6-Digit OTP Code"
                  placeholder="e.g. 583920"
                  value={userTypedOtp}
                  maxLength={6}
                  onChange={(e) => setUserTypedOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  error={otpError}
                />

                <div className="flex gap-3">
                  <Button type="submit" variant="primary" fullWidth>
                    Verify & Log In
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setIsOtpStep(false);
                      setUserTypedOtp('');
                      setOtpError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedOtp(otp);
                    triggerToast(`New verification code sent.`);
                    console.warn(`[AuthService] Generated new 2FA OTP for ${loginInputs?.email}: ${otp}`);
                  }}
                  className="text-xs font-semibold text-accent hover:text-indigo-600 focus:outline-none"
                >
                  Resend Code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => {
          setIsForgotPasswordOpen(false);
          setResetEmailSent(false);
          setResetEmail('');
          setResetError('');
        }}
        title="Reset Password"
      >
        <AnimatePresence mode="wait">
          {!resetEmailSent ? (
            <motion.form
              key="reset-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleForgotPassword}
              className="space-y-4 text-left"
            >
              <p className="text-xs text-textSecondary leading-relaxed">
                Enter your email address and we'll send you a recovery link to reset your password.
              </p>
              <Input
                id="reset-email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                error={resetError}
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={resetLoading}
                className="mt-2"
              >
                Send Reset Link
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="reset-success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-6 text-center space-y-4"
            >
              {/* Checkmark scale animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-success"
              >
                <CheckCircle size={56} />
              </motion.div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-textPrimary">Check your inbox!</h4>
                <p className="text-xs text-textSecondary leading-relaxed">
                  We've sent a recovery link to <span className="font-semibold">{resetEmail}</span>.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setResetEmailSent(false);
                  setResetEmail('');
                }}
              >
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </motion.div>
  );
};
export default Login;
