import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  Plus, 
  ChevronRight,
  Shield,
  LayoutGrid,
  Map,
  Trophy,
  Activity,
  ArrowUpRight
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
import { cn, formatPercent } from './lib/utils';
import { Goal } from './types';

// --- Components ---

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("glass rounded-[2rem] p-8 relative overflow-hidden", className)}>
    {children}
  </div>
);

const MetricCard = ({ title, value, icon: Icon, subValue, trend }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  subValue?: string;
  trend?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass p-6 rounded-3xl relative overflow-hidden group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
          {trend}
        </span>
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</span>
      <span className="text-2xl font-bold text-slate-100">{value}</span>
      {subValue && <span className="text-xs text-slate-400 mt-1 font-medium">{subValue}</span>}
    </div>
  </motion.div>
);

const CircularProgress = ({ progress }: { progress: number }) => {
  const radius = 180;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-[320px] h-[320px] md:w-[400px] md:h-[400px] transform -rotate-90">
        <circle 
          cx="50%" 
          cy="50%" 
          r={radius} 
          stroke="currentColor" 
          strokeWidth="16" 
          fill="transparent" 
          className="text-slate-800/50" 
        />
        <motion.circle 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: "circOut" }}
          cx="50%" 
          cy="50%" 
          r={radius} 
          stroke="currentColor" 
          strokeWidth="16" 
          strokeDasharray={circumference}
          strokeLinecap="round" 
          fill="transparent" 
          className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-6xl md:text-7xl font-black tracking-tighter text-white"
        >
          {(progress * 100).toFixed(1)}%
        </motion.span>
        <span className="text-indigo-400 uppercase tracking-[0.3em] font-bold text-xs mt-3">Proximity to Goal</span>
      </div>
    </div>
  );
};

export default function App() {
  const [goal] = useState<Goal>({
    id: '1',
    name: 'Coastal Sanctuary',
    targetAmount: 500000,
    monthlyEmi: 5000,
    startDate: '2024-01-01',
    targetDate: '2032-01-01',
    contributions: Array.from({ length: 16 }, (_, i) => ({
      id: String(i),
      amount: 5000 + (Math.random() > 0.7 ? 1000 : 0),
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`
    }))
  });

  const metrics = useMemo(() => {
    const total = goal.contributions.reduce((acc, c) => acc + c.amount, 0);
    const percent = Math.min(total / goal.targetAmount, 1);
    
    return {
      percentComplete: percent,
      totalContributed: total,
      remainingAmount: goal.targetAmount - total,
      estimatedCompletionDate: 'Aug 2026',
      velocity: 1.12,
      consistencyRate: 0.98,
      streakMonths: 16
    };
  }, [goal]);

  const chartData = useMemo(() => {
    let runningTotal = 0;
    return goal.contributions.map((c, i) => {
      runningTotal += c.amount;
      return {
        step: i + 1,
        progress: runningTotal
      };
    });
  }, [goal]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-100px] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        {/* Top Header */}
        <header className="flex justify-between items-center bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{goal.name}</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Goal Strategy: Ascent</p>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <div className="px-4 py-2 glass rounded-full text-xs font-bold uppercase tracking-wider text-slate-400">Architect Tier</div>
            <button className="px-6 py-2 bg-indigo-500 rounded-full text-xs font-bold shadow-lg shadow-indigo-500/40 hover:bg-indigo-400 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log Cycle
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Main Visualizer (Circular Progress) */}
          <GlassCard className="col-span-12 lg:col-span-8 p-12 flex flex-col items-center justify-center min-h-[500px]">
            <div className="absolute top-10 left-10 text-left">
              <h2 className="text-lg font-bold">Proximity Visualization</h2>
              <p className="text-sm text-slate-400 font-medium tracking-tight">Real-time distance to target completion</p>
            </div>

            <div className="py-12">
              <CircularProgress progress={metrics.percentComplete} />
            </div>

            <div className="w-full mt-8 grid grid-cols-3 gap-8 border-t border-white/5 pt-10">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Velocity</p>
                <p className="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                  +{metrics.velocity * 100}% <ArrowUpRight className="w-4 h-4" />
                </p>
              </div>
              <div className="text-center border-x border-white/5 px-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Completion Date</p>
                <p className="text-2xl font-bold">{metrics.estimatedCompletionDate}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Proximity Score</p>
                <p className="text-2xl font-bold text-indigo-300">High</p>
              </div>
            </div>
          </GlassCard>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            
            {/* Achievement Arc */}
            <GlassCard className="flex-1 flex flex-col p-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Achievement Arc</h3>
              <div className="flex-1 space-y-8">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Foundation Stage</p>
                    <p className="text-xs text-slate-500 font-medium">Unlocked 4 months ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 relative">
                    <Zap className="w-6 h-6" />
                    <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Structure Building</p>
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-tighter">Current Milestone</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 opacity-30">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-white/5">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Summit Realization</p>
                    <p className="text-xs text-slate-500 font-medium">Locked until 90% proximity</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-black mb-3">Consistency Streak</p>
                <div className="flex gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-full h-8 rounded-md transition-all duration-500",
                        i < 5 ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-white/10"
                      )} 
                    />
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Estimated Completion Card */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white overflow-hidden relative shadow-2xl shadow-indigo-600/40 transform hover:scale-[1.02] transition-all cursor-default">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
              <div className="relative z-10 space-y-4">
                <Activity className="w-8 h-8 opacity-50" />
                <h4 className="text-2xl font-bold leading-tight">Estimated Completion:<br/><span className="text-indigo-200">August 2026</span></h4>
                <p className="text-sm font-medium text-indigo-100 opacity-80 decoration-indigo-200">You are 14 days ahead of schedule.</p>
              </div>
            </div>
          </div>

          {/* Bottom Metics Grid */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Growth Track" 
              value={`${metrics.streakMonths} Months`} 
              icon={Activity} 
              trend="ACTIVE"
              subValue="Unbroken contribution cycle" 
            />
            <MetricCard 
              title="Metric Consistency" 
              value={formatPercent(metrics.consistencyRate)} 
              icon={Target} 
              subValue="Strategy alignment rating" 
            />
            <MetricCard 
              title="Goal Speed" 
              value="Standard" 
              icon={Zap} 
              subValue="Maintenance pace active" 
            />
            <MetricCard 
              title="Next Action" 
              value="12 Days" 
              icon={Calendar} 
              subValue="Scheduled for May 15" 
            />
          </div>

          {/* Ascension Trend Chart */}
          <GlassCard className="col-span-12 p-10 h-96">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-lg font-bold">Ascension Pattern</h3>
                <p className="text-xs text-slate-400 font-medium">Historical contribution trajectory towards summit</p>
              </div>
              <div className="flex gap-2">
                 <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate View</div>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="step" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="progress" 
                    stroke="#6366f1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorProgress)" 
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Floating Bottom Nav */}
        <footer className="h-16 flex items-center justify-center gap-10 md:gap-16 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 z-10 shrink-0">
          <button className="hover:text-indigo-400 transition-colors flex items-center gap-2">
            <LayoutGrid className="w-3 h-3" />
            <span>Map</span>
          </button>
          <button className="text-indigo-400 border-b-2 border-indigo-500 pb-1 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>Metrics</span>
          </button>
          <button className="hover:text-indigo-400 transition-colors flex items-center gap-2">
            <Map className="w-3 h-3" />
            <span>Strategy</span>
          </button>
          <button className="hover:text-indigo-400 transition-colors flex items-center gap-2">
            <Trophy className="w-3 h-3" />
            <span>Archive</span>
          </button>
        </footer>
      </main>
    </div>
  );
}
