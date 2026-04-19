import React, { useEffect, useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Activity,
  History,
  BrainCircuit,
  Award,
  Target,
  Video
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Assessment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import VideoAnalysis from '../components/VideoAnalysis';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function AthleteDashboard() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [trainingPlan, setTrainingPlan] = useState<string | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(false);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);

  const fetchAssessments = async () => {
    try {
      const assessmentResp = await fetch('/api/assessments');
      if (assessmentResp.ok) {
        const data = await assessmentResp.json();
        setAssessments(data);
      }
    } catch (err) {
      console.error("Error fetching athlete data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [user]);

  const handleVideoAnalysisComplete = async (feedback: string, videoUrl: string) => {
    // Attempt to extract metrics from the feedback string
    let extractedMetrics = { speed: 50, agility: 50, strength: 50, technique: 50, stamina: 50 };
    try {
      const jsonMatch = feedback.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.metrics) {
          extractedMetrics = { ...extractedMetrics, ...parsed.metrics };
        }
      }
    } catch (e) {
      console.warn("Could not parse metrics from AI feedback", e);
    }

    setIsSavingAssessment(true);
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: user?.uid,
          athleteName: user?.displayName,
          sport: user?.preferredSport || 'General',
          metrics: extractedMetrics,
          videoUrl: videoUrl,
          videoAnalysis: feedback,
          aiInsight: feedback,
        })
      });

      if (response.ok) {
        await fetchAssessments();
        // Keep the analysis view so they can read it, or close? 
        // Let's keep it visible until they manually close
      }
    } catch (err) {
      console.error("Failed to save self-assessment:", err);
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const generateTrainingPlan = async () => {
    if (assessments.length === 0) return;
    setGeneratingPlan(true);
    try {
      const history = assessments.slice(0, 5).map(a => ({
        sport: a.sport,
        metrics: a.metrics,
        insight: a.aiInsight,
        date: new Date(a.timestamp).toLocaleDateString()
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a detailed, technical, 7-day training plan for athlete ${user?.displayName} based on this assessment history: ${JSON.stringify(history)}. 
        Identify specific weaknesses and provide concrete exercises. Focus on ${user?.preferredSport || 'general athletic excellence'}. 
        Format as clear markdown with futuristic terminology.`
      });
      setTrainingPlan(response.text || "Failed to synthesize training protocols.");
    } catch (err) {
      console.error("Training plan error:", err);
      setTrainingPlan("Neural synthesis error. Matrix connection unstable.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center text-text-dim font-black uppercase tracking-widest animate-pulse">Synchronizing Neural Pulse...</div>;

  const progressData = [...assessments].reverse().map(a => ({
    date: new Date(a.timestamp).toLocaleDateString(),
    score: Object.values(a.metrics).reduce((acc, v) => acc + v, 0) / 5,
    ...a.metrics
  }));

  const latestMetrics = assessments[0]?.metrics || { speed: 0, agility: 0, strength: 0, technique: 0, stamina: 0 };
  
  const comparisonData = comparisonIds.length === 2 ? (() => {
    const a1 = assessments.find(a => a.id === comparisonIds[0]);
    const a2 = assessments.find(a => a.id === comparisonIds[1]);
    if (!a1 || !a2) return [];
    return Object.keys(a1.metrics).map(key => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: (a1.metrics as any)[key],
      B: (a2.metrics as any)[key],
      fullMark: 100
    }));
  })() : [];

  const radarData = Object.entries(latestMetrics).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 100,
  }));

  const averageScore = assessments.length > 0 
    ? (assessments.reduce((acc, a) => acc + (Object.values(a.metrics).reduce((s, v) => s + v, 0) / 5), 0) / assessments.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[9px] font-black uppercase tracking-widest text-accent">Athlete Core</div>
            <h1 className="text-3xl font-black tracking-tighter text-text-main uppercase">Performance Pulse</h1>
          </div>
          <p className="text-text-dim text-xs font-bold uppercase tracking-[0.2em]">Bio-metric integrity score: {averageScore}% Aggregate</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowVideoAnalysis(!showVideoAnalysis)}
            className="px-6 py-3 bg-surface border border-border rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-accent/50 transition-all flex items-center gap-2"
          >
            <Video size={14} className="text-accent" />
            {showVideoAnalysis ? 'Close Scanner' : 'Neural Video Assessment'}
          </button>
          <div className="flex items-center gap-4 p-4 bg-surface-alt rounded-2xl border border-border">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase text-text-dim mb-1">Last Update</p>
                <p className="text-xs font-bold text-text-main">{assessments[0] ? new Date(assessments[0].timestamp).toLocaleString() : 'Never'}</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                <TrendingUp size={20} />
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showVideoAnalysis && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface border border-accent/20 rounded-3xl p-8 mb-8 relative">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-text-main">Neural Self-Assessment</h2>
                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Stamina & Kinetic Efficiency Analysis</p>
                  </div>
                  {isSavingAssessment && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-accent animate-pulse">
                      <BrainCircuit size={14} className="animate-spin" />
                      Uploading Telemetry to Matrix...
                    </div>
                  )}
               </div>
               <div className="h-[500px]">
                 <VideoAnalysis onAnalysisComplete={handleVideoAnalysisComplete} />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface p-8 rounded-3xl border border-border shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity size={120} />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Target size={16} className="text-accent" /> Kinetic Evolution Timeline
              </h3>
              <div className="flex gap-2">
                 {['1W', '1M', '3M', '6M', 'ALL'].map(t => (
                   <button key={t} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border transition-all ${t === 'ALL' ? 'bg-accent text-bg border-accent' : 'bg-surface-alt text-text-dim border-border hover:border-accent/40'}`}>
                     {t}
                   </button>
                 ))}
              </div>
            </div>

            <div className="h-72 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData.length ? progressData : []}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3FB950" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3FB950" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#21262D" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#8B949E' }} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '12px' }}
                    itemStyle={{ color: '#3FB950', fontSize: 11, fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3FB950" fillOpacity={1} fill="url(#colorScore)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-surface p-6 rounded-2xl border border-border">
                <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center justify-between">
                   Recent Telemetry
                   <History size={14} className="text-text-dim" />
                </h3>
                <div className="space-y-4">
                  {assessments.slice(0, 3).map(a => (
                    <div key={a.id} className="p-4 bg-surface-alt border border-border/50 rounded-xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center font-bold text-accent">
                             {new Date(a.timestamp).getDate()}
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                               <p className="text-xs font-bold text-text-main">{a.sport}</p>
                               {a.type === 'self' && (
                                 <span className="px-1 py-0.5 bg-accent/10 border border-accent/20 rounded-[3px] text-[7px] font-black uppercase text-accent">Self</span>
                               )}
                             </div>
                             <p className="text-[10px] text-text-dim uppercase font-black tracking-widest">{new Date(a.timestamp).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-accent">{(Object.values(a.metrics).reduce((s, v) => s + v, 0) / 5).toFixed(1)}</p>
                          <p className="text-[8px] font-black uppercase text-text-dim">Score Index</p>
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-surface p-6 rounded-2xl border border-border flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BrainCircuit size={16} className="text-purple-400" /> Neural Guidance
                  </h3>
                  <AnimatePresence mode="wait">
                    {trainingPlan ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                        <div className="markdown-body text-[10px] leading-relaxed italic">
                          <ReactMarkdown>{trainingPlan}</ReactMarkdown>
                        </div>
                      </motion.div>
                    ) : (
                      <p className="text-xs text-text-dim leading-relaxed font-medium">
                        Analysis of your last 5 sessions indicates an 8% increase in kinetic power output. Your technique index is currently plateauing.
                      </p>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={generateTrainingPlan}
                  disabled={generatingPlan || assessments.length === 0}
                  className="w-full mt-6 py-4 bg-accent text-bg rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {generatingPlan ? 'Synthesizing...' : 'Generate AI Training Plan'}
                </button>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           {/* Side-by-side Comparison Component */}
           <div className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim mb-4 flex items-center justify-between">
                <span>Metric Intersection</span>
                <span className="text-accent">{comparisonIds.length}/2</span>
              </h3>
              
              <div className="h-48 w-full border-b border-border mb-6">
                {comparisonIds.length === 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonData}>
                      <PolarGrid stroke="#30363D" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E', fontSize: 7, fontWeight: 700 }} />
                      <Radar name="A" dataKey="A" stroke="#3FB950" fill="#3FB950" fillOpacity={0.4} />
                      <Radar name="B" dataKey="B" stroke="#A371F7" fill="#A371F7" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-center p-4">
                      <p className="text-[9px] font-black uppercase text-text-dim leading-relaxed tracking-widest text-balance">Select two logs to initiate biometric comparison</p>
                   </div>
                )}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                 {assessments.map(a => {
                    const isSelected = comparisonIds.includes(a.id);
                    return (
                      <button 
                        key={a.id}
                        onClick={() => {
                          if (isSelected) setComparisonIds(prev => prev.filter(id => id !== a.id));
                          else if (comparisonIds.length < 2) setComparisonIds(prev => [...prev, a.id]);
                          else setComparisonIds([comparisonIds[1], a.id]);
                        }}
                        className={clsx(
                          "w-full flex items-center justify-between p-2 rounded border transition-all text-left",
                          isSelected ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"
                        )}
                      >
                         <div className="min-w-0">
                            <p className="text-[10px] font-bold truncate tracking-tighter">{a.sport}</p>
                            <p className="text-[7px] font-black uppercase">{new Date(a.timestamp).toLocaleDateString()}</p>
                         </div>
                         <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center shrink-0">
                            {isSelected && <div className="w-2 h-2 bg-accent rounded-full" />}
                         </div>
                      </button>
                    );
                 })}
              </div>
           </div>

           <div className="bg-surface-alt border border-border rounded-2xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim mb-6">Biometric Blueprint</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#30363D" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E', fontSize: 8, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                    <Radar name="Metrics" dataKey="A" stroke="#3FB950" fill="#3FB950" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 space-y-3">
                 {Object.entries(latestMetrics).map(([key, value]) => (
                   <div key={key} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                         <span className="text-text-dim">{key}</span>
                         <span className="text-accent">{value}%</span>
                      </div>
                      <div className="w-full bg-bg h-1 rounded-full overflow-hidden">
                         <div className="bg-accent h-full" style={{ width: `${value}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-6 bg-accent/10 border border-accent/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-bg">
                    <Award size={16} />
                 </div>
                 <span className="text-xs font-black uppercase text-accent tracking-widest">Global Rank</span>
              </div>
              <p className="text-2xl font-black text-white italic tracking-tighter mb-1">#142 REGIONAL</p>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Bridging Top 100 [Estimate: 14 sessions]</p>
           </div>
        </div>
      </div>
    </div>
  );
}
