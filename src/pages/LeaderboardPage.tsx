import React, { useEffect, useState } from 'react';
import { Trophy, ArrowUpRight, ArrowDownRight, Minus, Search, Filter, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { RankingEntry, User as AthleteType } from '../types';

export default function LeaderboardPage() {
  const [athletes, setAthletes] = useState<AthleteType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const resp = await fetch('/api/users/athletes');
        if (resp.ok) {
          const data = await resp.json();
          setAthletes(data);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAthletes();
  }, []);

  const sports = ['ALL', ...new Set(athletes.map(a => a.preferredSport || a.sport).filter(Boolean) as string[])];

  const filteredAthletes = athletes
    .filter(a => {
      const matchesSearch = a.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.preferredSport || a.sport || '').toLowerCase().includes(searchTerm.toLowerCase());
      const athleteSport = (a.preferredSport || a.sport || '').toUpperCase();
      const matchesSport = sportFilter === 'ALL' || athleteSport === sportFilter.toUpperCase();
      return matchesSearch && matchesSport;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main uppercase">Neural Talent Matrix</h1>
          <p className="text-text-dim text-sm font-medium uppercase tracking-widest text-[10px]">U19 Global Circuit Rank Deployment</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          
          <div className="flex gap-1 bg-surface border border-border p-1 rounded-lg">
             {sports.map(s => (
               <button
                 key={s}
                 onClick={() => setSportFilter(s)}
                 className={clsx(
                   "px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all",
                   sportFilter === s ? "bg-accent text-bg" : "text-text-dim hover:text-text-main"
                 )}
               >
                 {s}
               </button>
             ))}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={player.uid} 
                className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-6 hover:bg-surface-alt/50 transition-colors group relative"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-8 font-extrabold text-xs text-text-dim group-hover:text-accent transition-colors">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border overflow-hidden shrink-0 flex items-center justify-center text-text-dim">
                    {player.photoURL ? (
                      <img src={player.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <div className="font-bold text-sm text-text-main truncate">{player.displayName}</div>
                       <div className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-[8px] font-black uppercase tracking-tighter text-accent">Active</div>
                    </div>
                    <div className="text-[10px] font-black text-text-dim uppercase tracking-widest mt-0.5">
                      {player.preferredSport || player.sport || 'General Athlete'} • Joined {new Date(player.createdAt).toLocaleDateString()}
                    </div>
                    {player.bio && (
                      <p className="text-[10px] text-text-dim/70 mt-2 italic line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                        "{player.bio}"
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 justify-between md:justify-end ml-12 md:ml-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
                  <div className="text-right">
                    <div className="text-xs font-black uppercase text-text-dim mb-1 tracking-tighter">Current Index</div>
                    <div className="text-sm font-mono font-black text-accent">94.2</div>
                  </div>
                  <div className="text-[10px] font-black text-accent bg-accent/5 border border-accent/10 px-3 py-1.5 rounded-lg uppercase tracking-widest group-hover:bg-accent group-hover:text-bg transition-all cursor-pointer">
                    View Dossier
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredAthletes.length === 0 && (
              <div className="py-20 text-center">
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-text-dim">No athletes found in sector</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
