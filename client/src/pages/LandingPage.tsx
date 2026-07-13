import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Sparkles, 
  Users, 
  Clock, 
  Zap, 
  ChevronDown, 
  ShieldCheck, 
  DollarSign, 
  TrendingUp, 
  MessageSquare, 
  Activity,
  ArrowRight,
  Sun,
  Moon,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const { token, user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // AI Interactive Booking Demo States
  const [nlpInput, setNlpInput] = useState("Dental cleaning next Tuesday morning");
  const [parsedService, setParsedService] = useState("Dental Cleaning");
  const [parsedDate, setParsedDate] = useState("Tuesday (Next Week)");
  const [parsedTime, setParsedTime] = useState("Morning (09:00 AM - 12:00 PM)");
  const [parsedStaff, setParsedStaff] = useState("Dr. Sarah");

  useEffect(() => {
    const text = nlpInput.toLowerCase();
    
    // Simple client-side NLP mock
    if (text.includes("teeth") || text.includes("dental") || text.includes("root") || text.includes("cleaning") || text.includes("checkup")) {
      setParsedService("Dental Checkup & Cleaning");
    } else if (text.includes("hair") || text.includes("cut") || text.includes("salon") || text.includes("trim") || text.includes("styling")) {
      setParsedService("Premium Haircut & Styling");
    } else if (text.includes("consult") || text.includes("advice") || text.includes("business") || text.includes("strategy")) {
      setParsedService("Strategic Business Consulting");
    } else {
      setParsedService("General Wellness Session");
    }

    if (text.includes("tuesday")) {
      setParsedDate("Tuesday (Next Week)");
    } else if (text.includes("monday")) {
      setParsedDate("Monday (Next Week)");
    } else if (text.includes("tomorrow")) {
      setParsedDate("Tomorrow (July 14)");
    } else if (text.includes("today")) {
      setParsedDate("Today (July 13)");
    } else {
      setParsedDate("Select Date & Schedule");
    }

    if (text.includes("morning") || text.includes("am")) {
      setParsedTime("Morning (09:00 AM - 12:00 PM)");
    } else if (text.includes("afternoon") || text.includes("pm")) {
      setParsedTime("Afternoon (01:00 PM - 04:00 PM)");
    } else if (text.includes("evening")) {
      setParsedTime("Evening (05:00 PM - 07:00 PM)");
    } else {
      setParsedTime("Next Available Slot");
    }

    if (text.includes("sarah") || text.includes("dr. sarah")) {
      setParsedStaff("Sarah Connor");
    } else if (text.includes("john") || text.includes("doe")) {
      setParsedStaff("John Doe");
    } else {
      setParsedStaff("Best Match Auto-Allocated");
    }
  }, [nlpInput]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-blue-500" />,
      title: "AI Natural Language Booking",
      description: "Customers book in seconds just by typing: 'Need dental cleaning next Tuesday after 5 PM'. Our local NLP parser instantly extracts slot preferences."
    },
    {
      icon: <Users className="h-6 w-6 text-indigo-500" />,
      title: "Smart Staff Workload Allocation",
      description: "Automate task distribution. Assign slots using mathematical ranking based on experience, ratings, and active workload balancing."
    },
    {
      icon: <Activity className="h-6 w-6 text-purple-500" />,
      title: "No-Show Risk Prediction",
      description: "Uses statistal modeling on past cancellations, late arrivals, and lead times to label every booking with Low, Medium, or High no-show probability."
    },
    {
      icon: <Clock className="h-6 w-6 text-emerald-500" />,
      title: "Auto-Promoted Waitlist",
      description: "Fully booked? Allow customers to join the queue. The moment an appointment is cancelled, the waitlist is instantly promoted and notified."
    },
    {
      icon: <Calendar className="h-6 w-6 text-amber-500" />,
      title: "Real-time Drag-and-Drop Calendar",
      description: "Fluid administrative agenda powered by FullCalendar. Drag bookings to reschedule, updating staff limits and conflict checks in real-time."
    },
    {
      icon: <Zap className="h-6 w-6 text-rose-500" />,
      title: "SaaS Omnichannel Notifications",
      description: "Simulates email, SMS, and WhatsApp alerts scheduled 24 hours, 2 hours, and 30 minutes before appointment start times."
    }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: billingPeriod === 'monthly' ? 2900 : 2300,
      description: "Perfect for single operators and independent stylists.",
      features: [
        "Up to 3 Staff Members",
        "AI Natural Language Parsing",
        "Basic No-show Indicators",
        "Auto Email Alerts",
        "Razorpay Payments Hook"
      ]
    },
    {
      name: "Professional",
      price: billingPeriod === 'monthly' ? 7900 : 6300,
      description: "Best for clinics, salons, and consulting agencies.",
      features: [
        "Unlimited Staff Members",
        "Full No-Show Prediction Modeling",
        "FIFO Waitlist Auto-Promotion",
        "Real-time Dashboard Analytics",
        "SMS & WhatsApp Notification Hub",
        "Custom Branding & Invoice PDFs"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: billingPeriod === 'monthly' ? 19900 : 15900,
      description: "Engineered for national multi-location brands.",
      features: [
        "Multi-business Franchising",
        "Custom Fine-tuned LLM Models",
        "Dedicated API Integrations",
        "SLA Support Guarantee",
        "Custom Database Connector"
      ]
    }
  ];

  const faqs = [
    {
      q: "How does the AI Natural Language booking work?",
      a: "Our backend runs a local NLP parsing engine. It tokenizes user inputs to extract dates ('tomorrow', 'next week'), times ('after 5pm', 'morning'), service categories, and employee names. It runs instantly without external dependencies, but dynamically hooks into OpenAI GPT models when a key is provided."
    },
    {
      q: "How does the No-Show Prediction system function?",
      a: "It checks historical user habits (cancellation frequencies, uncompleted past appointments) and fuses them with situational factors (lead booking distance, early/late hour parameters) to compute a concrete probability risk percentage."
    },
    {
      q: "Can I manage multiple staff members with varying working hours?",
      a: "Yes! Every employee has a customizable availability schedule defining their active days and working hours. The system checks these hours alongside existant bookings to filter conflicting slots."
    },
    {
      q: "What payment gateways are supported?",
      a: "The architecture is pre-configured for Razorpay and Stripe checkouts. It handles mock payment requests, checks verification signatures, and issues itemized PDF invoices."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080710] transition-colors duration-300 overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200/50 dark:border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:via-slate-200 dark:to-slate-100">
            SmartBook <span className="text-blue-500 dark:text-blue-400">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          {token && user ? (
            <Link 
              to={user.role === 'ADMIN' ? "/admin" : user.role === 'EMPLOYEE' ? "/employee" : "/customer"} 
              className="btn-premium px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-block text-sm font-semibold hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-3 py-2 text-slate-600 dark:text-slate-300">
                Sign In
              </Link>
              
              <Link to="/register" className="btn-premium px-5 py-2.5 rounded-xl text-sm font-semibold">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8"
        >
          <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI Scheduling
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-slate-900 dark:text-white leading-[1.1] mb-6"
        >
          Intelligent Booking that <span className="text-gradient">Thinks Ahead</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10 font-normal leading-relaxed"
        >
          Ditch traditional calendars. Reduce no-shows with predictive modeling, auto-allocate employees with smart workload calculations, and schedule appointments in seconds using text input.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          {token && user ? (
            <Link 
              to={user.role === 'ADMIN' ? "/admin" : user.role === 'EMPLOYEE' ? "/employee" : "/customer"} 
              className="btn-premium px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-premium px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group">
                Start Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="px-8 py-4 rounded-2xl font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300">
                See Features
              </a>
            </>
          )}
        </motion.div>

        {/* Animated Dashboard Mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-white/10 bg-slate-950 p-3"
        >
          <div className="w-full h-fit bg-[#12111a] rounded-[18px] border border-white/5 p-4 md:p-6 text-left">
            
            {/* Mock Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-500 ml-2 font-medium">SmartBook AI Dashboard</span>
              </div>
              <div className="h-6 w-32 rounded bg-white/5 animate-pulse" />
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs text-slate-400">Monthly Revenue Prediction</span>
                <h4 className="text-xl font-bold text-white mt-1">₹4,82,500</h4>
                <div className="flex items-center gap-1.5 text-xs text-green-400 mt-2 font-medium">
                  <TrendingUp className="h-3.5 w-3.5" /> +14.2% projected increase
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs text-slate-400">Auto-balanced Utilization</span>
                <h4 className="text-xl font-bold text-white mt-1">84.2%</h4>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full w-[84%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs text-slate-400">Pre-empted No-Shows</span>
                <h4 className="text-xl font-bold text-white mt-1">2% <span className="text-xs font-normal text-slate-400">(cancellation rate)</span></h4>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" /> Smart Waitlist Active
                </div>
              </div>
            </div>

            {/* Simulated AI booking prompt mockup */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500/30 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Try Interactive AI Booking Demo</span>
                </div>
                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">Natural Language Parser</span>
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  placeholder="e.g. Need dental checkup next Monday afternoon with Sarah"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Parsed Live Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] font-semibold text-slate-300">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Service</span>
                  <span className="text-white truncate block">{parsedService}</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Date</span>
                  <span className="text-white truncate block">{parsedDate}</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Time Schedule</span>
                  <span className="text-white truncate block">{parsedTime}</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Assigned Staff</span>
                  <span className="text-white truncate block">{parsedStaff}</span>
                </div>
              </div>
            </div>
            
          </div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-slate-200/50 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            Engineered for High-Performance Teams
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            SmartBook AI is engineered with features designed to resolve appointment inefficiencies, optimize labor allocations, and supercharge growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8 }}
              className="p-6 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/60 dark:border-white/5 shadow-premium hover:shadow-premium-hover transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                {feat.icon}
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-3">
                {feat.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust & Statistics Section */}
      <section className="py-16 bg-slate-900 text-white border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-4xl font-extrabold text-blue-400 font-display">98%</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-bold">No-Show Reduction</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-indigo-400 font-display">12,000+</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-bold">Bookings Managed</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-purple-400 font-display">15,000h</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-bold">Hours Optimized</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-emerald-400 font-display">4.9/5</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-bold">Client Satisfaction</p>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Section */}
      <section id="pricing" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-slate-200/50 dark:border-white/5 text-center">
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            Transparent, Value-Focused Pricing
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-8">
            Pick a layout matching your team size. Switch plans or cancel anytime.
          </p>

          {/* Pricing Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <button 
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                billingPeriod === 'monthly' 
                  ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                billingPeriod === 'yearly' 
                  ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch">
          {pricingTiers.map((tier, idx) => (
            <div 
              key={idx}
              className={`relative p-8 rounded-3xl bg-white dark:bg-linear-card border transition-all flex flex-col justify-between ${
                tier.popular 
                  ? 'border-blue-500 dark:border-blue-500 shadow-2xl dark:shadow-blue-500/5 md:scale-[1.03]' 
                  : 'border-slate-200/60 dark:border-white/5 shadow-premium'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-blue-500 text-slate-950 text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">{tier.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{tier.description}</p>
                <div className="flex items-baseline gap-1 text-slate-900 dark:text-white mb-8">
                  <span className="text-3xl font-bold font-display">₹</span>
                  <span className="text-5xl font-extrabold font-display">{tier.price}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">/month</span>
                </div>

                <hr className="border-slate-100 dark:border-white/5 mb-8" />

                <ul className="space-y-4">
                  {tier.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                to="/register" 
                className={`mt-10 w-full py-3.5 rounded-xl font-bold text-center block transition-all ${
                  tier.popular 
                    ? 'bg-blue-500 text-slate-950 hover:bg-blue-400 shadow-lg shadow-blue-500/10' 
                    : 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                Choose {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Hub Section */}
      <section className="py-24 bg-slate-100/50 dark:bg-black/20 border-t border-slate-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 animate-fade-in">
              Empowering High-Growth Businesses
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Hear from dental clinics, salons, and consultancies leveraging SmartBook AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-8 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/60 dark:border-white/5 shadow-premium space-y-6">
              <p className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed">
                "SmartBook AI reduced our clinic's no-show rate from 23% to less than 3% in just one month. The automated waitlist promotion is a game-changer."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center text-xs">
                  AR
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Dr. Amanda Ross</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Director, DentalCare Clinic</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/60 dark:border-white/5 shadow-premium space-y-6">
              <p className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed">
                "Our clients love booking through text. No login hoops, no clicking around. They just type what they need, and the AI parses it instantly."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center text-xs">
                  MV
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Marcus Vance</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Owner, Velvet Salon & Spa</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-linear-card border border-slate-200/60 dark:border-white/5 shadow-premium space-y-6">
              <p className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed">
                "The workload allocation feature has made shift scheduling incredibly fair for our consulting team. Burnout is down, productivity is way up."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 text-purple-500 font-bold flex items-center justify-center text-xs">
                  SM
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Sophia Martinez</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">HR Operations, Vanguard Consulting Group</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 md:px-12 max-w-4xl mx-auto border-t border-slate-200/50 dark:border-white/5">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Answers to common implementation and usage questions.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-linear-card overflow-hidden"
            >
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-5 text-left flex justify-between items-center text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-slate-100 dark:border-white/5"
                  >
                    <div className="p-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 px-6 md:px-12 bg-blue-600 dark:bg-blue-950 text-white text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/30 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Ready to Supercharge Your Bookings?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-10 text-md">
            Join other leading salons, medical specialists, and consultants utilizing SmartBook AI. Get started for free today.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-600 dark:text-slate-950 dark:bg-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-300 transition-colors shadow-lg">
            Create Free Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 text-sm flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-slate-900 dark:text-white">SmartBook AI</span>
        </div>
        <div>
          &copy; {new Date().getFullYear()} SmartBook AI Inc. Developed for Hackathon. All rights reserved.
        </div>
      </footer>

    </div>
  );
};
