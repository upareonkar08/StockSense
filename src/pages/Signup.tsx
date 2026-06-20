import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  React.useEffect(() => {
    document.title = "Create Account — StockSense";
  }, []);

  const watchPassword = watch('password', '');

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200', width: 'w-0' };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-danger', width: 'w-1/4' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-warning', width: 'w-2/4' };
      case 3:
        return { score: 3, label: 'Strong', color: 'bg-emerald-400', width: 'w-3/4' };
      case 4:
        return { score: 4, label: 'Very Strong', color: 'bg-success', width: 'w-full' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200', width: 'w-0' };
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const strength = getPasswordStrength(watchPassword);

  const onSubmit = async (data: any) => {
    try {
      await signup({
        name: data.fullName,
        email: data.email,
        password: data.password
      });
      setToastMessage(`Account created successfully!`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (e) {
      console.error(e);
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

        <h3 className="text-2xl font-bold text-textPrimary mb-1.5">Create your account</h3>
        <p className="text-xs text-textSecondary mb-8">Analyze and optimize your assets today</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="fullName"
            type="text"
            label="Full Name"
            placeholder="Arjun Mehta"
            icon={<UserIcon size={16} />}
            error={errors.fullName?.message as string}
            {...register('fullName', {
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters'
              }
            })}
          />

          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            icon={<Mail size={16} />}
            error={errors.email?.message as string}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Please enter a valid email address'
              }
            })}
          />

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-textPrimary text-left mb-1.5">
              Password
            </label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
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
              error={errors.password?.message as string}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
            />

            {/* Password strength bar */}
            {watchPassword && (
              <div className="mt-2 text-left space-y-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 ease-out`} />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-textSecondary">Password Strength</span>
                  <span className="font-semibold text-textPrimary">{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-textSecondary hover:text-textPrimary focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.confirmPassword?.message as string}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === watchPassword || 'Passwords do not match'
            })}
          />

          {/* Terms Checkbox */}
          <div className="flex items-start text-left gap-2 pt-1">
            <input
              id="terms"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-borderColor text-accent focus:ring-accent"
              {...register('terms', {
                required: 'You must agree to the terms to proceed'
              })}
            />
            <label htmlFor="terms" className="text-xs text-textSecondary leading-normal">
              I agree to the <a href="#" className="font-semibold text-accent hover:underline">Terms of Service</a> and <a href="#" className="font-semibold text-accent hover:underline">Privacy Policy</a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-left text-xs text-danger font-medium mt-0.5">
              ⚠️ {(errors.terms?.message as string)}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            className="mt-6"
          >
            Create Account
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
            await signup({ fullName: 'Arjun Mehta', email: 'arjun@example.com' });
            navigate('/dashboard');
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
          <span>Sign Up with Google</span>
        </Button>

        <p className="mt-8 text-xs text-textSecondary font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:text-indigo-600">
            Log in →
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};
export default Signup;
