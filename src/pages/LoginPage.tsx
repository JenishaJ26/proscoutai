import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { Mail, Lock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Interface access denied');
      }

      setUser(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Interface access denied. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 relative overflow-hidden text-text-main font-sans">
      <div className="absolute top-0 -left-40 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-10" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-red-500 rounded-full blur-[120px] opacity-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface rounded-2xl border border-border p-10 z-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <Link to="/" className="text-xl font-black tracking-[0.2em] text-accent italic mb-6 inline-block uppercase">
            ◈ PROSCOUT AI
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Access Portal</h2>
          <p className="text-text-dim mt-2 text-xs font-medium uppercase tracking-widest">Neural Link Authorization Required</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-2">Vector Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium text-xs text-text-main placeholder:text-text-dim"
                placeholder="identity@proscout.ai"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-2">Access Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium text-xs text-text-main placeholder:text-text-dim"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent text-bg rounded-lg py-4 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-30 shadow-lg shadow-accent/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Initialize Uplink <ChevronRight size={16} /></>}
          </button>
        </form>

        <p className="mt-10 text-center text-text-dim text-[10px] font-black uppercase tracking-widest">
          Unauthorized? <Link to="/register" className="text-accent hover:underline">Provision Identity</Link>
        </p>
      </motion.div>
    </div>
  );
}
