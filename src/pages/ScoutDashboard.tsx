import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Plus, 
  Activity,
  History,
  BrainCircuit,
  Award
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Assessment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import VideoAnalysis from '../components/VideoAnalysis';

export default function ScoutDashboard() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [allAthletes, setAllAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch Assessments via API
        const assessmentResp = await fetch('/api/assessments');
        if (assessmentResp.ok) {
          const data = await assessmentResp.json();
          setAssessments(data);
        }

        // If Scout or Admin, fetch athletes via API
        if (user.role === 'scout' || user.role === 'admin') {
          const athleteResp = await fetch('/api/users/athletes');
          if (athleteResp.ok) {
            const data = await athleteResp.json();
            setAllAthletes(data);
          }
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [metrics, setMetrics] = useState({ speed: 50, agility: 50, strength: 50, technique: 50, stamina: 50 });
  const [videoAnalysisData, setVideoAnalysisData] = useState<{ feedback: string, url: string } | null>(null);

  const handleVideoAnalysisComplete = (feedback: string, videoUrl: string) => {
    setVideoAnalysisData({ feedback, url: videoUrl });
  };

  const handleCreateAssessment = async () => {
    if (!selectedAthleteId) return alert("Select target athlete");
    const sportInput = document.getElementById('sport-context') as HTMLInputElement;
    const sportContext = sportInput?.value || user?.sport || 'General';

    try {
      const athlete = allAthletes.find(a => a.id === selectedAthleteId) || (user?.uid === selectedAthleteId ? user : null);
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: selectedAthleteId,
          athleteName: athlete?.displayName || user?.displayName,
          sport: sportContext,
          metrics,
          videoUrl: videoAnalysisData?.url,
          videoAnalysis: videoAnalysisData?.feedback,
          aiInsight: videoAnalysisData?.feedback || `Performance matrix synchronized. Average score: ${(Object.values(metrics) as number[]).reduce((a, b) => a + b, 0) / 5}%`
        })
      });

      if (response.ok) {
        setIsAddingAssessment(false);
        setVideoAnalysisData(null); // Clear after sync
        // Refresh data
        const assessmentResp = await fetch('/api/assessments');
        if (assessmentResp.ok) setAssessments(await assessmentResp.json());
      }
    } catch (err) {
      console.error("Submission failure:", err);
    }
  };

  const filteredAssessments = assessments.filter(a => {
    if (!dateRange.start && !dateRange.end) return true;
    const date = new Date(a.timestamp);
    if (dateRange.start && date < new Date(dateRange.start)) return false;
    if (dateRange.end && date > new Date(dateRange.end)) return false;
    return true;
  });

  // Derived data for charts
  const progressData = [...filteredAssessments].reverse().map(a => ({
    date: new Date(a.timestamp).toLocaleDateString(),
    score: (Object.values(a.metrics) as number[]).reduce((acc, v) => acc + v, 0) / 5,
  }));

  const latestMetrics = filteredAssessments[0]?.metrics || { speed: 0, agility: 0, strength: 0, technique: 0, stamina: 0 };
  const radarData = Object.entries(latestMetrics).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 100,
  }));

  if (loading) return <div className="h-96 flex items-center justify-center text-text-dim font-black uppercase tracking-widest animate-pulse">Initializing Interface...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">
            {user?.role === 'admin' ? 'Global Admin Console' : user?.role === 'scout' ? 'Scout Analysis: Western Conference' : 'Athlete Neural Profile'}
          </h1>
          <p className="text-text-dim text-sm font-medium">
            {user?.role === 'admin' ? 'Monitoring all network telemetry' : user?.role === 'scout' ? 'Real-time tracking for U19 prospects' : 'Self-assessment and bio-metric history'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 p-2 bg-surface rounded-xl border border-border">
           <div className="flex items-center gap-2 group px-2">
              <Calendar size={14} className="text-text-dim group-focus-within:text-accent transition-colors" />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-text-main placeholder:text-text-dim tracking-widest [color-scheme:dark]"
              />
           </div>
           <div className="h-4 w-[1px] bg-border hidden md:block" />
           <div className="flex items-center gap-2 group px-2">
              <Calendar size={14} className="text-text-dim group-focus-within:text-accent transition-colors" />
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-text-main placeholder:text-text-dim tracking-widest [color-scheme:dark]"
              />
           </div>
           {(dateRange.start || dateRange.end) && (
             <button 
               onClick={() => setDateRange({ start: '', end: '' })}
               className="text-[9px] font-black text-red-400 uppercase tracking-widest px-2 hover:text-red-300 transition-colors"
             >
               Clear Filter
             </button>
           )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button 
            onClick={() => {
              if (user?.role === 'athlete') setSelectedAthleteId(user.uid);
              setIsAddingAssessment(true);
            }}
            className="bg-accent text-bg px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-accent/10"
          >
            {user?.role === 'athlete' ? 'Log Self-Assessment' : 'New Assessment'}
          </button>
          {(user?.role === 'scout' || user?.role === 'admin') && (
            <button 
              className="bg-surface-alt text-text-main border border-border px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-surface transition-all"
              onClick={() => {
                alert("Neural link established. Redirecting to Athlete Provisioning module...");
                // In a real app, this would open a registration form restricted to scouts
              }}
            >
              Provision Athlete
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress/Video Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-sm font-semibold tracking-tight">Aggregate Talent Progress (30-Day History)</h3>
              <div className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[9px] font-black uppercase tracking-widest text-accent">
                Live Data
              </div>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData.length ? progressData : [{date:'Oct 01', score:40}, {date:'Oct 15', score:65}, {date:'Oct 31', score:92}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#21262D" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#8B949E' }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 800, color: '#E6EDF3', fontSize: 11 }}
                    itemStyle={{ color: '#3FB950', fontSize: 11 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3FB950" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#3FB950', strokeWidth: 0 }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {(user?.role === 'scout' || user?.role === 'admin') && (
            <div className="h-[400px]">
              <VideoAnalysis onAnalysisComplete={handleVideoAnalysisComplete} />
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Skill Matrix */}
          <div className="bg-surface p-6 rounded-xl border border-border">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
              <BrainCircuit size={16} className="text-accent" /> Biometric Signature
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#30363D" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E', fontSize: 8, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                  <Radar
                    name="Metrics"
                    dataKey="A"
                    stroke="#3FB950"
                    fill="#3FB950"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {Object.entries(latestMetrics).map(([key, val]) => (
                <div key={key} className="text-center">
                  <p className="text-[8px] font-black uppercase text-text-dim truncate">{key}</p>
                  <p className="text-xs font-bold text-accent">{val}%</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-alt border border-border rounded-xl p-6 flex flex-col justify-between">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-bold text-text-main uppercase tracking-wider">Performance Analytics</span>
             </div>
             
             <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-text-dim">
                  <span>Growth Index</span>
                  <span className="text-accent">+14.2%</span>
                </div>
                <div className="w-full bg-bg h-1 rounded-full overflow-hidden">
                  <div className="bg-accent h-full w-[14.2%]" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-bg rounded-lg border border-border">
                    <p className="text-[8px] font-black text-text-dim uppercase mb-1">Peak Score</p>
                    <p className="text-lg font-bold text-text-main">{filteredAssessments.length > 0 ? Math.max(...filteredAssessments.map(a => (Object.values(a.metrics) as number[]).reduce((sum, v) => sum + v, 0) / 5)).toFixed(1) : '0.0'}</p>
                  </div>
                  <div className="p-3 bg-bg rounded-lg border border-border">
                    <p className="text-[8px] font-black text-text-dim uppercase mb-1">Consistency</p>
                    <p className="text-lg font-bold text-text-main">92.4%</p>
                  </div>
                </div>
             </div>

             <button className="w-full py-3 bg-accent/10 text-accent border border-accent/20 rounded-lg font-bold text-xs uppercase tracking-[0.1em] hover:bg-accent hover:text-bg transition-all">
               Generate AI Progression Report
             </button>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border">
            <h3 className="text-sm font-semibold mb-6 flex items-center justify-between">
              Neural Milestone
              <Award size={14} className="text-accent" />
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <Activity size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-main uppercase tracking-widest">Elite Tier Progress</p>
                  <p className="text-[10px] text-text-dim font-medium uppercase mt-1">Next rank: Master Scout Index [85.0]</p>
                </div>
              </div>
              <div className="space-y-1">
                 <div className="flex justify-between text-[10px] font-bold uppercase text-text-dim">
                    <span>Rank Progression</span>
                    <span>72%</span>
                 </div>
                 <div className="w-full bg-surface-alt h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-full w-[72%]" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-sm font-semibold mb-6 flex items-center justify-between">
            {user?.role === 'athlete' ? 'My Recent Telemetry' : 'Field Activity Log'}
            <History size={14} className="text-text-dim" />
          </h3>
          <div className="space-y-2">
            {filteredAssessments.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-3 bg-surface-alt rounded-lg border border-border/50 group hover:border-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-accent text-xs font-black border border-border">
                  {a.rank || 'ID'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-main">
                    {user?.role === 'athlete' ? `Session: ${a.sport}` : a.athleteName}
                  </p>
                  <p className="text-[10px] font-medium text-text-dim uppercase tracking-wider">
                     {a.sport} • {new Date(a.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-accent">
                    {((Object.values(a.metrics) as number[]).reduce((acc, v) => acc + v, 0) / 5).toFixed(1)}
                  </div>
                  {a.videoUrl && <div className="text-[8px] text-accent font-bold uppercase tracking-tighter">Video Scan [OK]</div>}
                </div>
              </div>
            ))}
            {filteredAssessments.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                 <p className="text-[10px] uppercase font-black tracking-widest text-text-dim">Telemetry Buffer Empty</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-sm font-semibold mb-6 flex items-center justify-between">
            {user?.role === 'athlete' ? 'My Growth Pulse' : 'Network Activity Insights'}
            <TrendingUp size={14} className="text-accent" />
          </h3>
          <p className="text-xs font-medium text-text-dim leading-relaxed">
            {user?.role === 'athlete' 
              ? 'Your kinetic telemetry shows a strong upward trend in stamina and technique. AI suggests increasing high-intensity interval training to bridge the gap in agility.'
              : 'The talent network is showing high density in agility-focused prospects. Recommend increasing biometric thresholds for upcoming U19 regional reviews.'}
          </p>
          <div className="mt-6 pt-6 border-t border-border">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-text-dim uppercase">Training Compliance</span>
                <span className="text-[10px] font-bold text-accent">98.5%</span>
             </div>
             <div className="w-full bg-surface-alt h-1 rounded-full">
                <div className="bg-accent h-full w-[98.5%]" />
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-surface w-full max-w-lg rounded-2xl p-8 border border-border shadow-2xl"
             >
                <div className="card-header mb-8">
                  <h2 className="text-lg font-bold tracking-tight">Manual Parameter Input</h2>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                      {user?.role !== 'athlete' ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Target Athlete</label>
                          <select 
                            className="w-full bg-bg border border-border rounded-lg p-3 text-text-main outline-none focus:border-accent text-xs font-bold"
                            value={selectedAthleteId}
                            onChange={(e) => setSelectedAthleteId(e.target.value)}
                          >
                            <option value="">Select telemetry destination...</option>
                            {allAthletes.map(a => (
                              <option key={a.id} value={a.id}>{a.displayName} ({a.sport})</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="p-4 bg-bg border border-border rounded-xl">
                          <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Session Owner</p>
                          <p className="text-sm font-bold text-text-main">{user.displayName} (Self-Capture)</p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Sport Modality</label>
                        <input 
                          type="text" 
                          id="sport-context"
                          placeholder="e.g. Football, Sprinting, Powerlifting"
                          className="w-full bg-bg border border-border rounded-lg p-3 text-text-main outline-none focus:border-accent text-xs font-bold"
                          defaultValue={user?.sport || ''}
                        />
                      </div>

                      {(['speed', 'agility', 'strength', 'technique', 'stamina'] as const).map(metric => (
                        <div key={metric} className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border">
                          <label className="text-xs font-bold text-text-dim uppercase tracking-widest">{metric}</label>
                          <input 
                            type="number" 
                            placeholder="%" 
                            value={metrics[metric]}
                            onChange={(e) => setMetrics({ ...metrics, [metric]: parseInt(e.target.value) || 0 })}
                            className="w-20 bg-bg border border-border rounded p-1.5 text-right outline-none focus:border-accent text-accent font-bold text-sm" 
                          />
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsAddingAssessment(false)} className="flex-1 bg-surface-alt text-text-dim font-bold py-3 rounded-lg text-xs uppercase tracking-widest hover:text-text-main transition-colors">Abort</button>
                    <button 
                      onClick={handleCreateAssessment}
                      className="flex-1 bg-accent text-bg font-bold py-3 rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                      Sync Record
                    </button>
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
