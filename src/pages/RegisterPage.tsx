import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle, Loader2, Trophy, Search, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'athlete' | 'scout'>('athlete');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, role })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Identity provisioning failure');
      }

      setUser(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Identity provisioning failure. Check neural relay.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 py-20 relative overflow-hidden text-text-main font-sans">
      <div className="absolute top-0 -right-40 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-surface rounded-2xl border border-border p-12 z-10 shadow-2xl"
      >
        <div className="text-center mb-12">
          <Link to="/" className="text-xl font-black tracking-[0.2em] text-accent italic mb-6 inline-block uppercase">
            ◈ PROSCOUT AI
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Provision Identity</h2>
          <p className="text-text-dim mt-2 text-xs font-medium uppercase tracking-widest">Select your operative vector</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setRole('athlete')}
              className={clsx(
                "flex items-center gap-4 p-6 rounded-xl border-2 transition-all text-left bg-bg group relative overflow-hidden",
                role === 'athlete' ? "border-accent" : "border-border hover:border-text-dim"
              )}
            >
              <div className={clsx("w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border", role === 'athlete' ? "bg-accent text-bg border-accent" : "bg-surface-alt border-border text-text-dim")}>
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Athlete</p>
                <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider mt-1 leading-tight">Biometric Telemetry</p>
              </div>
              {role === 'athlete' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />}
            </button>

            <button 
              type="button"
              onClick={() => setRole('scout')}
              className={clsx(
                "flex items-center gap-4 p-6 rounded-xl border-2 transition-all text-left bg-bg group relative overflow-hidden",
                role === 'scout' ? "border-accent" : "border-border hover:border-text-dim"
              )}
            >
              <div className={clsx("w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border", role === 'scout' ? "bg-accent text-bg border-accent" : "bg-surface-alt border-border text-text-dim")}>
                <Search size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Scout</p>
                <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider mt-1 leading-tight">Tactical Analysis</p>
              </div>
              {role === 'scout' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />}
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-2">Display Alias</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                <input 
                  type="text" required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium text-xs text-text-main placeholder:text-text-dim"
                  placeholder="Operative Name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-2">Neural Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                <input 
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium text-xs text-text-main placeholder:text-text-dim"
                  placeholder="vector@proscout.ai"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-2">Matrix Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                <input 
                  type="password" required minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium text-xs text-text-main placeholder:text-text-dim"
                  placeholder="Secure code sequence"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent text-bg rounded-lg py-5 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-30 shadow-lg shadow-accent/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Synchronize Profile <ChevronRight size={18} /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-text-dim text-[10px] font-black uppercase tracking-widest leading-loose">
          Existing Identity? <Link to="/login" className="text-accent underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
