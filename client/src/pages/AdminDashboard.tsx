import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Trash2,
  Plus, 
  CheckCircle, 
  Sliders, 
  BarChart3, 
  UserPlus, 
  FolderPlus,
  Clock,
  LogOut,
  Activity,
  ListOrdered,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// FullCalendar Imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export const AdminDashboard: React.FC = () => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'calendar' | 'analytics' | 'employees' | 'services' | 'waitlist' | 'settings'>('calendar');
  
  // Data States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Dental');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('password123');
  const [newEmpSkills, setNewEmpSkills] = useState('Dental');
  const [newEmpBio, setNewEmpBio] = useState('');

  // Service Edit States
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Profile Settings States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Selected Appointment Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState('');
  const [updatedPaymentStatus, setUpdatedPaymentStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Toast Alerts
  const [toasts, setToasts] = useState<string[]>([]);

  const API_URL = 'https://smartbook-backend-68tc.onrender.com/api' || 'https://smartbook-backend-68tc.onrender.com/api';

  const showToast = (msg: string) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 4000);
  };

  const fetchAdminData = async (showSkeleton = false) => {
    if (!token) return;
    if (showSkeleton) setLoading(true);
    try {
      // 1. Fetch appointments
      const appRes = await fetch(`${API_URL}/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appRes.ok) {
        const data = await appRes.json();
        setAppointments(data);
      }

      // 2. Fetch employees
      const empRes = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
      }

      // 3. Fetch services
      const serRes = await fetch(`${API_URL}/services`);
      if (serRes.ok) {
        const data = await serRes.json();
        setServices(data);
      }

      // 4. Fetch waitlist
      const wlRes = await fetch(`${API_URL}/appointments/waitlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (wlRes.ok) {
        const data = await wlRes.json();
        setWaitlist(data);
      }

      // 5. Fetch analytics
      const anaRes = await fetch(`${API_URL}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (anaRes.ok) {
        const data = await anaRes.json();
        setAnalytics(data);
      }

      // 6. Fetch leaves
      const leavesRes = await fetch(`${API_URL}/employees/leaves`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error("Error loading admin dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAdminData(true); // Show loading skeleton on first mount

    // Real-time polling: refresh dashboard data silently every 10 seconds
    const interval = setInterval(() => {
      fetchAdminData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  // Synchronize admin settings when user object completes loading
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Drag-and-drop Reschedule Handler
  const handleEventDrop = async (info: any) => {
    const appId = info.event.id;
    const newStart = info.event.start;
    if (!newStart) return;

    try {
      const res = await fetch(`${API_URL}/appointments/${appId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ startTime: newStart.toISOString() })
      });

      if (res.ok) {
        showToast("Appointment successfully rescheduled on calendar.");
        fetchAdminData(); // refresh to reload analytics/no-show risk updates
      } else {
        const errorData = await res.json();
        showToast(`Conflict error: ${errorData.message}`);
        info.revert();
      }
    } catch (err) {
      showToast("Error updating schedule slot.");
      info.revert();
    }
  };

  // Create Service Handler
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;

    try {
      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newServiceName,
          duration: newServiceDuration,
          price: newServicePrice,
          category: newServiceCategory,
          description: newServiceDesc
        })
      });

      if (res.ok) {
        showToast(`Created Service: ${newServiceName}`);
        setNewServiceName('');
        setNewServicePrice('');
        setNewServiceDesc('');
        fetchAdminData();
      } else {
        showToast("Failed to create service.");
      }
    } catch (err) {
      showToast("Connection error while adding service.");
    }
  };

  // Add Employee Handler
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpEmail || !newEmpPassword) return;

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newEmpName,
          email: newEmpEmail,
          password: newEmpPassword,
          role: 'EMPLOYEE',
          skills: newEmpSkills,
          bio: newEmpBio || `Professional specialist in ${newEmpSkills}`
        })
      });

      if (res.ok) {
        showToast(`Added Employee: ${newEmpName}`);
        setNewEmpName('');
        setNewEmpEmail('');
        setNewEmpPassword('password123');
        setNewEmpBio('');
        fetchAdminData();
      } else {
        const errorData = await res.json();
        showToast(`Register error: ${errorData.message}`);
      }
    } catch (err) {
      showToast("Connection error while adding employee.");
    }
  };

  // Delete Employee Handler
  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this employee? This will permanently delete their account and all their scheduled appointments.")) return;

    try {
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        showToast("Employee deleted successfully!");
        fetchAdminData();
      } else {
        const errorData = await res.json();
        showToast(errorData.message || "Failed to delete employee.");
      }
    } catch (err) {
      showToast("Error connecting to server.");
    }
  };

  // Update Leave Request Status Handler (Accept / Decline)
  const handleUpdateLeaveStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_URL}/employees/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        showToast(`Leave request ${status.toLowerCase()} successfully!`);
        fetchAdminData();
      } else {
        const errorData = await res.json();
        showToast(errorData.message || "Failed to update leave request.");
      }
    } catch (err) {
      showToast("Error connecting to server.");
    }
  };

  // Update Service Price & Info Handler
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const res = await fetch(`${API_URL}/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          duration: editDuration,
          price: editPrice,
          category: editCategory,
          description: editDesc
        })
      });

      if (res.ok) {
        showToast(`Updated Service: ${editName}`);
        setEditingService(null);
        fetchAdminData();
      } else {
        showToast("Failed to update service details.");
      }
    } catch (err) {
      showToast("Error connecting to services server.");
    }
  };

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
          password: profilePassword || undefined
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

  // Update appointment status (Admin modal action)
  const handleUpdateAppointmentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setStatusLoading(true);
    try {
      const res = await fetch(`${API_URL}/appointments/${selectedAppointment.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updatedStatus,
          paymentStatus: updatedPaymentStatus
        })
      });

      if (res.ok) {
        showToast("Appointment status updated successfully!");
        setSelectedAppointment(null);
        fetchAdminData();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to update appointment status.");
      }
    } catch (err) {
      showToast("Error updating appointment status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCancelFromModal = async () => {
    if (!selectedAppointment) return;
    if (!window.confirm("Are you sure you want to cancel this appointment? This will run the auto-waitlist promotion engine.")) return;

    try {
      const res = await fetch(`${API_URL}/appointments/${selectedAppointment.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        showToast("Appointment cancelled. Auto-promotion triggered!");
        setSelectedAppointment(null);
        fetchAdminData();
      } else {
        const data = await res.json();
        showToast(data.message || "Cancellation failed.");
      }
    } catch (err) {
      showToast("Error cancelling appointment.");
    }
  };

  const pendingLeavesCount = leaves.filter(l => l.status === 'PENDING').length;

  // Map database appointments to FullCalendar format
  const calendarEvents = appointments.map(app => {
    // Set colors based on status
    let color = '#3b82f6'; // Confirmed = blue
    if (app.status === 'COMPLETED') color = '#10b981'; // green
    if (app.status === 'CANCELLED') color = '#ef4444'; // red

    return {
      id: app.id,
      title: `${app.service.name} (${app.customer.name})`,
      start: app.startTime,
      end: app.endTime,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        status: app.status,
        risk: app.noShowRisk
      }
    };
  });

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
            <div className="h-10 w-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center">
              A
            </div>
            <div>
              <h4 className="font-semibold text-sm truncate dark:text-white">Administrator</h4>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Super Control</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <CalendarIcon className="h-4.5 w-4.5" /> Bookings Calendar
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" /> Analytics Insights
            </button>
            <button 
              onClick={() => setActiveTab('employees')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <UserPlus className="h-4.5 w-4.5" /> Staff Management
              </div>
              {pendingLeavesCount > 0 && (
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500 text-slate-950 shadow animate-pulse">
                  {pendingLeavesCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'services'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <FolderPlus className="h-4.5 w-4.5" /> Services Settings
            </button>
            <button 
              onClick={() => setActiveTab('waitlist')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'waitlist'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <ListOrdered className="h-4.5 w-4.5" /> Waitlist Queue
            </button>
            <button 
              onClick={() => {
                setActiveTab('settings');
                setProfileName(user?.name || '');
                setProfileEmail(user?.email || '');
                setProfilePhone(user?.phone || '');
              }}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Sliders className="h-4.5 w-4.5" /> Profile Settings
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

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-slate-300 dark:bg-slate-800 rounded" />
            <div className="h-96 bg-slate-300 dark:bg-slate-800 rounded-3xl" />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Heading */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-display text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white">Admin Command Center</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage client appointments, view predictive analytics, and organize shifts.</p>
              </div>
            </div>

            {/* Tab: Calendar */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                
                {/* Floating Real-time Leave Requests Notification Banner */}
                {pendingLeavesCount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setActiveTab('employees')}
                    className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-all shadow-lg shadow-amber-500/5 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <span className="font-bold text-sm block">Pending Leave Requests</span>
                        <span className="text-xs opacity-80">You have {pendingLeavesCount} staff leave request{pendingLeavesCount > 1 ? 's' : ''} awaiting approval. Click here to review.</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg">
                      Review
                    </span>
                  </motion.div>
                )}

                <div className="p-6 rounded-3xl bg-white dark:bg-[#12111a] border border-slate-200/50 dark:border-white/5 shadow-premium">
                  <div className="flex items-center gap-2 mb-6">
                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                    <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Interactive Bookings Grid</h3>
                  </div>
                  
                  <div className="calendar-container">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="timeGridWeek"
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                      }}
                      slotMinTime="08:00:00"
                      slotMaxTime="20:00:00"
                      events={calendarEvents}
                      editable={true}
                      eventDrop={handleEventDrop}
                      eventClick={(info) => {
                        const app = appointments.find(a => a.id === info.event.id);
                        if (app) {
                          setSelectedAppointment(app);
                          setUpdatedStatus(app.status);
                          setUpdatedPaymentStatus(app.paymentStatus);
                        }
                      }}
                      height="auto"
                    />
                  </div>
                </div>

                {/* Appointments Table List */}
                <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-white/5 animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">All Bookings & Customer Details</h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{appointments.length} Total Bookings</span>
                  </div>

                  <div className="rounded-3xl bg-white dark:bg-[#12111a] border border-slate-200/50 dark:border-white/5 shadow-premium overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-xs text-slate-400 font-bold uppercase">
                          <th className="py-4 px-6">Customer Details</th>
                          <th className="py-4 px-6">Service Chosen</th>
                          <th className="py-4 px-6">Date & Time</th>
                          <th className="py-4 px-6">Staff Assigned</th>
                          <th className="py-4 px-6">Payment</th>
                          <th className="py-4 px-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100 dark:divide-white/5">
                        {appointments.map(app => (
                          <tr key={app.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900 dark:text-white">{app.customer.name}</div>
                              <div className="text-[11px] text-slate-400">{app.customer.email}</div>
                              <div className="text-[11px] text-slate-400">{app.customer.phone || 'No phone'}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{app.service.name}</div>
                              <div className="text-[11px] text-blue-500">₹{app.service.price} | {app.service.duration} min</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(app.startTime).toLocaleDateString()}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(app.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-medium">
                              {app.employee?.user?.name || 'Unassigned'}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                app.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {app.paymentStatus}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                app.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-500' :
                                app.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                                'bg-red-500/10 text-red-500'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Analytics */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-8">
                {/* Analytics Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="p-5 rounded-2xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Total Revenue</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">₹{analytics.summary.revenue}</h3>
                  </div>
                  <div className="p-5 rounded-2xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Today's Bookings</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{analytics.summary.todayAppointments}</h3>
                  </div>
                  <div className="p-5 rounded-2xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <span className="text-xs text-slate-400 font-semibold uppercase">No-Show Rate</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{analytics.summary.noShowRate}%</h3>
                  </div>
                  <div className="p-5 rounded-2xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Workforce Util.</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{analytics.summary.employeeUtilization}%</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Peak Booking Hours */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <h4 className="font-display font-bold text-slate-800 dark:text-white text-md mb-6">Peak Booking Hours</h4>
                    <div className="space-y-4">
                      {analytics.peakBookingHours.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="dark:text-slate-300">{item.hour}</span>
                            <span className="text-blue-500">{item.bookings} bookings</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                            {/* Proportional width calculation */}
                            <div 
                              className="bg-blue-500 h-full rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(5, (item.bookings / 10) * 100))}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Service Categories */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <h4 className="font-display font-bold text-slate-800 dark:text-white text-md mb-6">Popular Service Categories</h4>
                    <div className="space-y-5">
                      {analytics.popularServices.length === 0 ? (
                        <div className="text-center text-slate-400 text-xs py-8">No booking data available.</div>
                      ) : (
                        analytics.popularServices.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-indigo-500" />
                              <span className="text-xs font-semibold dark:text-slate-300">{item.category}</span>
                            </div>
                            <span className="text-xs font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded">
                              {item.bookings} bookings
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Staff Productivity List */}
                <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                  <h4 className="font-display font-bold text-slate-800 dark:text-white text-md mb-6">Staff Productivity & Ratings</h4>
                  <div className="space-y-4">
                    {analytics.employeeProductivity.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 border-b dark:border-white/5 last:border-0">
                        <div className="text-xs">
                          <span className="font-bold text-slate-800 dark:text-white">{item.name}</span>
                          <span className="text-slate-400 mt-1 block">Completed visits: {item.completedAppointments}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                          ★ {item.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Employees Settings */}
            {activeTab === 'employees' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Form to Add Staff */}
                <div className="md:col-span-1 space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Add Staff Member</h3>
                  
                  <form onSubmit={handleAddEmployee} className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Staff Name</label>
                      <input 
                        type="text"
                        required
                        value={newEmpName}
                        onChange={(e) => setNewEmpName(e.target.value)}
                        placeholder="Dr. Sarah Jenkins"
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={newEmpEmail}
                        onChange={(e) => setNewEmpEmail(e.target.value)}
                        placeholder="sarah@smartbook.ai"
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Password</label>
                      <input 
                        type="text"
                        required
                        value={newEmpPassword}
                        onChange={(e) => setNewEmpPassword(e.target.value)}
                        placeholder="e.g. password123"
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Service Skill Category</label>
                      <select 
                        value={newEmpSkills}
                        onChange={(e) => setNewEmpSkills(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#12111a] border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      >
                        <option value="Dental">Dental</option>
                        <option value="Salon">Salon</option>
                        <option value="Wellness">Wellness</option>
                        <option value="Consulting">Consulting</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Bio Note</label>
                      <textarea 
                        value={newEmpBio}
                        onChange={(e) => setNewEmpBio(e.target.value)}
                        rows={3}
                        placeholder="Credentials, experiences..."
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-bold shadow hover:bg-blue-700 dark:hover:bg-blue-400 transition-all"
                    >
                      Register Employee
                    </button>
                  </form>
                </div>

                {/* List Staff */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Active Team Members</h3>
                  
                  <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-4">
                    {employees.map(emp => (
                      <div 
                        key={emp.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border flex justify-between items-center text-xs"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{emp.name}</h4>
                          <span className="text-slate-400 block mt-1">{emp.email}</span>
                          <span className="text-blue-500 mt-1 block font-medium">Skills: {emp.skills}</span>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <span className="font-bold text-amber-500 text-sm">★ {emp.rating}</span>
                            <span className="text-slate-400 mt-1 block">{emp.experienceYears} yrs experience</span>
                          </div>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all"
                            title="Delete Employee"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Leave Requests Section */}
                <div className="space-y-4 mt-8">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Staff Leave Requests</h3>
                  
                  {leaves.length === 0 ? (
                    <div className="p-8 text-center rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 text-slate-400 shadow-premium">
                      No leave requests logged.
                    </div>
                  ) : (
                    <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-xs text-slate-400 font-bold uppercase">
                            <th className="pb-3">Staff Member</th>
                            <th className="pb-3">Requested Date</th>
                            <th className="pb-3">Reason</th>
                            <th className="pb-3 text-center">Status</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-white/5">
                          {leaves.map(l => (
                            <tr key={l.id} className="text-slate-700 dark:text-slate-300">
                              <td className="py-3.5 font-semibold text-slate-900 dark:text-white">
                                {l.employee?.user?.name || 'Unknown Staff'}
                                <span className="text-[10px] text-slate-400 block mt-0.5">{l.employee?.user?.email}</span>
                              </td>
                              <td className="py-3.5 font-medium">
                                {new Date(l.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </td>
                              <td className="py-3.5 italic text-slate-500 max-w-xs truncate" title={l.reason}>
                                "{l.reason || 'No reason provided'}"
                              </td>
                              <td className="py-3.5 text-center">
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded ${
                                  l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                  l.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {l.status || 'PENDING'}
                                </span>
                              </td>
                              <td className="py-3.5 text-right space-x-2">
                                {l.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateLeaveStatus(l.id, 'APPROVED')}
                                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-sm"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleUpdateLeaveStatus(l.id, 'REJECTED')}
                                      className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all shadow-sm"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
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

            {/* Tab: Services Settings */}
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Form to Add Service */}
                <div className="md:col-span-1 space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Add Service Item</h3>
                  
                  <form onSubmit={handleCreateService} className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Service Name</label>
                      <input 
                        type="text"
                        required
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Dental Checkup"
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Duration (min)</label>
                        <input 
                          type="number"
                          required
                          value={newServiceDuration}
                          onChange={(e) => setNewServiceDuration(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Price (INR)</label>
                        <input 
                          type="number"
                          required
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          placeholder="1500"
                          className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Category</label>
                      <select 
                        value={newServiceCategory}
                        onChange={(e) => setNewServiceCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#12111a] border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      >
                        <option value="Dental">Dental</option>
                        <option value="Salon">Salon</option>
                        <option value="Wellness">Wellness</option>
                        <option value="Consulting">Consulting</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Description</label>
                      <textarea 
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                        rows={3}
                        placeholder="Description of the service..."
                        className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-bold shadow hover:bg-blue-700 dark:hover:bg-blue-400 transition-all"
                    >
                      Create Service Item
                    </button>
                  </form>
                </div>

                {/* List Services */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Active Service Catalog</h3>
                  
                  <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-4">
                    {services.map(s => (
                      <div 
                        key={s.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border flex justify-between items-center text-xs animate-fade-in"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h4>
                          <span className="text-slate-400 mt-1 block">Category: {s.category} | Duration: {s.duration} min</span>
                          <span className="text-slate-500 mt-1 block italic">{s.description}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">₹{s.price}</span>
                          <button
                            onClick={() => {
                              setEditingService(s);
                              setEditName(s.name);
                              setEditPrice(s.price.toString());
                              setEditDuration(s.duration.toString());
                              setEditCategory(s.category);
                              setEditDesc(s.description);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded hover:bg-blue-500/20 transition-all"
                          >
                            Edit Item
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab: Waitlist queue */}
            {activeTab === 'waitlist' && (() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayWaitlist = waitlist.filter(w => w.preferredDate === todayStr);
              const upcomingWaitlist = waitlist.filter(w => w.preferredDate !== todayStr);

              return (
                <div className="space-y-8">
                  {/* Today's Waitlist */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Today's Waitlist Queue ({todayWaitlist.length})</h3>
                    <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-xs text-slate-400 font-bold uppercase">
                            <th className="pb-3">Client</th>
                            <th className="pb-3">Service Requested</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Hour Range</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-white/5">
                          {todayWaitlist.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">No waitlisted clients for today.</td>
                            </tr>
                          ) : (
                            todayWaitlist.map(w => (
                              <tr key={w.id} className="text-slate-700 dark:text-slate-300">
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{w.customer.name}</td>
                                <td className="py-3">{w.service.name}</td>
                                <td className="py-3">{w.preferredDate}</td>
                                <td className="py-3">{w.preferredTimeRange}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                    w.status === 'PROMOTED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {w.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Upcoming Waitlist */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Upcoming Waitlist Queue ({upcomingWaitlist.length})</h3>
                    <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-xs text-slate-400 font-bold uppercase">
                            <th className="pb-3">Client</th>
                            <th className="pb-3">Service Requested</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Hour Range</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-white/5">
                          {upcomingWaitlist.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">No upcoming waitlisted clients.</td>
                            </tr>
                          ) : (
                            upcomingWaitlist.map(w => (
                              <tr key={w.id} className="text-slate-700 dark:text-slate-300">
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">{w.customer.name}</td>
                                <td className="py-3">{w.service.name}</td>
                                <td className="py-3">{w.preferredDate}</td>
                                <td className="py-3">{w.preferredTimeRange}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                    w.status === 'PROMOTED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {w.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Admin Profile Settings</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage credentials and authentication details.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="p-8 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-4">
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

                  <button 
                    type="submit"
                    disabled={profileLoading}
                    className="w-full py-3.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-bold shadow transition-colors flex justify-center items-center disabled:opacity-50"
                  >
                    {profileLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            )}

          </div>
        )}
      </main>

      {/* SERVICE EDITING POPUP */}
      <AnimatePresence>
        {editingService && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-[#12111a] border border-white/10 p-8 text-white shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setEditingService(null)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">Edit Service Configuration</span>
              </div>

              <form onSubmit={handleUpdateService} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Service Name</label>
                  <input 
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Duration (min)</label>
                    <input 
                      type="number"
                      required
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Price (INR)</label>
                    <input 
                      type="number"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Category</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#12111a] border border-white/5 rounded-xl py-3 px-3 text-sm text-white focus:outline-none"
                  >
                    <option value="Dental">Dental</option>
                    <option value="Salon">Salon</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Description</label>
                  <textarea 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold shadow-md transition-colors"
                >
                  Save Service Settings
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APPOINTMENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedAppointment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-[#12111a] border border-white/10 p-8 text-white shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">Appointment Intelligence View</span>
              </div>

              {/* Service & Time */}
              <div className="space-y-4">
                <div>
                  <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded">
                    {selectedAppointment.service.category}
                  </span>
                  <h3 className="text-xl font-bold mt-2 font-display">{selectedAppointment.service.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled: {new Date(selectedAppointment.startTime).toLocaleString()} - {new Date(selectedAppointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 text-xs">
                  <div>
                    <h5 className="text-slate-500 font-semibold uppercase tracking-wide mb-1">Customer Details</h5>
                    <p className="font-bold text-white text-sm">{selectedAppointment.customer.name}</p>
                    <p className="text-slate-400 mt-0.5">{selectedAppointment.customer.email}</p>
                    <p className="text-slate-400 mt-0.5">{selectedAppointment.customer.phone || 'No phone number'}</p>
                  </div>
                  <div>
                    <h5 className="text-slate-500 font-semibold uppercase tracking-wide mb-1">Assigned Specialist</h5>
                    <p className="font-bold text-white text-sm">{selectedAppointment.employee?.user?.name || 'Unassigned'}</p>
                    <p className="text-slate-400 mt-0.5">Price: ₹{selectedAppointment.service.price}</p>
                    <p className="text-slate-400 mt-0.5">Duration: {selectedAppointment.service.duration} mins</p>
                  </div>
                </div>

                {/* AI Predictive analysis */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-blue-400 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" /> AI Prediction: No-Show Probability
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      selectedAppointment.noShowRisk === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                      selectedAppointment.noShowRisk === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-green-500/10 text-green-400'
                    }`}>
                      {selectedAppointment.noShowRisk} RISK
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Based on past customer bookings, scheduling window, and lead hours, this customer has a <strong className="text-white">{Math.round(selectedAppointment.noShowProbability * 100)}%</strong> probability of missing this slot.
                  </p>
                </div>

                {selectedAppointment.notes && (
                  <div className="p-3 rounded-xl bg-white/5 text-xs text-slate-300 italic">
                    Note: "{selectedAppointment.notes}"
                  </div>
                )}

                {/* Status Form */}
                <form onSubmit={handleUpdateAppointmentStatus} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Booking Status</label>
                      <select 
                        value={updatedStatus}
                        onChange={(e) => setUpdatedStatus(e.target.value)}
                        className="w-full bg-[#12111a] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                      >
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Payment Status</label>
                      <select 
                        value={updatedPaymentStatus}
                        onChange={(e) => setUpdatedPaymentStatus(e.target.value)}
                        className="w-full bg-[#12111a] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 text-xs font-bold">
                    <button 
                      type="button"
                      onClick={handleCancelFromModal}
                      className="px-4 py-3 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/5 transition-colors"
                    >
                      Cancel Booking
                    </button>
                    <button 
                      type="submit"
                      disabled={statusLoading}
                      className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-xl transition-colors font-bold shadow"
                    >
                      {statusLoading ? 'Saving...' : 'Update Status'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
