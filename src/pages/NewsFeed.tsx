import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Clock, User, ChevronRight, Share2, Bookmark, RefreshCw, Radio } from 'lucide-react';
import { clsx } from 'clsx';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  imageUrl: string;
  link: string;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/news');
      if (resp.ok) {
        const data = await resp.json();
        setNews(data);
        setLastSync(new Date());
      } else {
        throw new Error("Unable to synchronize with intelligence feed");
      }
    } catch (err) {
      console.error("News sync error:", err);
      setError("Neutral link failure. Ensure your matrix connection is stable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-text-main">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
             <h1 className="text-2xl font-bold tracking-tight uppercase">Talent Feed</h1>
          </div>
          <p className="text-text-dim text-sm font-medium uppercase tracking-[0.2em] font-black italic">Neural Intelligence Baseline: Automated Sync</p>
        </div>
        
        <div className="flex items-center gap-4 bg-surface border border-border p-3 rounded-xl">
           <div className="text-right">
              <p className="text-[8px] font-black uppercase text-text-dim mb-0.5 tracking-widest">Last Intelligence Sync</p>
              <p className="text-[10px] font-mono font-bold text-text-main">{lastSync.toLocaleTimeString()}</p>
           </div>
           <button 
             onClick={fetchNews}
             disabled={loading}
             className={clsx(
               "w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent hover:bg-accent/20 transition-all",
               loading && "animate-spin cursor-not-allowed"
             )}
           >
             <RefreshCw size={18} />
           </button>
        </div>
      </div>

      {error ? (
        <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
           <Radio className="mx-auto text-border mb-4 animate-pulse" size={48} />
           <p className="text-xs font-black uppercase tracking-[0.2em] text-text-dim">{error}</p>
           <button 
             onClick={fetchNews}
             className="mt-6 px-6 py-2 bg-accent/10 text-accent border border-accent/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-accent/20"
           >
             Retry Sync
           </button>
        </div>
      ) : loading && news.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {news.map((item, idx) => (
              <motion.div 
                key={item.id + idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-surface rounded-xl border border-border p-6 hover:border-accent/40 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => window.open(item.link, '_blank')}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-accent/10" />
                
                <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                  <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden shrink-0 border border-border bg-surface-alt">
                    <img 
                      src={item.imageUrl} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-60 group-hover:opacity-100" 
                      alt="" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-[8px] font-black uppercase tracking-widest text-accent">
                         {item.category}
                       </span>
                       <span className="text-[10px] font-bold text-text-dim tabular-nums flex items-center gap-1">
                         <Clock size={10} /> {new Date(item.date).toLocaleDateString()}
                       </span>
                    </div>
                    <h3 className="text-base font-bold text-text-main line-clamp-2 leading-tight mb-2 group-hover:text-accent transition-colors tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-text-dim line-clamp-2 leading-relaxed font-medium mb-4">
                      {item.excerpt}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                       <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1">
                         <User size={10} /> {item.author || 'Neural Source'}
                       </span>
                       <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); /* bookmark logic */ }}
                            className="p-1.5 hover:bg-accent/10 rounded-md transition-colors text-text-dim hover:text-accent"
                          >
                             <Bookmark size={14} />
                          </button>
                          <button 
                            className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1 group/btn"
                          >
                            DETAILS <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

