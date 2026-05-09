import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  Plus, 
  Shield,
  LayoutGrid,
  Map as MapIcon,
  Trophy,
  Activity,
  X,
  CreditCard,
  Settings,
  DollarSign,
  IndianRupee,
  Euro,
  JapaneseYen,
  PoundSterling,
  History,
  Info,
  LogOut,
  ChevronRight,
  MoreVertical,
  Search,
  Filter,
  ArrowUpRight,
  Sun,
  Moon,
  Monitor,
  MapPin,
  Navigation,
  LocateFixed,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { cn, formatPercent, formatCurrency } from './lib/utils';
import { Goal, Contribution, Currency, Language } from './types';
import { translations } from './translations';
import { auth, db, loginWithGoogle, logout } from './firebase';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CURRENCY_ICONS: Record<Currency, any> = {
  USD: DollarSign,
  EUR: Euro,
  GBP: PoundSterling,
  INR: IndianRupee,
  JPY: JapaneseYen,
  AUD: DollarSign,
};

// --- Lightning 2.0 Shared Components ---

const SLDSCard = ({ children, className, title, icon: Icon, actions, theme = 'lightning' }: { children: React.ReactNode; className?: string; title?: string; icon?: any; actions?: React.ReactNode; theme?: 'lightning' | 'ascent' }) => (
  <div className={cn(
    theme === 'ascent' ? "ascent-glass overflow-hidden flex flex-col" : "slds-card overflow-hidden flex flex-col",
    className
  )}>
    {(title || Icon || actions) && (
      <div className={cn(
        "px-4 py-3 border-b flex items-center justify-between",
        theme === 'ascent' ? "border-white/10 bg-white/5" : "border-[var(--border-color)] bg-[var(--bg-main)]"
      )}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn(
              "p-1.5 rounded text-white shadow-sm",
              theme === 'ascent' ? "bg-indigo-500 shadow-indigo-500/20" : "bg-[var(--brand-primary)]"
            )}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          {title && <h2 className="text-sm font-bold tracking-tight truncate text-[var(--text-main)]">{title}</h2>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="p-4 md:p-6 flex-1">
      {children}
    </div>
  </div>
);

const SLDSButton = ({ children, onClick, variant = 'neutral', className, icon: Icon, type = 'button', disabled, theme = 'lightning' }: { children: React.ReactNode; onClick?: () => void; variant?: 'brand' | 'neutral' | 'outline' | 'destructive'; className?: string; icon?: any; type?: 'button' | 'submit'; disabled?: boolean; theme?: 'lightning' | 'ascent' }) => {
  const variants = theme === 'ascent' ? {
    brand: "bg-indigo-500 text-white hover:bg-indigo-400 border-indigo-500 shadow-lg shadow-indigo-500/20",
    neutral: "bg-white/5 text-slate-200 hover:bg-white/10 border-white/10",
    outline: "bg-transparent text-slate-200 hover:bg-white/5 border-white/20",
    destructive: "bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/30"
  } : {
    brand: "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-hover)] border-[var(--brand-primary)]",
    neutral: "bg-[var(--card-bg)] text-[var(--brand-primary)] hover:bg-[var(--bg-main)] border-[var(--border-color)]",
    outline: "bg-transparent text-[var(--brand-primary)] hover:bg-[var(--bg-main)] border-[var(--brand-primary)]",
    destructive: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 border rounded font-medium text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children, theme = 'lightning' }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; theme?: 'lightning' | 'ascent' }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#080707]/60 backdrop-blur-sm z-[200]" 
        />
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className={cn(
            "fixed inset-x-0 bottom-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl md:rounded-lg z-[201] shadow-2xl flex flex-col max-h-[90vh]",
            theme === 'ascent' ? "ascent-glass border-white/10" : "bg-[var(--card-bg)] text-[var(--text-main)]"
          )}
        >
          <div className={cn(
            "px-6 py-4 border-b flex justify-between items-center",
            theme === 'ascent' ? "border-white/10 bg-white/5" : "border-[var(--border-color)] bg-[var(--bg-main)]"
          )}>
            <h3 className="text-lg font-bold text-[var(--text-main)]">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded transition-colors group">
              <X className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const MetricStat = ({ label, value, subLabel, icon: Icon, color = "blue", theme = 'lightning' }: { label: string; value: string | number; subLabel?: string; icon: any; color?: string; theme?: 'lightning' | 'ascent' }) => (
  <div className={cn(
    "flex items-start gap-4 p-4 border-none bg-transparent transition-colors",
    theme === 'ascent' ? "hover:bg-white/5" : "hover:bg-[var(--bg-main)]/50"
  )}>
    <div className={cn(
      "p-2 rounded border transition-colors",
      theme === 'ascent' 
        ? "bg-white/5 text-white border-white/10" 
        : "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/20"
    )}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{label}</span>
      <span className="text-xl font-bold text-[var(--text-main)] leading-none">{value}</span>
      {subLabel && <span className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">{subLabel}</span>}
    </div>
  </div>
);

const CircularProgress = ({ progress, label, theme = 'lightning' }: { progress: number; label: string; theme?: 'lightning' | 'ascent' }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] transform -rotate-90">
        <circle cx="50%" cy="50%" r={radius} stroke={theme === 'ascent' ? "rgba(255,255,255,0.1)" : "var(--border-color)"} strokeWidth="10" fill="transparent" />
        <motion.circle 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          cx="50%" cy="50%" r={radius} stroke="var(--brand-primary)" strokeWidth="10" strokeDasharray={circumference} strokeLinecap="round" fill="transparent" 
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl md:text-5xl font-bold text-[var(--text-main)]">{(progress * 100).toFixed(0)}%</span>
        <span className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest mt-1">{label}</span>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const [currentTab, setCurrentTab] = useState<'Map' | 'Metrics' | 'Strategy' | 'Summit'>('Map');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [isGoalsLoading, setIsGoalsLoading] = useState(true);
  const goal = useMemo(() => goals.find(g => g.id === activeGoalId) || goals[0] || null, [goals, activeGoalId]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [logAmount, setLogAmount] = useState('0');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  const [theme, setTheme] = useState<'lightning' | 'ascent'>('lightning');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'error'>('pending');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [coordData, setCoordData] = useState<{ latitude: number; longitude: number; accuracy: number; timestamp: number } | null>(null);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus('error');
      return;
    }

    setIsRequestingLocation(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000 // Allow some cached data for faster initial response
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoordData({ latitude, longitude, accuracy, timestamp: position.timestamp });
        setLocationStatus('granted');
        setIsRequestingLocation(false);
        
        // Start watching for updates
        navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            setCoordData({ latitude, longitude, accuracy, timestamp: pos.timestamp });
          },
          (err) => console.error("Watch error:", err),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      },
      (error) => {
        console.error("Location access error:", error);
        // Only set to denied if it's not the initial auto-request or if it's a hard denial
        setLocationStatus('denied');
        setIsRequestingLocation(false);
      },
      options
    );
  };

  // 1. Establish Geolocation Watcher
  useEffect(() => {
    // Attempt auto-request on mount
    requestLocation();
  }, []);

  // 2. Synchronize Identity and Coordinates to Firestore
  useEffect(() => {
    if (!user) return;

    const userDocPath = `users/${user.uid}`;
    const syncData: any = {
      email: user.email,
      displayName: user.displayName,
      updatedAt: serverTimestamp()
    };

    // Merge coordinates if available
    if (coordData && locationStatus === 'granted') {
      syncData.location = coordData;
    }

    setDoc(doc(db, userDocPath), syncData, { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, userDocPath));

  }, [user, coordData, locationStatus]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-color-mode', colorMode);
  }, [theme, colorMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setIsGoalsLoading(false);
      return;
    }
    const goalsPath = `users/${user.uid}/goals`;
    const qGoals = query(collection(db, goalsPath), orderBy('createdAt', 'desc'));
    const unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
      const goalsData: Goal[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      setGoals(goalsData);
      if (goalsData.length > 0 && !activeGoalId) setActiveGoalId(goalsData[0].id);
      setIsGoalsLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, goalsPath));

    const userDocPath = `users/${user.uid}`;
    const unsubscribeUser = onSnapshot(doc(db, userDocPath), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.currency) setCurrency(data.currency as Currency);
        if (data.language) setLanguage(data.language as Language);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, userDocPath));
    return () => { unsubscribeGoals(); unsubscribeUser(); };
  }, [user]);

  const [activeContributions, setActiveContributions] = useState<Contribution[]>([]);
  useEffect(() => {
    if (!user || !activeGoalId) {
      setActiveContributions([]);
      return;
    }
    const contributionsPath = `users/${user.uid}/goals/${activeGoalId}/contributions`;
    const q = query(collection(db, contributionsPath), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveContributions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contribution)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, contributionsPath));
    return unsubscribe;
  }, [user, activeGoalId]);

  const metrics = useMemo(() => {
    if (!goal) return { percentComplete: 0, totalContributed: 0, remainingAmount: 0, estimatedCompletionDate: 'N/A', velocity: 0, consistencyRate: 0, streakMonths: 0 };
    const total = activeContributions.reduce((acc, c) => acc + c.amount, 0);
    const percent = Math.min(total / goal.targetAmount, 1);
    return {
      percentComplete: percent,
      totalContributed: total,
      remainingAmount: goal.targetAmount - total,
      estimatedCompletionDate: goal.targetDate ? new Date(goal.targetDate).toLocaleDateString(language, { month: 'short', year: 'numeric' }) : 'N/A',
      velocity: 1.12,
      consistencyRate: 0.98,
      streakMonths: activeContributions.length
    };
  }, [goal, activeContributions]);

  const chartData = useMemo(() => {
    if (!goal) return [];
    let runningTotal = 0;
    return activeContributions.map((c, i) => {
      runningTotal += c.amount;
      return { step: i + 1, progress: (runningTotal / goal.targetAmount) * 100, amount: runningTotal };
    });
  }, [goal, activeContributions]);

  const handleLogCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeGoalId) return;
    const amount = parseFloat(logAmount);
    if (isNaN(amount) || amount < 0) return;
    const contributionsPath = `users/${user.uid}/goals/${activeGoalId}/contributions`;
    try {
      await addDoc(collection(db, contributionsPath), { amount, date: logDate, userId: user.uid, goalId: activeGoalId, createdAt: serverTimestamp() });
      setIsLogModalOpen(false);
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, contributionsPath); }
  };

  const handleEditCycle = async (id: string, amount: number) => {
    if (!user || !activeGoalId) return;
    const path = `users/${user.uid}/goals/${activeGoalId}/contributions/${id}`;
    try { await updateDoc(doc(db, path), { amount }); } catch (error) { handleFirestoreError(error, OperationType.UPDATE, path); }
  };

  const handleEditCycleDate = async (id: string, date: string) => {
    if (!user || !activeGoalId) return;
    const path = `users/${user.uid}/goals/${activeGoalId}/contributions/${id}`;
    try { await updateDoc(doc(db, path), { date }); } catch (error) { handleFirestoreError(error, OperationType.UPDATE, path); }
  };

  const handleDeleteCycle = async (id: string) => {
    if (!user || !activeGoalId) return;
    const path = `users/${user.uid}/goals/${activeGoalId}/contributions/${id}`;
    try { await deleteDoc(doc(db, path)); } catch (error) { handleFirestoreError(error, OperationType.DELETE, path); }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const targetAmount = parseFloat(formData.get('target') as string) || 0;
    const monthlyEmi = parseFloat(formData.get('emi') as string) || 0;
    const targetDate = formData.get('targetDate') as string;
    const goalsPath = `users/${user.uid}/goals`;
    try {
      const docRef = await addDoc(collection(db, goalsPath), {
        name: name || 'New Goal', targetAmount, monthlyEmi,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: targetDate || new Date(Date.now() + 315360000000).toISOString().split('T')[0],
        userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      setActiveGoalId(docRef.id);
      setIsAddGoalModalOpen(false);
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, goalsPath); }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeGoalId) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const targetAmount = parseFloat(formData.get('target') as string);
    const monthlyEmi = parseFloat(formData.get('emi') as string);
    const targetDate = formData.get('targetDate') as string;
    const path = `users/${user.uid}/goals/${activeGoalId}`;
    try {
      await updateDoc(doc(db, path), {
        name: name || goal?.name,
        targetAmount: isNaN(targetAmount) ? goal?.targetAmount : targetAmount,
        monthlyEmi: isNaN(monthlyEmi) ? goal?.monthlyEmi : monthlyEmi,
        targetDate: targetDate || goal?.targetDate,
        updatedAt: serverTimestamp()
      });
      setIsSettingsModalOpen(false);
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, path); }
  };

  const updateProfileSettings = async (cur: Currency, lang: Language) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try { 
      await updateDoc(doc(db, path), { currency: cur, language: lang, updatedAt: serverTimestamp() }); 
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (isAuthLoading || (user && locationStatus === 'pending' && !isRequestingLocation)) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6 text-center transition-colors", theme === 'ascent' ? "bg-[#020617]" : "bg-[var(--bg-main)]")}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} 
          className="w-12 h-12 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full mb-4" 
        />
        <p className="absolute mt-20 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] animate-pulse">Initializing Protocol</p>
      </div>
    );
  }

  if (user && (locationStatus === 'denied' || locationStatus === 'error' || (locationStatus === 'pending' && isRequestingLocation))) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors", theme === 'ascent' ? "bg-[#020617]" : "bg-[var(--bg-main)]")}>
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 shadow-lg shadow-red-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-[var(--text-main)] mb-2">Protocol Access Restricted</h1>
        <p className="text-[var(--text-muted)] max-w-xs text-sm mb-8 leading-relaxed">
          Mission initialization requires mandatory environment verification. Please enable location access in your browser settings and tap below to proceed.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <SLDSButton 
            theme={theme} 
            variant="brand" 
            onClick={requestLocation} 
            disabled={isRequestingLocation}
            className="h-12 text-base shadow-xl"
          >
            {isRequestingLocation ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Verifying...
              </span>
            ) : "Initialize Verification"}
          </SLDSButton>
          {locationStatus === 'denied' && (
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-2 animate-pulse">
              Access Refused. Check Device Settings.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6">
        <SLDSCard className="max-w-md w-full p-10 text-center flex flex-col items-center">
          <div className="p-4 bg-[var(--brand-primary)] rounded-xl text-white mb-6 shadow-md"><Shield className="w-10 h-10" /></div>
          <h1 className="text-2xl font-bold mb-2">Ascent Tracker Login</h1>
          <p className="opacity-60 text-sm mb-8 leading-relaxed">Enterprise progression mapping. Secure your trajectory with Lightning performance.</p>
          <SLDSButton variant="brand" onClick={() => loginWithGoogle()} className="w-full py-4 text-base">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white rounded p-0.5" alt="G" />
            Continue with Google
          </SLDSButton>
        </SLDSCard>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-all duration-500",
      theme === 'ascent' ? "theme-ascent bg-[#020617]" : "theme-lightning"
    )}>
      
      {/* Global Header */}
      <header className="h-14 bg-[var(--header-bg)] border-b border-[var(--border-color)] flex items-center justify-between px-3 md:px-6 sticky top-0 z-[100] shadow-sm backdrop-blur-md w-full overflow-x-hidden">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="bg-[var(--brand-primary)] p-1.5 rounded text-white flex-shrink-0 shadow-sm"><Shield className="w-5 h-5" /></div>
          <nav className="flex items-center gap-1 min-w-0">
            <select 
              value={activeGoalId || ''}
              onChange={(e) => e.target.value === 'add_new' ? setIsAddGoalModalOpen(true) : setActiveGoalId(e.target.value)}
              className="bg-transparent text-sm font-bold text-[var(--text-main)] hover:text-[var(--brand-primary)] cursor-pointer focus:outline-none max-w-[140px] truncate pr-4"
            >
              {goals.map(g => <option key={g.id} value={g.id} className="bg-[var(--card-bg)]">{g.name}</option>)}
              <option value="add_new" className="bg-[var(--card-bg)] font-bold">+ New Mission</option>
            </select>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setColorMode(prev => prev === 'light' ? 'dark' : 'light')}
            className="p-2 hover:bg-[var(--bg-main)] rounded-full transition-all text-[var(--text-main)] opacity-70"
          >
            {colorMode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>
          <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 hover:bg-[var(--bg-main)] rounded text-[var(--text-main)] opacity-70 transition-colors"><Settings className="w-5 h-5" /></button>
          <button onClick={() => logout()} className="p-2 hover:bg-red-500/10 rounded text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden pb-24">
        {goals.length === 0 && !isGoalsLoading ? (
          <SLDSCard theme={theme} className="max-w-2xl mx-auto text-center p-12">
            <Target className="w-16 h-16 text-[var(--border-color)] mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-[var(--text-main)] mb-3">No Active Missions</h2>
            <p className="text-[var(--text-muted)] mb-10 max-w-sm mx-auto">Define your first progression strategy to begin mapping your ascent toward the target summit.</p>
            <SLDSButton theme={theme} variant="brand" onClick={() => setIsAddGoalModalOpen(true)} className="px-8 py-3 text-base">Initialize Strategy</SLDSButton>
          </SLDSCard>
        ) : (
          <AnimatePresence mode="wait">
            {currentTab === 'Map' && (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <SLDSCard theme={theme} title={t.proximityMap} icon={Activity} className="lg:col-span-8 flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px]">
                  <CircularProgress theme={theme} progress={metrics.percentComplete} label={t.proximityMap} />
          <div className={cn("w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 pt-6 md:pt-8 border-t", theme === 'ascent' ? "border-white/10" : "border-[var(--border-color)]")}>
                    <MetricStat theme={theme} label={t.momentum} value={`+${Math.round(metrics.velocity * 100)}%`} icon={Zap} color="green" />
                    <MetricStat theme={theme} label={t.arrival} value={metrics.estimatedCompletionDate} icon={Calendar} color="blue" />
                    <MetricStat theme={theme} label={t.pattern} value="Consistent" icon={TrendingUp} color="indigo" />
                  </div>
                </SLDSCard>
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <SLDSCard theme={theme} title={t.milestones} icon={Trophy}>
                    <div className="space-y-6">
                      {[
                        { label: t.foundation, sub: 'Initial climb sequence', progress: 0.1, icon: CheckCircle2 },
                        { label: t.scaling, sub: 'Active ascent phase', progress: 0.5, icon: Zap },
                        { label: t.arrival, sub: 'Summit destination', progress: 0.9, icon: Trophy }
                      ].map((m, i) => (
                        <div key={i} className={cn("flex items-center gap-4 transition-opacity", metrics.percentComplete < m.progress && "opacity-40")}>
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border transition-all", 
                            metrics.percentComplete >= m.progress 
                              ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]" 
                              : "bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)]"
                          )}>
                            <m.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--text-main)]">{m.label}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">{metrics.percentComplete >= m.progress ? 'Achieved' : 'Locked'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SLDSCard>
                  <div className={cn("bg-[var(--brand-primary)] rounded-lg p-6 text-white shadow-lg overflow-hidden relative", theme === 'ascent' && "shadow-indigo-500/20")}>
                    <div className="absolute top-0 right-0 p-4 opacity-20"><ArrowUpRight className="w-20 h-20" /></div>
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Arrival Horizon</span>
                      <h4 className="text-3xl font-bold mt-2">{metrics.estimatedCompletionDate}</h4>
                      <p className="text-sm mt-4 opacity-80 font-medium">Summitting {goal?.name}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentTab === 'Metrics' && (
              <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <SLDSCard theme={theme} className="!p-0"><MetricStat theme={theme} label="TARGET" value={formatCurrency(goal?.targetAmount || 0, currency)} icon={Target} color="blue" subLabel="Total Summit Magnitude" /></SLDSCard>
                  <SLDSCard theme={theme} className="!p-0"><MetricStat theme={theme} label="PROXIMITY" value={formatPercent(metrics.percentComplete)} icon={TrendingUp} color="green" subLabel="Current Track Distance" /></SLDSCard>
                  <SLDSCard theme={theme} className="!p-0"><MetricStat theme={theme} label="FORCE" value={formatCurrency(metrics.totalContributed, currency)} icon={Zap} color="orange" subLabel="Aggregate Progress" /></SLDSCard>
                  <SLDSCard theme={theme} className="!p-0"><MetricStat theme={theme} label="HORIZON" value={goal?.targetDate ? new Date(goal.targetDate).toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} icon={Calendar} color="indigo" subLabel="Arrival Estimate" /></SLDSCard>
                </div>
                <SLDSCard theme={theme} title="Progression Trajectory" icon={TrendingUp} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                      <XAxis dataKey="step" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card-bg)', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: 'var(--text-main)'
                        }} 
                        itemStyle={{ color: 'var(--brand-primary)' }}
                      />
                      <Area type="monotone" dataKey="progress" stroke="var(--brand-primary)" strokeWidth={3} fill="var(--brand-primary)" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </SLDSCard>
              </motion.div>
            )}

            {currentTab === 'Strategy' && (
              <motion.div key="strategy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                      <History className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--text-main)] truncate">Mission Log</h2>
                  </div>
                  <SLDSButton theme={theme} icon={Plus} variant="neutral" onClick={() => setIsLogModalOpen(true)} className="text-xs py-1.5 px-3 shrink-0">Manual Entry</SLDSButton>
                </div>

                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className={cn("hidden md:block border rounded-lg overflow-hidden", theme === 'ascent' ? "border-white/10" : "border-[var(--border-color)]")}>
                    <table className="w-full text-sm text-left">
                      <thead className={cn("font-bold uppercase text-[10px] tracking-wider", theme === 'ascent' ? "bg-white/10 text-slate-400" : "bg-[var(--bg-main)] text-[var(--text-muted)]")}>
                        <tr>
                          <th className="px-6 py-4">Cycle Date</th>
                          <th className="px-6 py-4 text-right">Commit Amount</th>
                          <th className="px-6 py-4 text-right w-16"></th>
                        </tr>
                      </thead>
                      <tbody className={cn("divide-y", theme === 'ascent' ? "divide-white/10" : "divide-[var(--border-color)]")}>
                        {[...activeContributions].reverse().map(c => (
                          <tr key={c.id} className={cn("transition-colors group", theme === 'ascent' ? "hover:bg-white/5" : "hover:bg-[var(--bg-main)]/30")}>
                            <td className="px-6 py-4">
                              <input type="date" value={c.date} onChange={(e) => handleEditCycleDate(c.id, e.target.value)} className="bg-transparent border-none p-0 font-medium focus:ring-0 cursor-pointer" />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <input type="number" value={c.amount} onChange={(e) => handleEditCycle(c.id, parseFloat(e.target.value) || 0)} className="bg-transparent border-none p-0 text-[var(--brand-primary)] font-bold text-right focus:outline-none w-24" />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => setDeleteConfirmationId(c.id)} className="p-2 opacity-40 hover:opacity-100 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {[...activeContributions].reverse().map(c => (
                      <div key={c.id} className={cn(
                        "p-4 rounded-xl border flex items-center justify-between group",
                        theme === 'ascent' ? "bg-white/5 border-white/10" : "bg-[var(--card-bg)] border-[var(--border-color)]"
                      )}>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Cycle Date</span>
                          <input 
                            type="date" 
                            value={c.date} 
                            onChange={(e) => handleEditCycleDate(c.id, e.target.value)} 
                            className="bg-transparent border-none p-0 font-bold text-[var(--text-main)] focus:ring-0 cursor-pointer text-sm" 
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest text-right">Commit</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-[var(--brand-primary)] opacity-50">{React.createElement(CURRENCY_ICONS[currency] || DollarSign, { className: "w-3 h-3" })}</span>
                              <input 
                                type="number" 
                                value={c.amount} 
                                onChange={(e) => handleEditCycle(c.id, parseFloat(e.target.value) || 0)} 
                                className="bg-transparent border-none p-0 text-[var(--brand-primary)] font-bold text-right focus:outline-none w-16 text-sm" 
                              />
                            </div>
                          </div>
                          <button 
                            onClick={() => setDeleteConfirmationId(c.id)} 
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 active:scale-90 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {activeContributions.length === 0 && (
                      <div className="py-20 text-center opacity-40">
                        <History className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-sm font-medium">No cycles logged yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentTab === 'Summit' && (
              <motion.div key="summit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-main)]">The Summit Vault</h2>
                </div>
                <SLDSCard theme={theme} className="flex flex-col items-center justify-center p-8 md:p-20 text-center min-h-[450px]">
                  <div className="relative mb-10">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-[var(--brand-primary)]/10 rounded-full flex items-center justify-center text-[var(--brand-primary)] shadow-inner">
                      <Trophy className="w-12 h-12 md:w-16 md:h-16 stroke-[1.5px]" />
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
                      className="absolute -top-1 -right-1 bg-amber-500 text-white p-2 rounded-full shadow-lg border-2 border-[var(--card-bg)]"
                    >
                      <Shield className="w-4 h-4 md:w-5 md:h-5" />
                    </motion.div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black mb-4 text-[var(--text-main)] tracking-tight italic uppercase">Access Restricted</h2>
                  <p className="text-[var(--text-muted)] max-w-sm mb-12 leading-relaxed text-sm md:text-base font-medium">
                    This restricted high-security module unlocks only upon achieving 100% mission parity for <span className="text-[var(--text-main)] font-bold">{goal?.name || 'your objective'}</span>. Complete your strategy to decrypt the vault.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto mt-4">
                    <SLDSButton theme={theme} disabled className="w-full md:w-auto opacity-50 grayscale cursor-not-allowed">Generate Summit Report</SLDSButton>
                    <SLDSButton theme={theme} variant="neutral" onClick={() => setCurrentTab('Metrics')} className="w-full md:w-auto border-dashed">View Progress Map</SLDSButton>
                  </div>
                </SLDSCard>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Persistent Bottom Navigation (Instagram Style) */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--header-bg)] border-t border-[var(--border-color)] px-4 flex items-center justify-around z-[110] backdrop-blur-lg safe-area-bottom">
        {[
          { id: 'Map', label: t.map, icon: LayoutGrid },
          { id: 'Metrics', label: t.metrics, icon: Activity },
          { id: 'Strategy', label: t.strategy, icon: MapIcon },
          { id: 'Summit', label: t.summit, icon: Trophy }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as any)}
            className="flex flex-col items-center justify-center gap-1.5 transition-all text-[var(--text-main)] relative min-w-[64px]"
          >
            <div className={cn(
              "p-2 rounded-full transition-all",
              currentTab === tab.id ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] scale-110" : "text-[var(--text-muted)]"
            )}>
              <tab.icon className={cn("w-6 h-6", currentTab === tab.id ? "stroke-[2.5px]" : "stroke-[2px]")} />
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider transition-all",
              currentTab === tab.id ? "text-[var(--brand-primary)] opacity-100" : "text-[var(--text-muted)] opacity-70"
            )}>
              {tab.label}
            </span>
            {currentTab === tab.id && (
              <motion.div 
                layoutId="navIndicator" 
                className="absolute -top-[1.5px] w-8 h-[3px] bg-[var(--brand-primary)] rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}

        {/* Global Fab integrated for Log Cycle on Strategy or Metrics */}
        <button 
          onClick={() => { setLogAmount(goal?.monthlyEmi.toString() || '0'); setLogDate(new Date().toISOString().split('T')[0]); setIsLogModalOpen(true); }}
          disabled={goals.length === 0}
          className="fixed bottom-24 right-4 w-14 h-14 bg-[var(--brand-primary)] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-all z-[120] disabled:opacity-50 disabled:grayscale"
        >
          <Plus className="w-7 h-7" />
        </button>
      </nav>

      {/* Modals */}
      <Modal theme={theme} isOpen={isAddGoalModalOpen} onClose={() => setIsAddGoalModalOpen(false)} title="Initialize New Mission">
        <form onSubmit={handleAddGoal} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mission Objective</label>
              <input name="name" placeholder="Target Name" required autoFocus className="slds-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Summit Magnitude</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-sm">
                    {React.createElement(CURRENCY_ICONS[currency] || DollarSign, { className: "w-4 h-4" })}
                  </span>
                  <input name="target" type="number" placeholder="0" required className="slds-input w-full !pl-12" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Target Date</label>
                <input name="targetDate" type="date" required className="slds-input" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cycle Frequency Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-sm">
                  {React.createElement(CURRENCY_ICONS[currency] || DollarSign, { className: "w-4 h-4" })}
                </span>
                <input name="emi" type="number" placeholder="0" className="slds-input w-full !pl-12" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <SLDSButton theme={theme} onClick={() => setIsAddGoalModalOpen(false)}>Cancel</SLDSButton>
            <SLDSButton theme={theme} type="submit" variant="brand">Initialize Strategy</SLDSButton>
          </div>
        </form>
      </Modal>

      <Modal theme={theme} isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log Advance Cycle">
        <form onSubmit={handleLogCycle} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cycle Commit Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60 text-sm">
                  {React.createElement(CURRENCY_ICONS[currency] || DollarSign, { className: "w-4 h-4" })}
                </span>
                <input autoFocus type="number" value={logAmount} onChange={(e) => setLogAmount(e.target.value)} className="slds-input w-full !pl-12 font-bold text-lg" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Effective Cycle Date</label>
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="slds-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <SLDSButton theme={theme} onClick={() => setIsLogModalOpen(false)}>Cancel</SLDSButton>
            <SLDSButton theme={theme} type="submit" variant="brand">Commit Advance</SLDSButton>
          </div>
        </form>
      </Modal>

      <Modal theme={theme} isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Mission Strategy Settings">
        <form onSubmit={handleUpdateGoal} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mission Objective</label>
              <input name="name" defaultValue={goal?.name} className="slds-input font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Summit Magnitude</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-sm">
                    {React.createElement(CURRENCY_ICONS[currency] || DollarSign, { className: "w-4 h-4" })}
                  </span>
                  <input name="target" type="number" defaultValue={goal?.targetAmount} className="slds-input w-full !pl-12" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Target Date</label>
                <input name="targetDate" type="date" defaultValue={goal?.targetDate} className="slds-input" />
              </div>
            </div>
            <div className="pt-6 border-t border-[var(--border-color)] grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">System Language</label>
                <select value={language} onChange={(e) => { const l = e.target.value as Language; setLanguage(l); updateProfileSettings(currency, l); }} className="slds-input text-sm">
                  {['en', 'es', 'hi', 'jp', 'de'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Global Currency</label>
                <select value={currency} onChange={(e) => { const c = e.target.value as Currency; setCurrency(c); updateProfileSettings(c, language); }} className="slds-input text-sm">
                  {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <SLDSButton theme={theme} onClick={() => setIsSettingsModalOpen(false)}>Cancel</SLDSButton>
            <SLDSButton theme={theme} type="submit" variant="brand">Update Strategy</SLDSButton>
          </div>
        </form>
      </Modal>

      <Modal theme={theme} isOpen={!!deleteConfirmationId} onClose={() => setDeleteConfirmationId(null)} title="Terminate Cycle Record">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Are you sure you want to permanently delete this cycle record? This action cannot be reversed and will immediately recalculate your proximity mapping and arrival horizon.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <SLDSButton theme={theme} onClick={() => setDeleteConfirmationId(null)}>Abstain</SLDSButton>
            <SLDSButton theme={theme} variant="destructive" onClick={() => { if(deleteConfirmationId) { handleDeleteCycle(deleteConfirmationId); setDeleteConfirmationId(null); } }}>
              Terminate Record
            </SLDSButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
