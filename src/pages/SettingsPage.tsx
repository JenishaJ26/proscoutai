import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { User, Shield, Bell, Database, Save, Activity } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    preferredSport: user?.preferredSport || user?.sport || '',
    bio: user?.bio || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const resp = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (resp.ok) {
        const data = await resp.json();
        setUser(data.user);
        setMessage({ type: 'success', text: 'Neural identity synchronized successfully.' });
      } else {
        setMessage({ type: 'error', text: 'Identity sync failure. Check network console.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Protocol error during profile update.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight uppercase text-text-main">Neural Identity Settings</h1>
        <p className="text-text-dim text-xs font-bold uppercase tracking-widest">Configure your biometric and social metadata within the matrix</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          {[
            { id: 'profile', label: 'Profile Settings', icon: User, active: true },
            { id: 'security', label: 'Security & Auth', icon: Shield, active: false },
            { id: 'notifications', label: 'Neural Alerts', icon: Bell, active: false },
            { id: 'data', label: 'Matrix Control', icon: Database, active: false },
          ].map(item => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                item.active 
                  ? 'bg-accent/10 text-accent border border-accent/20' 
                  : 'text-text-dim hover:bg-surface-alt hover:text-text-main border border-transparent'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-border bg-surface-alt/30">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-full bg-bg border border-border flex items-center justify-center text-accent ring-4 ring-accent/10 relative">
                    <User size={32} />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-accent rounded-full border-4 border-surface flex items-center justify-center text-bg cursor-pointer hover:scale-110 transition-transform">
                       <Activity size={10} />
                    </div>
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-text-main">{user?.displayName}</h2>
                    <p className="text-[10px] font-black uppercase text-text-dim tracking-widest flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${user?.role === 'admin' ? 'bg-red-500' : 'bg-accent'}`} />
                       {user?.role} Network Node
                    </p>
                 </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-dim tracking-tighter">Public Alias</label>
                  <input 
                    type="text" 
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-bold text-text-main outline-none focus:border-accent transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-dim tracking-tighter">Preferred Sport Modality</label>
                  <input 
                    type="text" 
                    value={formData.preferredSport}
                    onChange={e => setFormData({ ...formData, preferredSport: e.target.value })}
                    className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-bold text-text-main outline-none focus:border-accent transition-colors"
                    placeholder="e.g. Football, MMA, Sprinting"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-dim tracking-tighter">Biometric Bio / Background</label>
                <textarea 
                  rows={4}
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-bold text-text-main outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Summarize your athletic history, goals, and specializations..."
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${
                  message.type === 'success' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <Save size={16} />
                  {message.text}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border mt-8">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-accent text-bg px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? 'Syncing...' : 'Synchronize Identity'}
                  <Save size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
