import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Zap, 
  Target, 
  ChevronRight, 
  BarChart3, 
  ShieldCheck,
  Globe
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-bg min-h-screen text-text-main font-sans selection:bg-accent/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-border">
        <div className="text-xl font-extrabold tracking-tighter text-accent flex items-center gap-2">
          <span className="text-2xl">◈</span> PROSCOUT AI
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-colors">Login</Link>
          <Link 
            to="/register" 
            className="bg-accent text-bg px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-accent/20 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="px-8 pt-32 pb-48 max-w-7xl mx-auto relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <Zap size={14} /> Neural Scouting Engine 2.4
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase mb-10 max-w-4xl mx-auto">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-text-main to-text-dim/40">Talent Discovery.</span>
          </h1>
          <p className="text-lg text-text-dim max-w-xl mx-auto mb-14 font-medium leading-relaxed">
            ProScout AI uses real-time biomechanics and performance telemetry to identify the world's next elite prospects before they reach the mainstream.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/register" 
              className="px-10 py-5 bg-accent text-bg rounded-xl text-sm font-black uppercase tracking-wider flex items-center gap-3 hover:translate-y-[-2px] transition-all shadow-xl shadow-accent/10"
            >
              Initialize Assessment <ChevronRight size={18} />
            </Link>
          </div>
        </motion.div>

        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#30363D_1px,transparent_1px),linear-gradient(to_bottom,#30363D_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>
      </header>

      {/* Stats Board */}
      <section className="px-8 py-24 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-4xl font-black text-accent tabular-nums mb-2">1,248</div>
            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Prospects Scanned</div>
          </div>
          <div>
            <div className="text-4xl font-black text-text-main tabular-nums mb-2">94.2%</div>
            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Sync Accuracy</div>
          </div>
          <div>
            <div className="text-4xl font-black text-text-main tabular-nums mb-2">50+</div>
            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Pro Leagues</div>
          </div>
          <div>
            <div className="text-4xl font-black text-accent tabular-nums mb-2">4.2%</div>
            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Conversion Rate</div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-40 px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
             <div className="space-y-4">
               <h2 className="text-4xl font-black tracking-tight uppercase leading-none italic">
                 Western Conference <br /> <span className="text-accent underline underline-offset-8 decoration-4">Analysis.</span>
               </h2>
               <p className="text-text-dim font-medium leading-relaxed max-w-lg">
                 Our scouts are currently focused on U19 prospects in the Pacific region, utilizing 3D motion tracking and AI-driven skill evaluation.
               </p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="p-6 bg-surface border border-border rounded-2xl space-y-4 group hover:border-accent/40 transition-colors">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <Target size={20} />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">Precision Metrics</h3>
                  <p className="text-xs text-text-dim leading-relaxed font-medium">Capture thousands of data points from vertical jump to lateral quickness in real-time.</p>
                </div>
                <div className="p-6 bg-surface border border-border rounded-2xl space-y-4 group hover:border-accent/40 transition-colors">
                  <div className="w-10 h-10 bg-surface-alt rounded-lg flex items-center justify-center text-text-main group-hover:scale-110 transition-transform">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">Trait Analysis</h3>
                  <p className="text-xs text-text-dim leading-relaxed font-medium">Deep learning models identify hidden potential indicators in developing athletes.</p>
                </div>
             </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-accent/20 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative bg-surface border border-border rounded-3xl p-4 overflow-hidden shadow-2xl">
              <img 
                src="https://picsum.photos/seed/technic/1200/800" 
                className="w-full h-full object-cover rounded-2xl opacity-60 mix-blend-screen" 
                alt="Technical Sport Data"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10">
                 <div className="px-3 py-1 bg-accent/20 border border-accent/40 rounded-md text-[9px] font-black uppercase tracking-widest text-accent mb-2">Live Session Active</div>
                 <div className="text-2xl font-black uppercase tracking-tight italic">Prospect ID: Rivera-98</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Pane */}
      <section className="py-32 px-8">
        <div className="max-w-4xl mx-auto bg-surface border border-border rounded-[40px] p-16 text-center relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <h2 className="text-5xl font-black tracking-tighter uppercase mb-6 leading-none">Initialize Your Legacy.</h2>
          <p className="text-text-dim font-medium mb-12 max-w-xl mx-auto">Access the world's most advanced scouting network. Whether you're an athlete seeking professional eyes or an agency building a powerhouse.</p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-3 px-12 py-5 bg-accent text-bg rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20"
          >
            Create Profile <Globe size={16} />
          </Link>
        </div>
      </section>

      <footer className="py-12 px-8 border-t border-border flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto text-[10px] font-bold text-text-dim tracking-widest uppercase">
        <div>© 2026 PROSCOUT AI SYSTEMS. ALL RIGHTS RESERVED.</div>
        <div className="flex gap-8 mt-6 md:mt-0">
          <a href="#" className="hover:text-accent transition-colors">Security</a>
          <a href="#" className="hover:text-accent transition-colors">Privacy</a>
          <a href="#" className="hover:text-accent transition-colors">API Docs</a>
        </div>
      </footer>
    </div>
  );
}
