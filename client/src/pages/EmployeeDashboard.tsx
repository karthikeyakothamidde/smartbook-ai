import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  History, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  CheckCircle, 
  Star, 
  Plus, 
  AlertCircle,
  TrendingUp,
  X,
  Sliders,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const EmployeeDashboard: React.FC = () => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'schedule' | 'availability' | 'leaves' | 'settings'>('schedule');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave Form
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStatus, setLeaveStatus] = useState<string | null>(null);

  // Availability Settings
  const [editingAvail, setEditingAvail] = useState<any[]>([]);

  // Profile Settings States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileBio, setProfileBio] = useState(user?.employeeProfile?.bio || '');
  const [profileSkills, setProfileSkills] = useState(user?.employeeProfile?.skills || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Toast Alerts
  const [toasts, setToasts] = useState<string[]>([]);

  const API_URL = 'https://smartbook-backend-68tc.onrender.com/api' || 'https://smartbook-backend-68tc.onrender.com/api';

  const showToast = (msg: string) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 4000);
  };

  const fetchEmployeeData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch Appointments
      const appRes = await fetch(`${API_URL}/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appRes.ok) {
        const data = await appRes.json();
        setAppointments(data);
      }

      // 2. Fetch Availability and Leaves
      const schedRes = await fetch(`${API_URL}/employees/me/schedule`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (schedRes.ok) {
        const data = await schedRes.json();
        setAvailability(data.availability || []);
        setEditingAvail(data.availability || []);
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error("Error loading employee data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'EMPLOYEE') {
      navigate('/login');
      return;
    }
    fetchEmployeeData();
  }, [token]);

  // Synchronize employee settings when user object completes loading
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      if (user.employeeProfile) {
        setProfileBio(user.employeeProfile.bio || '');
        setProfileSkills(user.employeeProfile.skills || '');
      }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Submit Leave File
  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate) return;

    try {
      const res = await fetch(`${API_URL}/employees/me/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: leaveDate, reason: leaveReason })
      });

      if (res.ok) {
        showToast("Leave submitted successfully.");
        setLeaveDate('');
        setLeaveReason('');
        fetchEmployeeData();
      } else {
        const data = await res.json();
        showToast(`Request failed: ${data.message}`);
      }
    } catch (err) {
      showToast("Error filing leave.");
    }
  };

  // Save Availability hours Changes
  const handleSaveAvailability = async () => {
    try {
      const res = await fetch(`${API_URL}/employees/me/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability: editingAvail })
      });

      if (res.ok) {
        showToast("Weekly working hours updated!");
        fetchEmployeeData();
      } else {
        showToast("Failed to save schedule.");
      }
    } catch (err) {
      showToast("Connection error while saving settings.");
    }
  };

  const handleToggleClosed = (index: number) => {
    const updated = [...editingAvail];
    updated[index] = { ...updated[index], isClosed: !updated[index].isClosed };
    setEditingAvail(updated);
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...editingAvail];
    updated[index] = { ...updated[index], [field]: value };
    setEditingAvail(updated);
  };

  const daysOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Update Profile Settings Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          password: profilePassword || undefined,
          bio: profileBio,
          skills: profileSkills
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Profile settings updated successfully!");
        updateUser(data);
        setProfilePassword('');
      } else {
        showToast(data.message || "Failed to update profile settings.");
      }
    } catch (err) {
      showToast("Error updating profile settings.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Filter schedules
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const todayApps = appointments.filter(a => {
    const appDateStr = new Date(a.startTime).toISOString().split('T')[0];
    return appDateStr === todayStr && a.status !== 'CANCELLED';
  });

  const upcomingApps = appointments.filter(a => {
    const appDate = new Date(a.startTime);
    return appDate > now && a.status === 'CONFIRMED' && appDate.toISOString().split('T')[0] !== todayStr;
  });

  const completedAppsCount = appointments.filter(a => a.status === 'COMPLETED').length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f7ff] dark:bg-[#080710] flex transition-colors duration-300">
      
      {/* Toast Alert overlay */}
      <div className="fixed top-6 right-6 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            key={idx} 
            className="p-4 rounded-xl bg-slate-900 border border-white/10 text-white shadow-xl flex items-center gap-3 text-sm pointer-events-auto"
          >
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span>{t}</span>
          </motion.div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#12111a]/70 backdrop-blur-md p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg dark:text-white">SmartBook AI</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 mb-8 flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl flex items-center justify-center uppercase">
              {(user?.name || '').charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-sm truncate text-slate-800 dark:text-white">{user?.name}</h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">Staff Account</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'schedule'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" /> Appointments Schedule
            </button>
            <button 
              onClick={() => setActiveTab('availability')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'availability'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Sliders className="h-4.5 w-4.5" /> Working Hours
            </button>
            <button 
              onClick={() => setActiveTab('leaves')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'leaves'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Briefcase className="h-4.5 w-4.5" /> Leave Management
            </button>
            <button 
              onClick={() => {
                setActiveTab('settings');
                setProfileName(user?.name || '');
                setProfileEmail(user?.email || '');
                setProfilePhone(user?.phone || '');
                setProfileBio(user?.employeeProfile?.bio || '');
                setProfileSkills(user?.employeeProfile?.skills || '');
              }}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Settings className="h-4.5 w-4.5" /> Profile Settings
            </button>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3.5"
        >
          <LogOut className="h-4.5 w-4.5" /> Sign Out
        </button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto">
        
        {/* Mobile Header */}
        <header className="flex justify-between items-center md:hidden mb-8">
          <span className="font-display font-bold text-lg dark:text-white">SmartBook AI Staff</span>
          <button onClick={handleLogout} className="p-2 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-slate-300 dark:bg-slate-800 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-300 dark:bg-slate-800 rounded-3xl" />)}
            </div>
            <div className="h-64 bg-slate-300 dark:bg-slate-800 rounded-3xl" />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Dashboard Title & Stats */}
            <div>
              <h1 className="font-display text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white">
                Welcome, {(user?.name || 'Staff').split(' ')[0]} 🚀
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Manage your shifts, Availability patterns, and review upcoming appointments.
              </p>
            </div>

            {/* Performance KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Today's Load</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{todayApps.length}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Appointments for today</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Service Rating</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2 flex items-center gap-1.5">
                  {user?.employeeProfile?.rating || '4.9'} <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Average client review score</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Completed Visits</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{completedAppsCount}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Lifetime completed bookings</p>
              </div>
            </div>

            {/* Tab: Appointment list */}
            {activeTab === 'schedule' && (
              <div className="space-y-8">
                
                {/* Today's Appointments */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Today's Agenda</h3>
                  
                  {todayApps.length === 0 ? (
                    <div className="p-8 text-center rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 text-slate-400 shadow-premium">
                      <CheckCircle className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm">No appointments scheduled for today. Take a break!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayApps.map(app => (
                        <div 
                          key={app.id}
                          className="p-5 rounded-2xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow flex justify-between items-center"
                        >
                          <div>
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wide">
                              {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(app.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <h4 className="font-bold text-slate-800 dark:text-white text-md mt-1">{app.service.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Customer: {app.customer.name}</p>
                            {app.notes && <p className="text-xs text-slate-400 italic mt-2">"{app.notes}"</p>}
                          </div>
                          
                          <div className="text-right">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                              app.noShowRisk === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                              app.noShowRisk === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                            }`}>
                              No-show: {app.noShowRisk} Risk
                            </span>
                            <span className="text-xs text-slate-400 block mt-2">Prob: {Math.round(app.noShowProbability * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Schedule */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Upcoming Assignments</h3>
                  
                  {upcomingApps.length === 0 ? (
                    <div className="p-8 text-center rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 text-slate-400 shadow-premium">
                      No future bookings scheduled.
                    </div>
                  ) : (
                    <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-xs text-slate-400 font-bold uppercase">
                            <th className="pb-3">Service</th>
                            <th className="pb-3">Date & Time</th>
                            <th className="pb-3">Customer</th>
                            <th className="pb-3">No-Show Prediction</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-white/5">
                          {upcomingApps.map(app => (
                            <tr key={app.id} className="text-slate-700 dark:text-slate-300">
                              <td className="py-3 font-semibold text-slate-900 dark:text-white">{app.service.name}</td>
                              <td className="py-3">{new Date(app.startTime).toLocaleString()}</td>
                              <td className="py-3">{app.customer.name}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                  app.noShowRisk === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                                  app.noShowRisk === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                                }`}>
                                  {app.noShowRisk} RISK ({Math.round(app.noShowProbability * 100)}%)
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab: Availability Hours Configuration */}
            {activeTab === 'availability' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Configure Availability Settings</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Set your working days and active shifts. AI booking engine matches users based on these parameters.</p>
                </div>

                <div className="p-8 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-4">
                  {editingAvail.map((avail, index) => (
                    <div 
                      key={avail.id || index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={!avail.isClosed}
                          onChange={() => handleToggleClosed(index)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-sm w-24 text-slate-800 dark:text-slate-200">
                          {daysOfWeekNames[avail.dayOfWeek]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {!avail.isClosed ? (
                          <>
                            <input 
                              type="time"
                              value={avail.startTime}
                              onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                              className="bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-lg p-2 text-slate-800 dark:text-white"
                            />
                            <span>to</span>
                            <input 
                              type="time"
                              value={avail.endTime}
                              onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                              className="bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-lg p-2 text-slate-800 dark:text-white"
                            />
                          </>
                        ) : (
                          <span className="text-red-400 font-semibold italic">Off-duty / Closed</span>
                        )}
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={handleSaveAvailability}
                    className="w-full mt-6 py-3.5 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white dark:text-slate-950 font-bold transition-all"
                  >
                    Save Working Hours
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Leave application */}
            {activeTab === 'leaves' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Apply form */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Request Time-Off</h3>
                  <form onSubmit={handleRequestLeave} className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Leave Date</label>
                      <input 
                        type="date"
                        required
                        value={leaveDate}
                        onChange={(e) => setLeaveDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#12111a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Reason</label>
                      <textarea 
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        rows={3}
                        placeholder="State reason for your leave request..."
                        className="w-full bg-slate-50 dark:bg-[#12111a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-bold"
                    >
                      File Time-Off
                    </button>
                  </form>
                </div>

                {/* History list */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Leave History</h3>
                  <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-3">
                    {leaves.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-sm">No leave requests logged.</div>
                    ) : (
                      leaves.map(l => (
                        <div key={l.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-white">{l.date}</span>
                            <span className="text-slate-400 mt-1 block">Reason: {l.reason || 'None provided'}</span>
                          </div>
                          <span className={`px-2 py-0.5 font-bold rounded ${
                            l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                            l.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {l.status || 'PENDING'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Profile Settings</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Update your professional details and password.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="p-8 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Full Name</label>
                      <input 
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Phone Number</label>
                      <input 
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">New Password (leave blank to keep current)</label>
                      <input 
                        type="password"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Skills Categories (comma-separated)</label>
                    <input 
                      type="text"
                      required
                      value={profileSkills}
                      onChange={(e) => setProfileSkills(e.target.value)}
                      placeholder="Dental Cleaning, Cavity Filling"
                      className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Professional Bio</label>
                    <textarea 
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={profileLoading}
                    className="w-full py-3.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-bold shadow transition-colors flex justify-center items-center disabled:opacity-50"
                  >
                    {profileLoading ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </form>
              </div>
            )}

          </div>
        )}
      </main>

    </div>
  );
};
