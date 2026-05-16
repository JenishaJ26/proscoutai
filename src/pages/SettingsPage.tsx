import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Bell, Database, Save, Activity, Key, Eye, EyeOff, Terminal, LogOut, CheckCircle2 } from 'lucide-react';

type TabId = 'profile' | 'security' | 'notifications' | 'data';

export default function SettingsPage() {
  const { user, setUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    preferredSport: user?.preferredSport || user?.sport || '',
    bio: user?.bio || ''
  });
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const endpoint = activeTab === 'profile' ? '/api/auth/profile' : '/api/auth/security';
      const body = activeTab === 'profile' ? formData : securityData;

      if (activeTab === 'security' && securityData.newPassword !== securityData.confirmPassword) {
        throw new Error('Neural keys do not match.');
      }

      const resp = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await resp.json();

      if (resp.ok) {
        if (activeTab === 'profile') setUser(data.user);
        setMessage({ type: 'success', text: data.message || 'Neural identity synchronized successfully.' });
        if (activeTab === 'security') setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Identity sync failure.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Protocol error during update.' });
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems: { id: TabId, label: string, icon: any }[] = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'notifications', label: 'Neural Alerts', icon: Bell },
    { id: 'data', label: 'Matrix Control', icon: Database },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight uppercase text-text-main flex items-center gap-3 italic">
          <Terminal className="text-accent" size={24} /> Neural Identity Settings
        </h1>
        <p className="text-text-dim text-xs font-bold uppercase tracking-[0.2em] ml-9">Configure your biometric and social metadata within the matrix</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMessage(null); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest border ${
                activeTab === item.id 
                  ? 'bg-accent/10 text-accent border-accent/20 shadow-lg shadow-accent/5' 
                  : 'text-text-dim hover:bg-surface-alt hover:text-text-main border-transparent'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-border">
            <button 
              onClick={signOut}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-500/10 border border-transparent"
            >
              <LogOut size={16} />
              Terminate Session
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl relative"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -z-10" />

              <div className="p-8 md:p-10 border-b border-border bg-surface-alt/20">
                <div className="flex items-center gap-8">
                   <div className="w-24 h-24 rounded-3xl bg-bg border-2 border-border flex items-center justify-center text-accent ring-8 ring-accent/5 relative group cursor-pointer overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <User size={40} />
                      )}
                      <div className="absolute inset-0 bg-accent/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Activity className="text-bg" size={24} />
                      </div>
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">{user?.displayName}</h2>
                      <p className="text-[10px] font-black uppercase text-text-dim tracking-[0.3em] flex items-center gap-2 mt-1">
                         <span className={`w-2 h-2 rounded-full ${user?.role === 'admin' ? 'bg-red-500 animate-pulse' : 'bg-accent'}`} />
                         {user?.role} Network Entity
                      </p>
                      <div className="mt-4 flex gap-2">
                        <span className="px-2 py-0.5 bg-surface-alt border border-border rounded text-[8px] font-bold text-text-dim uppercase tracking-tighter">UID: {user?.uid?.slice(-8)}</span>
                        <span className="px-2 py-0.5 bg-surface-alt border border-border rounded text-[8px] font-bold text-text-dim uppercase tracking-tighter">Status: Authorized</span>
                      </div>
                   </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10">
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-text-dim tracking-[0.2em] ml-1">Identity Alias</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                          <input 
                            type="text" 
                            value={formData.displayName}
                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                            className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-text-main outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
                            placeholder="Current Alias"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-text-dim tracking-[0.2em] ml-1">Core Discipline</label>
                        <div className="relative group">
                          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                          <input 
                            type="text" 
                            value={formData.preferredSport}
                            onChange={e => setFormData({ ...formData, preferredSport: e.target.value })}
                            className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-text-main outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
                            placeholder="e.g. Football / Sprinting"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-text-dim tracking-[0.2em] ml-1">Biometric dossier (BIO)</label>
                      <textarea 
                        rows={5}
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full bg-bg border border-border rounded-2xl p-5 text-xs font-bold text-text-main outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all resize-none leading-relaxed"
                        placeholder="Summarize your athletic legacy and current objectives..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-text-dim tracking-[0.2em] ml-1">Current Matrix Key</label>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                        <input 
                          type={showPasswords ? "text" : "password"}
                          value={securityData.currentPassword}
                          onChange={e => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                          className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-12 text-xs font-bold text-text-main outline-none focus:border-accent transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-text-dim tracking-[0.2em] ml-1">New Neural Key</label>
                        <div className="relative group">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                          <input 
                            type={showPasswords ? "text" : "password"}
                            value={securityData.newPassword}
                            onChange={e => setSecurityData({ ...securityData, newPassword: e.target.value })}
                            className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-text-dim tracking-[0.2em] ml-1">Confirm Neural Key</label>
                        <div className="relative group">
                          <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                          <input 
                            type={showPasswords ? "text" : "password"}
                            value={securityData.confirmPassword}
                            onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                            className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-text-main outline-none focus:border-accent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-[10px] font-black uppercase text-accent tracking-widest flex items-center gap-2 hover:opacity-80"
                    >
                      {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPasswords ? 'Hide Key Sequences' : 'Reveal Key Sequences'}
                    </button>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-8 py-4">
                    {[
                      { title: 'Neural Uplink Alerts', desc: 'Notify when a scout initializes a new assessment of your metrics.' },
                      { title: 'Leaderboard Shift', desc: 'Alert when your regional or global ranking changes position.' },
                      { title: 'Talent Feed Updates', desc: 'Direct broadcast of trending sports news and AI scouting reports.' },
                    ].map((notif, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-bg border border-border rounded-2xl group hover:border-accent/30 transition-all">
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-tight text-text-main">{notif.title}</p>
                          <p className="text-[10px] font-medium text-text-dim uppercase tracking-wider">{notif.desc}</p>
                        </div>
                        <div className="w-12 h-6 bg-surface-alt border border-border rounded-full relative cursor-pointer group-hover:bg-accent/20 transition-colors">
                           <div className="absolute top-1 left-1 w-4 h-4 bg-text-dim rounded-full transition-all group-hover:left-7 group-hover:bg-accent" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-8 py-4">
                    <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-6">
                      <div className="flex items-center gap-4 text-red-400">
                        <Shield size={24} />
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">Danger Zone / Terminal Deletion</p>
                          <p className="text-[10px] font-medium uppercase tracking-widest opacity-70">Irreversible metadata purging from the global matrix.</p>
                        </div>
                      </div>
                      <button className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-bg transition-all">
                         Purge All Identity Data
                      </button>
                    </div>
                  </div>
                )}

                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.1em] ${
                      message.type === 'success' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                  </motion.div>
                )}

                <div className="flex justify-end pt-8 border-t border-border mt-12 gap-4">
                  <button 
                    type="submit"
                    disabled={isSaving || (activeTab !== 'profile' && activeTab !== 'security')}
                    className="bg-accent text-bg px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {isSaving ? 'Synchronizing...' : 'Update Matrix Identity'}
                    <Save size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
