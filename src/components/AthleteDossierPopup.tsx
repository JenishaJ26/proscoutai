import React, { useEffect, useState } from 'react';
import { 
  X, 
  User, 
  Activity, 
  TrendingUp, 
  Calendar, 
  Award,
  Video,
  ChevronRight,
  BrainCircuit,
  History,
  Target
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Assessment, User as AthleteType } from '../types';

interface AthleteDossierPopupProps {
  athlete: AthleteType;
  onClose: () => void;
}

export default function AthleteDossierPopup({ athlete, onClose }: AthleteDossierPopupProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const resp = await fetch(`/api/assessments/athlete/${athlete.uid}`);
        if (resp.ok) {
          const data = await resp.json();
          // Sort assessments by timestamp descending
          setAssessments(data.sort((a: Assessment, b: Assessment) => b.timestamp - a.timestamp));
        }
      } catch (err) {
        console.error("Error fetching dossier data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAthleteData();
  }, [athlete.uid]);

  const latestMetrics = assessments[0]?.metrics || { speed: 0, agility: 0, strength: 0, technique: 0, stamina: 0 };
  
  const radarData = Object.entries(latestMetrics).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 100,
  }));

  const progressData = [...assessments].reverse().map(a => ({
    date: new Date(a.timestamp).toLocaleDateString(),
    score: (Object.values(a.metrics) as number[]).reduce((acc, v) => acc + v, 0) / 5,
  }));

  const averageScore = assessments.length > 0 
    ? (assessments.reduce((acc, a) => acc + ((Object.values(a.metrics) as number[]).reduce((s, v) => s + v, 0) / 5), 0) / assessments.length).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-bg/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Section */}
        <div className="p-8 border-b border-border bg-surface-alt/50 relative">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 hover:bg-surface rounded-full transition-colors group"
          >
            <X size={20} className="text-text-dim group-hover:text-text-main" />
          </button>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 rounded-2xl bg-surface border border-border overflow-hidden flex items-center justify-center text-text-dim ring-4 ring-bg/50">
              {athlete.photoURL ? (
                <img src={athlete.photoURL} alt={athlete.displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={40} />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black tracking-tighter text-text-main uppercase">{athlete.displayName}</h2>
                <div className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[9px] font-black uppercase tracking-widest text-accent">Prospect ID: {athlete.uid.slice(-6).toUpperCase()}</div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-text-dim uppercase tracking-wider">
                <span className="flex items-center gap-2"><Activity size={14} className="text-accent" /> {athlete.preferredSport || athlete.sport || 'General'}</span>
                <span className="flex items-center gap-2"><Calendar size={14} /> Joined {new Date(athlete.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-2"><Award size={14} /> Neural Index: {averageScore}%</span>
              </div>
              {athlete.bio && (
                <p className="mt-4 text-sm text-text-dim italic leading-relaxed max-w-2xl font-medium">"{athlete.bio}"</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim">Decrypting Dossier...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Analytics Column */}
              <div className="lg:col-span-8 space-y-8">
                {/* Evolution Timeline */}
                <div className="bg-surface-alt/30 border border-border rounded-2xl p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                    <TrendingUp size={16} className="text-accent" /> Evolution Timeline
                  </h3>
                  <div className="h-64 w-full">
                    {progressData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={progressData}>
                          <defs>
                            <linearGradient id="dossierScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3FB950" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3FB950" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#21262D" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#8B949E' }} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '12px' }}
                            itemStyle={{ color: '#3FB950', fontSize: 11, fontWeight: 700 }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#3FB950" fillOpacity={1} fill="url(#dossierScore)" strokeWidth={4} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">No Telemetry Recorded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-surface-alt/30 border border-border rounded-2xl p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <History size={16} className="text-accent" /> Neural Assessment Log
                  </h3>
                  <div className="space-y-3">
                    {assessments.slice(0, 5).map(a => (
                      <div key={a.id} className="p-4 bg-bg border border-border rounded-xl flex items-center justify-between group hover:border-accent/40 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center font-bold text-accent text-xs">
                            {new Date(a.timestamp).getDate()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-text-main group-hover:text-accent transition-colors">{a.sport}</p>
                              <span className={clsx(
                                "px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-tighter shadow-sm",
                                a.type === 'self' ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" : "bg-accent/10 border border-accent/20 text-accent"
                              )}>
                                {a.type || 'Scout'}
                              </span>
                            </div>
                            <p className="text-[10px] text-text-dim uppercase font-black tracking-widest mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white italic tracking-tighter">{((Object.values(a.metrics) as number[]).reduce((s, v) => s + v, 0) / 5).toFixed(1)}</p>
                          <p className="text-[8px] font-black uppercase text-text-dim tracking-widest">CORE INDEX</p>
                        </div>
                      </div>
                    ))}
                    {assessments.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Historical Buffer Null</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* Biometric Signature */}
                <div className="bg-surface-alt/30 border border-border rounded-2xl p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target size={16} className="text-accent" /> Biometric Pulse
                  </h3>
                  <div className="h-56 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#30363D" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E', fontSize: 8, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                        <Radar name="Metrics" dataKey="A" stroke="#3FB950" fill="#3FB950" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(latestMetrics).map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                          <span className="text-text-dim">{key}</span>
                          <span className="text-accent">{value}%</span>
                        </div>
                        <div className="w-full bg-bg h-1 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            className="bg-accent h-full" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-accent">
                    <BrainCircuit size={16} /> Neural Insight
                  </h3>
                  <p className="text-xs font-medium text-text-dim leading-relaxed italic">
                    {assessments[0]?.aiInsight || "No active intelligence reports found. Synchronize telemetry parameters to generate predictive performance insights."}
                  </p>
                  {assessments[0]?.videoUrl && (
                    <div className="mt-4 pt-4 border-t border-accent/20">
                      <a 
                        href={assessments[0].videoUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-accent/10 rounded-xl group hover:bg-accent hover:text-bg transition-all"
                      >
                         <div className="flex items-center gap-2">
                            <Video size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Analysis Feed</span>
                         </div>
                         <ChevronRight size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
