import React from 'react';
import { motion } from 'motion/react';
import { Newspaper, Clock, User, ChevronRight, Share2, Bookmark } from 'lucide-react';

const mockNews = [
  {
    id: '1',
    title: "AI Analysis: The Future of Midfield Dominance",
    excerpt: "New data models suggest that lateral quickness is now 40% more indicative of success than vertical speed in modern football.",
    author: "Dr. Elena Rossi",
    date: "2 hours ago",
    category: "Analytics",
    imageUrl: "https://picsum.photos/seed/sports1/800/600"
  },
  {
    id: '2',
    title: "Scouting Revolution: ProScout AI's Impact on the Draft",
    excerpt: "Major league scouts are increasingly relying on neural network profiles to identify 'unlocked potential' in lower-tier college prospects.",
    author: "Marcus Sterling",
    date: "5 hours ago",
    category: "Industry",
    imageUrl: "https://picsum.photos/seed/sports2/800/600"
  },
  {
    id: '3',
    title: "Top 10 Prospects to Watch in the Upcoming Season",
    excerpt: "From relentless strikers to impenetrable defenders, here are the athletes our AI has flagged as potential breakout stars.",
    author: "Scout Team Alpha",
    date: "Yesterday",
    category: "Talent",
    imageUrl: "https://picsum.photos/seed/sports3/800/600"
  },
  {
    id: '4',
    title: "Understanding Your Performance Metrics",
    excerpt: "A deep dive into the five core metrics used by ProScout AI to calculate your efficiency rating and trajectory.",
    author: "Technical Team",
    date: "1 day ago",
    category: "Guide",
    imageUrl: "https://picsum.photos/seed/sports4/800/600"
  }
];

export default function NewsFeed() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto text-text-main">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Talent Feed</h1>
        <p className="text-text-dim text-sm font-medium">Regional updates and scouting metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockNews.map((news, idx) => (
          <motion.div 
            key={news.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-surface rounded-xl border border-border p-6 hover:border-accent/40 transition-all"
          >
            <div className="flex gap-6">
              <div className="w-32 h-32 rounded-lg overflow-hidden shrink-0 border border-border bg-surface-alt">
                <img src={news.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100" alt="" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                   <span className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-[8px] font-black uppercase tracking-widest text-accent">
                     {news.category}
                   </span>
                   <span className="text-[10px] font-bold text-text-dim tabular-nums">{news.date}</span>
                </div>
                <h3 className="text-base font-bold text-text-main line-clamp-2 leading-tight mb-2 group-hover:text-accent transition-colors tracking-tight">
                  {news.title}
                </h3>
                <p className="text-xs text-text-dim line-clamp-2 leading-relaxed font-medium mb-4">
                  {news.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between">
                   <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{news.author}</span>
                   <button className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1 group/btn">
                     READ <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
