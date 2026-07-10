import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, Phone, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'EMPLOYEE'>('CUSTOMER');
  const [skills, setSkills] = useState('General Booking');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        phone: phone || undefined,
        skills: role === 'EMPLOYEE' ? skills : undefined,
        bio: role === 'EMPLOYEE' ? bio : undefined
      };

      const res = await fetch('https://smartbook-backend.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        if (data.user.role === 'EMPLOYEE') {
          navigate('/employee');
        } else {
          navigate('/customer');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Could not connect to the registration server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080710] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-slate-100">
      
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

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
          <h2 className="font-display font-bold text-2xl text-white">Create account</h2>
          <p className="text-slate-400 text-sm mt-1">Get started with SmartBook AI today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
              <button 
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  role === 'CUSTOMER' 
                    ? 'bg-blue-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Customer
              </button>
              <button 
                type="button"
                onClick={() => setRole('EMPLOYEE')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  role === 'EMPLOYEE' 
                    ? 'bg-blue-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Employee
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Full Name *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="h-4 w-4" />
              </span>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Email Address *
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
                placeholder="john@example.com"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Password *
            </label>
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

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Phone className="h-4 w-4" />
              </span>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Conditional Employee Fields */}
          {role === 'EMPLOYEE' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-2 border-t border-white/5"
            >
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Skills Category
                </label>
                <select 
                  value={skills} 
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-[#12111a] border border-white/5 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Dental">Dental Care (Dentistry)</option>
                  <option value="Salon">Salon & Hair Treatment</option>
                  <option value="Wellness">Wellness (Spa & Therapy)</option>
                  <option value="Consulting">Consulting & Advisory</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Professional Bio
                </label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell customers about your experience..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold shadow-lg shadow-blue-500/10 transition-colors flex justify-center items-center disabled:opacity-50 mt-6"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};
