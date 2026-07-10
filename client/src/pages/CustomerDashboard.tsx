import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  History, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  CreditCard, 
  CheckCircle, 
  FileText, 
  Star, 
  Plus, 
  Search,
  MessageSquare,
  TrendingUp,
  X,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerDashboard: React.FC = () => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'booking' | 'history' | 'notifications' | 'settings'>('dashboard');

  // Profile Settings States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Data States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [waitlists, setWaitlists] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiServiceMatch, setAiServiceMatch] = useState<any>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Manual Booking Form
  const [selectedService, setSelectedService] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Payment Sim Modal
  const [payingAppointment, setPayingAppointment] = useState<any>(null);
  const [paySuccessData, setPaySuccessData] = useState<any>(null);
  const [payLoading, setPayLoading] = useState(false);

  // Invoice Modal
  const [activeInvoice, setActiveInvoice] = useState<any>(null);

  // Review Modal
  const [reviewAppointment, setReviewAppointment] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Toast Alerts
  const [toasts, setToasts] = useState<string[]>([]);

  // Dynamic Available Slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const showToast = (msg: string) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 4000);
  };

  const fetchData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      // Fetch appointments
      const appRes = await fetch(`${API_URL}/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appRes.ok) {
        const data = await appRes.json();
        setAppointments(data);
      }

      // Fetch services
      const serRes = await fetch(`${API_URL}/services`);
      if (serRes.ok) {
        const data = await serRes.json();
        setServices(data);
      }

      // Fetch employees
      const empRes = await fetch(`${API_URL}/employees`);
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
      }

      // Fetch notifications
      const notRes = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notRes.ok) {
        const data = await notRes.json();
        setNotifications(data);
      }

      // Fetch waitlists
      const wlRes = await fetch(`${API_URL}/appointments/waitlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (wlRes.ok) {
        const data = await wlRes.json();
        setWaitlists(data);
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token]);

  // Fetch available slots dynamically when inputs change
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedService || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setSlotsLoading(true);
      try {
        const res = await fetch(`${API_URL}/appointments/available-slots?serviceId=${selectedService}&employeeId=${selectedEmployee}&date=${selectedDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data);
          // If the currently selected time is not in the new available slots list, clear or reset it
          if (data.length > 0) {
            if (!selectedTime || !data.includes(selectedTime)) {
              setSelectedTime(data[0]);
            }
          } else {
            setSelectedTime('');
          }
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedService, selectedEmployee, selectedDate]);

  // Synchronize customer settings when user object completes loading
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

  // AI Prompt Parsing
  const handleAIPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setAiSuggestions([]);
    setAiServiceMatch(null);
    setAiFeedback(null);

    try {
      const res = await fetch(`${API_URL}/appointments/ai-parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      const data = await res.json();
      if (res.ok) {
        setAiSuggestions(data.suggestedSlots || []);
        setAiServiceMatch(data.service || null);
        if (!data.suggestedSlots || data.suggestedSlots.length === 0) {
          setAiFeedback("No slots found matching your criteria on that day. Try adjusting the time window or staff name.");
        }
      } else {
        setAiFeedback(data.message || "Failed to analyze your request. Please try manual scheduling.");
      }
    } catch (err) {
      setAiFeedback("Error parsing query. Please check your network connection.");
    } finally {
      setAiLoading(false);
    }
  };

  // Confirm AI suggested Slot
  const handleBookSuggestedSlot = async (slot: any) => {
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: slot.serviceId,
          employeeId: slot.employeeId,
          startTime: slot.startTime,
          notes: `Booked via Smart AI assistant prompt: "${aiPrompt}"`
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Successfully booked ${slot.serviceName} for ${new Date(slot.startTime).toLocaleDateString()}`);
        setAiPrompt('');
        setAiSuggestions([]);
        setAiServiceMatch(null);
        fetchData();
        setActiveTab('dashboard');
      } else {
        showToast(`Booking error: ${data.message}`);
      }
    } catch (err) {
      showToast("Connection failure during booking.");
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async (appId: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await fetch(`${API_URL}/appointments/${appId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        showToast("Appointment cancelled. If anyone was waiting, the slot has been allocated to them!");
        fetchData();
      } else {
        const data = await res.json();
        showToast(`Cancellation failed: ${data.message}`);
      }
    } catch (err) {
      showToast("Error processing cancellation.");
    }
  };

  // Submit Manual Booking
  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!selectedService || !selectedDate || !selectedTime) {
      setBookingError("Please select a service, date, and an available time slot.");
      return;
    }

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: selectedService,
          employeeId: selectedEmployee || undefined,
          startTime: startDateTime.toISOString(),
          notes
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Appointment successfully scheduled!");
        // Reset Form
        setSelectedService('');
        setSelectedEmployee('');
        setSelectedDate('');
        setNotes('');
        fetchData();
        setActiveTab('dashboard');
      } else if (res.status === 409 && data.suggestWaitlist) {
        // Offer waitlist choice
        if (window.confirm("That slot is fully booked. Would you like to join the waitlist for this date?")) {
          handleJoinWaitlist(selectedService, selectedDate);
        }
      } else {
        setBookingError(data.message || "Booking failed.");
      }
    } catch (err) {
      setBookingError("Could not submit booking request.");
    }
  };

  // Join Waitlist
  const handleJoinWaitlist = async (serviceId: string, date: string) => {
    try {
      const res = await fetch(`${API_URL}/appointments/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId,
          preferredDate: date,
          preferredTimeRange: "ANYTIME"
        })
      });

      if (res.ok) {
        showToast("Added to the waitlist. We will notify you if a slot opens up!");
        fetchData();
      } else {
        showToast("Failed to join waitlist.");
      }
    } catch (err) {
      showToast("Waitlist request failed.");
    }
  };

  // Simulate Razorpay Checkout & Verification
  const triggerPaymentFlow = async (app: any) => {
    setPayingAppointment(app);
    setPaySuccessData(null);
    setPayLoading(true);

    try {
      // 1. Get Checkout details
      const res1 = await fetch(`${API_URL}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ appointmentId: app.id })
      });

      const orderData = await res1.json();
      if (!res1.ok) throw new Error(orderData.message || "Checkout initialization failed");

      // 2. Simulate user processing (delayed payment completion)
      setTimeout(async () => {
        try {
          const res2 = await fetch(`${API_URL}/payments/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              appointmentId: app.id,
              razorpayOrderId: orderData.orderId,
              razorpayPaymentId: `pay_${Math.random().toString(36).substring(2, 10)}`
            })
          });

          const verifyData = await res2.json();
          if (res2.ok) {
            setPaySuccessData(verifyData);
            showToast(`Invoice ${verifyData.invoiceNumber} paid!`);
            fetchData();
          } else {
            showToast("Payment verification failed.");
          }
        } catch (err) {
          showToast("Payment verification error.");
        } finally {
          setPayLoading(false);
        }
      }, 2500); // 2.5 seconds mock processing loading screen

    } catch (err: any) {
      showToast(err.message || "Payment process aborted.");
      setPayLoading(false);
      setPayingAppointment(null);
    }
  };

  // Get and view invoice receipt details
  const viewInvoiceReceipt = async (appId: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/invoice/${appId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveInvoice(data);
      } else {
        showToast("Failed to fetch invoice details.");
      }
    } catch (err) {
      showToast("Error loading invoice.");
    }
  };

  // Submit appointment review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: reviewAppointment.id,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        showToast("Review submitted successfully! Thank you.");
        setReviewAppointment(null);
        setReviewRating(5);
        setReviewComment('');
        fetchData();
      } else {
        const data = await res.json();
        showToast(`Review failed: ${data.message}`);
      }
    } catch (err) {
      showToast("Error uploading review.");
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {}
  };

  // Filter lists
  const upcomingApps = appointments.filter(a => a.status === 'CONFIRMED' && new Date(a.startTime) > new Date());
  const historyApps = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED' || (a.status === 'CONFIRMED' && new Date(a.startTime) <= new Date()));

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

      {/* Sidebar Navigation */}
      <aside className="w-80 border-r border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#12111a]/70 backdrop-blur-md p-6 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg dark:text-white">SmartBook AI</span>
          </div>

          {/* User profile card in sidebar */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 mb-8 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center uppercase">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate text-slate-800 dark:text-white">{user?.name}</h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role.toLowerCase()} Profile</span>
            </div>
          </div>

          {/* Menu Options */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('booking')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'booking'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Plus className="h-4.5 w-4.5" /> Book Appointment
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <History className="h-4.5 w-4.5" /> History & Payments
            </button>
            <button 
              onClick={() => { setActiveTab('notifications'); markAllNotificationsRead(); }}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${
                activeTab === 'notifications'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3.5">
                <Bell className="h-4.5 w-4.5" /> Notifications
              </span>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="h-5 min-w-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
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
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Settings className="h-4.5 w-4.5" /> Profile Settings
            </button>
          </nav>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3.5"
        >
          <LogOut className="h-4.5 w-4.5" /> Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto">
        
        {/* Mobile Header */}
        <header className="flex justify-between items-center md:hidden mb-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span className="font-display font-bold text-lg dark:text-white">SmartBook AI</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {loadingData ? (
          /* Loading Skeleton state */
          <div className="space-y-6">
            <div className="h-8 w-48 bg-slate-300 dark:bg-slate-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-300 dark:bg-slate-800 rounded-3xl animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-slate-300 dark:bg-slate-800 rounded-3xl animate-pulse" />
          </div>
        ) : (
          <div>
            {/* Dashboard Tab Panel */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                
                {/* Intro Heading */}
                <div>
                  <h1 className="font-display text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white">
                    Hello, {user?.name.split(' ')[0]} 👋
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Book new slots instantly with AI or view your scheduled appointments below.
                  </p>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Bookings</span>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{upcomingApps.length}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Next appointment tomorrow</p>
                  </div>
                  
                  <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Past Visits</span>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
                      {appointments.filter(a => a.status === 'COMPLETED').length}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">History is kept up to date</p>
                  </div>

                  <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Waitlist Queue</span>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
                      {waitlists.filter(w => w.status === 'WAITING').length}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Active queue promotions</p>
                  </div>
                </div>

                {/* AI Natural Language Booking Command Bar */}
                <div className="p-6 md:p-8 rounded-3xl bg-[#12111a] border border-blue-500/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[40px]" />
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                    <h3 className="font-display font-bold text-lg text-white">SmartBook AI Prompt Engine</h3>
                  </div>

                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    Type your request in plain English. Our engine extracts the service, preferred day, timing window, and preferred employee, suggesting matching slots instantly.
                  </p>

                  <form onSubmit={handleAIPromptSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. I need a dental checkup next Monday morning with Sarah"
                      className="flex-1 bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-sm placeholder-slate-500 py-3.5 px-4 rounded-xl transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={aiLoading}
                      className="py-3.5 px-6 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {aiLoading ? 'AI Thinking...' : 'Search Slots'}
                    </button>
                  </form>

                  {/* AI Results Suggestions */}
                  <AnimatePresence>
                    {(aiLoading || aiSuggestions.length > 0 || aiFeedback) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-8 border-t border-white/5 pt-6"
                      >
                        {aiLoading && (
                          <div className="flex flex-col items-center py-6 text-slate-400 gap-3">
                            <div className="h-10 w-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                            <span className="text-xs">Analyzing NLP tokens & scanning schedules...</span>
                          </div>
                        )}

                        {aiFeedback && (
                          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                            {aiFeedback}
                          </div>
                        )}

                        {aiSuggestions.length > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Matched Slots Found</span>
                              {aiServiceMatch && (
                                <span className="text-xs text-blue-400 font-medium">Service identified: {aiServiceMatch.name}</span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {aiSuggestions.map((slot, idx) => (
                                <div 
                                  key={idx}
                                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/50 transition-all flex justify-between items-center"
                                >
                                  <div>
                                    <h4 className="font-semibold text-white text-sm">{slot.employeeName}</h4>
                                    <span className="text-xs text-slate-400">{new Date(slot.startTime).toLocaleDateString()}</span>
                                    <div className="text-xs text-blue-400 font-bold mt-1">
                                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-white block">₹{slot.price}</span>
                                    <button 
                                      onClick={() => handleBookSuggestedSlot(slot)}
                                      className="mt-2 py-1 px-3 bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold rounded-lg shadow"
                                    >
                                      Book
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Upcoming Appointments List */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Upcoming Appointments</h3>
                  
                  {upcomingApps.length === 0 ? (
                    <div className="p-8 text-center rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 text-slate-400 shadow-premium">
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm">You have no upcoming appointments scheduled.</p>
                      <button 
                        onClick={() => setActiveTab('booking')}
                        className="mt-4 text-sm font-semibold text-blue-500 hover:underline"
                      >
                        Book one now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {upcomingApps.map((app) => (
                        <div 
                          key={app.id} 
                          className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                                {app.service.category}
                              </span>
                              <span className="text-sm font-bold dark:text-white">₹{app.service.price}</span>
                            </div>

                            <h4 className="font-display font-bold text-slate-800 dark:text-white">{app.service.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Staff: {app.employee.user.name}</p>

                            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span>{new Date(app.startTime).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2 justify-end">
                            <button 
                              onClick={() => handleCancelAppointment(app.id)}
                              className="px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                            
                            {app.paymentStatus === 'PENDING' ? (
                              <button 
                                onClick={() => triggerPaymentFlow(app)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400 text-xs font-bold rounded-xl transition-all"
                              >
                                Pay Now (Razorpay)
                              </button>
                            ) : (
                              <button 
                                onClick={() => viewInvoiceReceipt(app.id)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                              >
                                <FileText className="h-3.5 w-3.5" /> Invoice
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Book Appointment Tab Panel */}
            {activeTab === 'booking' && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">Manual Booking</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Select your desired service, date, and preferred staff member.</p>
                </div>

                {bookingError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {bookingError}
                  </div>
                )}

                <form onSubmit={handleManualBooking} className="p-8 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium space-y-6">
                  
                  {/* Select Service */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Service</label>
                    <select 
                      value={selectedService}
                      onChange={(e) => {
                        setSelectedService(e.target.value);
                        setSelectedEmployee('');
                      }}
                      className="w-full bg-slate-50 dark:bg-[#12111a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option value="">Choose a Service...</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (₹{s.price} - {s.duration} min)</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Staff (Filtered based on chosen service category) */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Staff Member (Optional)</label>
                    <select 
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      disabled={!selectedService}
                      className="w-full bg-slate-50 dark:bg-[#12111a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none disabled:opacity-55"
                    >
                      {!selectedService ? (
                        <option value="">Please select a service first...</option>
                      ) : (
                        <>
                          <option value="">Any Staff (AI Auto-Allocation)</option>
                          {employees
                            .filter(emp => {
                              const sObj = services.find(s => s.id === selectedService);
                              return sObj && emp.skills.toLowerCase().includes(sObj.category.toLowerCase());
                            })
                            .map(e => (
                              <option key={e.id} value={e.id}>{e.name} (★ {e.rating})</option>
                            ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Preferred Date</label>
                      <input 
                        type="date"
                        required
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#12111a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Available Time Slots</label>
                      {!selectedDate ? (
                        <div className="py-3.5 px-4 text-xs bg-slate-50 dark:bg-white/5 border dark:border-white/10 text-slate-400 rounded-xl italic">
                          Please select a preferred date first...
                        </div>
                      ) : slotsLoading ? (
                        <div className="py-3 px-4 text-xs text-blue-500 font-semibold flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          Checking live schedules...
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-semibold leading-relaxed">
                          No available slots. All slots are fully booked or off-duty.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                          {availableSlots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                                selectedTime === slot 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Booking Notes / Requests</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Add any specific requests..."
                      className="w-full bg-slate-50 dark:bg-[#12111a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-950 font-bold shadow hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors"
                  >
                    Confirm Appointment
                  </button>

                </form>
              </div>
            )}

            {/* History Panel */}
            {activeTab === 'history' && (
              <div className="space-y-8">
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">Appointment History</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Review your past visits and download invoices.</p>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 shadow-premium overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-xs text-slate-400 font-bold uppercase">
                        <th className="pb-4">Service</th>
                        <th className="pb-4">Date & Time</th>
                        <th className="pb-4">Employee</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Payment</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100 dark:divide-white/5">
                      {historyApps.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No past appointments found.
                          </td>
                        </tr>
                      ) : (
                        historyApps.map((app) => (
                          <tr key={app.id} className="text-slate-700 dark:text-slate-300">
                            <td className="py-4 font-semibold text-slate-900 dark:text-white">{app.service.name}</td>
                            <td className="py-4">{new Date(app.startTime).toLocaleString()}</td>
                            <td className="py-4">{app.employee.user.name}</td>
                            <td className="py-4">
                              <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                                app.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                                app.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                                app.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                              }`}>
                                {app.paymentStatus}
                              </span>
                            </td>
                            <td className="py-4 text-right space-x-2">
                              {app.paymentStatus === 'PAID' && (
                                <button 
                                  onClick={() => viewInvoiceReceipt(app.id)}
                                  className="text-xs text-blue-500 font-semibold hover:underline"
                                >
                                  Invoice
                                </button>
                              )}
                              {app.status === 'COMPLETED' && !app.review && (
                                <button 
                                  onClick={() => setReviewAppointment(app)}
                                  className="text-xs text-amber-500 font-semibold hover:underline"
                                >
                                  Leave Review
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-8 max-w-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">Alert Center</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time reminders and booking updates.</p>
                  </div>
                  <button 
                    onClick={markAllNotificationsRead}
                    className="text-xs text-blue-500 hover:underline font-semibold"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center rounded-3xl bg-white dark:bg-linear-card border border-slate-200/50 dark:border-white/5 text-slate-400">
                      You have no notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          n.isRead 
                            ? 'bg-white dark:bg-linear-card border-slate-200/50 dark:border-white/5 opacity-80' 
                            : 'bg-blue-500/5 border-blue-500/20 shadow'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`text-sm font-bold ${n.isRead ? 'text-slate-800 dark:text-white' : 'text-blue-500 dark:text-blue-400'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Profile & Preferences</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your contact information, credentials, and dark mode toggles.</p>
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
                    {profileLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* RAZORPAY SIMULATION POPUP */}
      <AnimatePresence>
        {payingAppointment && (
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
              className="w-full max-w-sm rounded-3xl bg-[#12111a] border border-white/10 p-8 text-center text-white shadow-2xl relative"
            >
              <div className="flex items-center gap-2 mb-6 justify-center">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">Razorpay Secure Checkout</span>
              </div>

              {payLoading ? (
                <div className="py-8 space-y-4">
                  <div className="h-12 w-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                  <h4 className="font-bold text-lg">Simulating Payment...</h4>
                  <p className="text-xs text-slate-400 px-6">Establishing secure handshakes with mock banking nodes. Do not refresh.</p>
                </div>
              ) : (
                <div className="py-6 space-y-6">
                  {paySuccessData ? (
                    <div className="space-y-4">
                      <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h4 className="font-bold text-lg text-white">Payment Successful!</h4>
                      <p className="text-xs text-slate-400">Invoice: {paySuccessData.invoiceNumber}</p>
                      <button 
                        onClick={() => {
                          setPayingAppointment(null);
                          setPaySuccessData(null);
                        }}
                        className="py-2.5 px-6 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg">Pay ₹{payingAppointment.service.price}</h4>
                      <p className="text-xs text-slate-400">Secure gateway simulation for hackathon demo.</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setPayingAppointment(null)}
                          className="flex-1 py-3 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => triggerPaymentFlow(payingAppointment)}
                          className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED INVOICE MODAL */}
      <AnimatePresence>
        {activeInvoice && (
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
              className="w-full max-w-xl rounded-3xl bg-white text-slate-900 p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveInvoice(null)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div id="invoice-printable" className="space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-blue-600">SmartBook AI</h2>
                    <span className="text-xs text-slate-400">Enterprise Appointment Scheduling</span>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-lg">INVOICE</h3>
                    <span className="text-xs text-slate-400">No: {activeInvoice.invoiceNumber}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h4>
                    <p className="font-semibold">{activeInvoice.customer.name}</p>
                    <p>{activeInvoice.customer.email}</p>
                    <p>{activeInvoice.customer.phone || 'No phone attached'}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Details</h4>
                    <p><span className="font-semibold">Date:</span> {new Date(activeInvoice.date).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Status:</span> PAID</p>
                    <p><span className="font-semibold">Provider:</span> {activeInvoice.employee}</p>
                  </div>
                </div>

                {/* Line Items */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500 font-bold">
                      <th className="py-2.5 px-3">Service Item</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-3">
                        <span className="font-bold block">{activeInvoice.service.name}</span>
                        <span className="text-slate-400 mt-1 block">{activeInvoice.service.description}</span>
                      </td>
                      <td className="py-4 px-3 text-right font-bold">₹{activeInvoice.amount}</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-3 text-right font-bold text-slate-500">Total Paid</td>
                      <td className="py-4 px-3 text-right font-extrabold text-blue-600 text-sm">₹{activeInvoice.amount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                <button 
                  onClick={() => window.print()}
                  className="py-2.5 px-4 border rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button 
                  onClick={() => setActiveInvoice(null)}
                  className="py-2.5 px-6 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK & REVIEW POPUP */}
      <AnimatePresence>
        {reviewAppointment && (
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
              className="w-full max-w-sm rounded-3xl bg-[#12111a] border border-white/10 p-8 text-center text-white shadow-2xl relative"
            >
              <button 
                onClick={() => setReviewAppointment(null)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-4 justify-center">
                <Star className="h-5 w-5 text-amber-500" />
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">Share Your Experience</span>
              </div>

              <h4 className="font-bold text-white text-md mb-2">{reviewAppointment.service.name}</h4>
              <p className="text-xs text-slate-400 mb-6">How was your appointment with {reviewAppointment.employee.user.name}?</p>

              <form onSubmit={handleReviewSubmit} className="space-y-4 text-left">
                {/* Rating selection stars */}
                <div className="flex justify-center gap-2.5 mb-4">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button 
                      key={val}
                      type="button"
                      onClick={() => setReviewRating(val)}
                      className="p-1 transition-transform active:scale-95"
                    >
                      <Star className={`h-8 w-8 ${val <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Review Comment</label>
                  <textarea 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    rows={3}
                    placeholder="Write a brief comment about the service..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold shadow-md transition-colors"
                >
                  Submit Review
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
