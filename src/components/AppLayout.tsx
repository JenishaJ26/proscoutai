import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  LayoutDashboard, 
  Newspaper, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  Search,
  Settings,
  LineChart as ChartIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ...(user?.role === 'athlete' ? [{ to: '/athlete-dashboard', label: 'My Progress', icon: ChartIcon }] : []),
    { to: '/leaderboard', label: 'Leaderboards', icon: Trophy },
    { to: '/news', label: 'Talent Feed', icon: Newspaper },
    { to: '/chat', label: 'AI Chatbot', icon: MessageSquare },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-bg overflow-hidden text-text-main">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        className="bg-surface border-r border-border flex flex-col z-20"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <span className="text-xl font-extrabold flex items-center gap-2 text-accent">
              <span className="text-2xl">◈</span> ATHLETIQ AI
            </span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-surface-alt rounded-lg transition-colors text-text-dim hover:text-text-main"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group text-sm",
                isActive 
                  ? "bg-surface-alt text-text-main font-semibold shadow-sm" 
                  : "text-text-dim hover:bg-surface-alt/50 hover:text-text-main"
              )}
            >
              <item.icon size={18} className={cn("shrink-0", isSidebarOpen ? "" : "mx-auto")} />
              {isSidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className={cn("flex items-center gap-3 p-3", isSidebarOpen ? "" : "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-surface-alt border border-border flex items-center justify-center text-accent shrink-0 overflow-hidden">
               {user?.photoURL ? <img src={user.photoURL} alt="" /> : <UserIcon size={14} />}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">{user?.displayName}</p>
                <p className="text-[10px] text-text-dim uppercase tracking-wider">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 p-2 text-text-dim hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 mt-2 text-xs font-medium",
              isSidebarOpen ? "" : "justify-center"
            )}
          >
            <LogOut size={16} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="h-16 border-b border-border px-8 flex items-center justify-between shrink-0 bg-bg/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 text-text-dim">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="bg-transparent border-none outline-none text-sm w-64 text-text-main placeholder:text-text-dim"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-text-dim">Agent: {user?.displayName}</div>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
               <UserIcon size={14} />
            </div>
          </div>
        </header>
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
