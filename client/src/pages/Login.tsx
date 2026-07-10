import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, AlertCircle, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'>('CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google Simulation States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmailInput, setGoogleCustomEmailInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (type: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN') => {
    setRole(type);
    if (type === 'ADMIN') {
      setEmail('admin@smartbook.ai');
    } else if (type === 'EMPLOYEE') {
      setEmail('sarah@smartbook.ai');
    } else {
      setEmail('customer@smartbook.ai');
    }
    setPassword('password123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('https://smartbook-backend-68tc.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        
        // Route according to role
        if (data.user.role === 'ADMIN') {
          navigate('/admin');
        } else if (data.user.role === 'EMPLOYEE') {
          navigate('/employee');
        } else {
          navigate('/customer');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = () => {
    setShowGoogleModal(true);
    setGoogleCustomEmailInput(false);
    setCustomGoogleEmail('');
    setCustomGoogleName('');
  };

  const triggerGoogleAuth = async (emailStr: string, nameStr: string) => {
    setShowGoogleModal(false);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('https://smartbook-backend-68tc.onrender.com/api/auth/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailStr,
          name: nameStr,
          googleId: 'g_' + Math.random().toString(36).substring(7)
        })
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/customer');
      } else {
        setError(data.message || 'Google authentication failed');
      }
    } catch (err) {
      setError('Could not establish connection for Google auth.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080710] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans text-slate-100">
      
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#12111a] border border-white/5 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white">Welcome back</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to manage your appointments</p>
        </div>

        {/* Quick Fill Helpers */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
            Demo Quick Fills
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              onClick={() => handleQuickFill('CUSTOMER')}
              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                role === 'CUSTOMER' && email === 'customer@smartbook.ai'
                  ? 'bg-blue-500 text-slate-950 border-blue-500 shadow-md shadow-blue-500/10' 
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
              }`}
            >
              Customer
            </button>
            <button 
              type="button"
              onClick={() => handleQuickFill('EMPLOYEE')}
              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                role === 'EMPLOYEE' && email === 'sarah@smartbook.ai'
                  ? 'bg-blue-500 text-slate-950 border-blue-500 shadow-md shadow-blue-500/10' 
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
              }`}
            >
              Employee
            </button>
            <button 
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                role === 'ADMIN' && email === 'admin@smartbook.ai'
                  ? 'bg-blue-500 text-slate-950 border-blue-500 shadow-md shadow-blue-500/10' 
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot" className="text-xs font-medium text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold shadow-lg shadow-blue-500/10 transition-colors flex justify-center items-center disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <hr className="border-white/5" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#12111a] px-3 text-xs text-slate-500">
            or continue with
          </span>
        </div>

        <button 
          onClick={handleGoogleLoginClick}
          type="button"
          className="w-full py-3 border border-white/5 hover:bg-white/5 rounded-xl text-slate-300 font-semibold transition-colors flex items-center justify-center gap-2.5 text-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account? <Link to="/register" className="text-blue-400 hover:underline">Sign up</Link>
        </p>
      </motion.div>

      {/* GOOGLE OAUTH SIMULATED DIALOG */}
      <AnimatePresence>
        {showGoogleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-3xl bg-white text-slate-900 border border-slate-200 p-8 shadow-2xl relative text-left font-sans"
            >
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center mb-6">
                {/* Google Logo icon */}
                <svg className="h-8 w-8 mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <h3 className="font-semibold text-lg text-slate-800">Sign in with Google</h3>
                <p className="text-xs text-slate-500 mt-1">to continue to SmartBook AI</p>
              </div>

              {!googleCustomEmailInput ? (
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Select an account</span>
                  
                  {/* Account list buttons */}
                  <button 
                    onClick={() => triggerGoogleAuth('karthikeya.k@gmail.com', 'K Karthikeya')}
                    className="w-full p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold transition-all"
                  >
                    <div className="text-left">
                      <span className="block text-slate-800 font-bold">K Karthikeya</span>
                      <span className="text-slate-400 font-medium">karthikeya.k@gmail.com</span>
                    </div>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">Default</span>
                  </button>

                  <button 
                    onClick={() => triggerGoogleAuth('study.helper.ai@gmail.com', 'Study Helper AI')}
                    className="w-full p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold transition-all"
                  >
                    <div className="text-left">
                      <span className="block text-slate-800 font-bold">Study Helper AI</span>
                      <span className="text-slate-400 font-medium">study.helper.ai@gmail.com</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setGoogleCustomEmailInput(true)}
                    className="w-full p-3.5 rounded-xl border border-dashed border-slate-300 hover:bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-600 transition-all gap-1.5"
                  >
                    Use another account
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customGoogleEmail) {
                      const computedName = customGoogleName || customGoogleEmail.split('@')[0];
                      triggerGoogleAuth(customGoogleEmail, computedName);
                    }
                  }} 
                  className="space-y-4"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Enter Google account details</span>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Full Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. K Karthikeya"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. karthikeya.k@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 text-xs font-bold">
                    <button 
                      type="button"
                      onClick={() => setGoogleCustomEmailInput(false)}
                      className="px-4 py-3 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-[#4285F4] hover:bg-[#357ae8] text-white rounded-xl font-bold"
                    >
                      Sign In with Google
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
