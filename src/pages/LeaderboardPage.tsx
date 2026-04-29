import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Search, 
  Filter, 
  User, 
  X, 
  ShieldCheck, 
  Activity, 
  Target,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { RankingEntry, User as AthleteType, Assessment } from '../types';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar 
} from 'recharts';

type RankChange = 'up' | 'down' | 'neutral';

interface AthleteStats {
  metrics: {
    speed: number;
    agility: number;
    strength: number;
    technique: number;
    stamina: number;
  };
  assessments: Assessment[];
}

export default function LeaderboardPage() {
  const [athletes, setAthletes] = useState<(AthleteType & { rankChange: RankChange, score: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteType | null>(null);
  const [athleteStats, setAthleteStats] = useState<AthleteStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const resp = await fetch('/api/users/athletes');
        if (resp.ok) {
          const data = await resp.json();
          // Add mock rank changes and scores for demo
          const enhancedData = data.map((a: AthleteType, i: number) => {
            const seed = a.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const changes: RankChange[] = ['up', 'down', 'neutral'];
            return {
              ...a,
              rankChange: changes[seed % 3],
              score: 85 + (seed % 150) / 10
            };
          });
          setAthletes(enhancedData);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAthletes();
  }, []);

  const fetchAthleteStats = async (athlete: AthleteType) => {
    setLoadingStats(true);
    setSelectedAthlete(athlete);
    try {
      const resp = await fetch(`/api/assessments?athleteId=${athlete.uid}`);
      if (resp.ok) {
        const data = await resp.json();
        const latest = data[0]?.metrics || { speed: 70, agility: 75, strength: 65, technique: 80, stamina: 72 };
        setAthleteStats({
          metrics: latest,
          assessments: data
        });
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const sports = ['ALL', ...new Set(athletes.map(a => a.preferredSport || a.sport).filter(Boolean) as string[])];

  const filteredAthletes = athletes
    .filter(a => {
      const matchesSearch = a.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.preferredSport || a.sport || '').toLowerCase().includes(searchTerm.toLowerCase());
      const athleteSport = (a.preferredSport || a.sport || '').toUpperCase();
      const matchesSport = sportFilter === 'ALL' || athleteSport === sportFilter.toUpperCase();
      return matchesSearch && matchesSport;
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main uppercase">Neural Talent Matrix</h1>
          <p className="text-text-dim text-sm font-medium uppercase tracking-widest text-[10px]">U19 Global Circuit Rank Deployment</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search prospects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface border border-border rounded-lg py-2 pl-10 pr-4 outline-none focus:border-accent transition-all font-medium text-xs text-text-main w-64 uppercase tracking-tighter" 
            />
          </div>
          
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" size={14} />
            <select 
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="appearance-none bg-surface border border-border rounded-lg py-2 pl-10 pr-10 outline-none focus:border-accent transition-all font-black text-[9px] text-text-main uppercase tracking-widest cursor-pointer"
            >
              {sports.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-accent pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-dim font-black uppercase tracking-[0.3em] animate-pulse">Scanning Ranking Grid...</div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-2xl">
          <div className="divide-y divide-border">
            {filteredAthletes.map((player, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={player.uid} 
                onClick={() => fetchAthleteStats(player)}
                className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-6 hover:bg-surface-alt/50 transition-colors group relative cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 flex flex-col items-center">
                    <span className="text-sm font-black text-text-dim group-hover:text-accent transition-colors">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="mt-1">
                      {player.rankChange === 'up' && <ArrowUpRight size={14} className="text-teal-400 animate-bounce" />}
                      {player.rankChange === 'down' && <ArrowDownRight size={14} className="text-red-400 animate-bounce" />}
                      {player.rankChange === 'neutral' && <Minus size={14} className="text-text-dim opacity-50" />}
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border overflow-hidden shrink-0 flex items-center justify-center text-text-dim relative">
                    {player.photoURL ? (
                      <img src={player.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={20} />
                    )}
                    <div className="absolute inset-0 border border-accent/0 group-hover:border-accent/40 rounded-xl transition-all" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <div className="font-bold text-sm text-text-main truncate group-hover:text-accent transition-colors">{player.displayName}</div>
                       <ShieldCheck size={14} className="text-accent/50" />
                    </div>
                    <div className="text-[10px] font-black text-text-dim uppercase tracking-widest mt-0.5">
                      {player.preferredSport || player.sport || 'General Athlete'} • <span className="opacity-60 font-medium text-[8px]">Index: {player.rankChange.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 justify-between md:justify-end ml-12 md:ml-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
                  <div className="text-right">
                    <div className="text-[9px] font-black uppercase text-text-dim mb-1 tracking-widest">Neural Index</div>
                    <div className="text-sm font-mono font-black text-accent">{player.score.toFixed(1)}</div>
                  </div>
                  <div className="px-4 py-2 bg-surface-alt border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-text-dim group-hover:text-accent group-hover:border-accent transition-all">
                    Dossier
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Athlete Dossier Modal */}
      <AnimatePresence>
        {selectedAthlete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAthlete(null)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            />
            <motion.div
              layoutId={`modal-${selectedAthlete.uid}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="p-8 pb-0 flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl border-2 border-accent bg-surface-alt p-1">
                    {selectedAthlete.photoURL ? (
                      <img src={selectedAthlete.photoURL} className="w-full h-full object-cover rounded-xl" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-dim"><User size={32} /></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter">{selectedAthlete.displayName}</h2>
                      <div className="px-2 py-0.5 bg-accent/20 border border-accent/30 rounded text-[10px] font-black uppercase text-accent tracking-tighter">Verified Prospect</div>
                    </div>
                    <p className="text-xs font-bold text-text-dim uppercase tracking-[0.2em]">{selectedAthlete.preferredSport || 'General Performance'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAthlete(null)}
                  className="p-2 bg-surface-alt hover:bg-bg border border-border rounded-lg text-text-dim hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 pt-6 space-y-8">
                {loadingStats ? (
                  <div className="h-64 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-text-dim animate-pulse">Accessing Neural Archive...</div>
                ) : athleteStats && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-surface-alt p-6 rounded-2xl border border-border">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-6">Biometric Profile</h4>
                        <div className="h-48 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={Object.entries(athleteStats.metrics).map(([key, val]) => ({
                               subject: key.toUpperCase(),
                               A: val,
                               fullMark: 100
                             }))}>
                               <PolarGrid stroke="#30363D" />
                               <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E', fontSize: 8, fontWeight: 900 }} />
                               <Radar name="Scout" dataKey="A" stroke="#3FB950" fill="#3FB950" fillOpacity={0.5} />
                             </RadarChart>
                           </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-text-dim">Telemetry Summary</h4>
                        <div className="grid grid-cols-2 gap-3">
                           {Object.entries(athleteStats.metrics).map(([key, val]) => (
                             <div key={key} className="p-3 bg-surface-alt rounded-xl border border-border">
                               <p className="text-[9px] font-black text-text-dim uppercase mb-1">{key}</p>
                               <div className="flex items-end justify-between">
                                  <span className="text-lg font-mono font-black text-text-main leading-none">{val}</span>
                                  <div className="w-12 h-1 bg-bg rounded-full overflow-hidden">
                                     <div className="bg-accent h-full" style={{ width: `${val}%` }} />
                                  </div>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-text-dim flex items-center gap-2">
                        <Activity size={14} className="text-accent" /> Kinetic Progression Logs
                      </h4>
                      <div className="space-y-2">
                        {athleteStats.assessments.slice(0, 3).map((a, i) => (
                          <div key={a.id} className="p-4 bg-surface-alt border border-border/50 rounded-xl flex items-center justify-between group/item">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-accent font-black text-xs">
                                 {i + 1}
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-text-main uppercase">{a.sport} Assessment</p>
                                  <p className="text-[10px] text-text-dim font-medium">{new Date(a.timestamp).toLocaleDateString()} • AI Scanned</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <p className="text-xs font-mono font-black text-accent">{(Object.values(a.metrics).reduce((s, v) => s + v, 0) / 5).toFixed(1)}</p>
                                  <p className="text-[8px] font-black text-text-dim uppercase group-hover/item:text-accent transition-colors">Aggregate</p>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button className="flex-1 py-4 bg-accent text-bg rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent/10">
                        Initiate Recruitment Protocol
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {filteredAthletes.length === 0 && !loading && (
        <div className="py-20 text-center">
           <Trophy size={48} className="mx-auto text-border mb-4 opacity-20" />
           <p className="text-xs font-black uppercase tracking-[0.2em] text-text-dim">No biometric profiles detected in this quadrant</p>
        </div>
      )}
    </div>
  );
}
