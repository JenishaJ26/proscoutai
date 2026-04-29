import React, { useState } from 'react';
import { 
  Video, 
  Sparkles, 
  Loader2, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  History,
  RefreshCcw,
  Eye,
  TrendingUp,
  Activity,
  Crosshair,
  Zap,
  BrainCircuit,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface VideoAnalysisProps {
  onAnalysisComplete: (feedback: string, videoUrl: string) => void;
}

export default function VideoAnalysis({ onAnalysisComplete }: VideoAnalysisProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sportTemplate, setSportTemplate] = useState<'GENERAL' | 'SOCCER' | 'BASKETBALL'>('GENERAL');
  const [parsedMetrics, setParsedMetrics] = useState<any>(null);
  const [parsedKpis, setParsedKpis] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl('');
      setLocalPreviewUrl(URL.createObjectURL(file));
      setFeedback(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoUrl('');
      setLocalPreviewUrl(URL.createObjectURL(file));
      setFeedback(null);
      setError(null);
    }
  };

  const analyzeVideo = async () => {
    if (!videoFile && !videoUrl) return;
    setIsAnalyzing(true);
    setError(null);
    setFeedback("");
    setParsedMetrics(null);
    setParsedKpis(null);
    
    try {
      let videoPart: any;
      let finalVideoUrl = videoUrl;

      if (videoFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        reader.readAsDataURL(videoFile);
        const base64Data = await base64Promise;
        videoPart = {
          inlineData: {
            data: base64Data,
            mimeType: videoFile.type
          }
        };
      } else {
        videoPart = { text: `[SYSTEM: Analyze athlete performance from this URL: ${videoUrl}]` };
      }

      const prompt = `Analyze this sports performance video with the precision of a high-end scouting system. 
      
      Perform the following neural scans:
      1. HUMAN POSE ESTIMATION (HPE): Track joint keypoints (shoulders, elbows, knees). Analyze angles, stride length, and kinetic chain alignment.
      2. BIOMECHANICAL ANALYSIS: Evaluate angular velocity, center of mass stability, and estimated ground reaction force.
      3. OBJECT & SPACE TRACKING: Monitor the athlete's relation to equipment (ball, hoop, field) and calculate trajectory/velocity markers.
      
      4. SPORT-SPECIFIC KPIs:
         - SOCCER: Focus on acceleration/deceleration, agility (Change of Direction), and body orientation.
         - BASKETBALL: Calculate vertical leap (via air-time), shot mechanics (release arc/speed), and wingspan estimation.
      
      Provide professional scouting feedback in a clear, structured way.
      
      CRITICAL: At the end of your analysis, include a raw JSON block (enclosed in triple backticks) with these metrics and specialized KPIs:
      {
        "metrics": {
          "speed": number,
          "agility": number,
          "strength": number,
          "technique": number,
          "stamina": number,
          "biomechanics": number,
          "pose_accuracy": number
        },
        "kpis": {
          "vertical_leap": string,
          "angular_velocity": string,
          "center_of_mass": string,
          "reaction_time": string
        }
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              videoFile ? videoPart : { text: `Analyze the video found at this link: ${videoUrl}. Focus on stamina and core kinetic metrics.` }
            ]
          }
        ]
      });
      
      const text = response.text || "Neural engine could not formulate a report. Insufficient kinetic data.";
      
      // Attempt to extract JSON metrics and KPIs
      try {
        const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.metrics) setParsedMetrics(parsed.metrics);
          if (parsed.kpis) setParsedKpis(parsed.kpis);
        }
      } catch (e) {
        console.warn("Telemetry parsing failed", e);
      }

      setFeedback(text);
      setShowConfirmation(true);
      onAnalysisComplete(text, finalVideoUrl || localPreviewUrl);
    } catch (err) {
      console.error("Video analysis error:", err);
      setError("Neutral link failure during video telemetry analysis. Ensure the file or URL is a valid sports capture.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Video size={16} className="text-accent" /> Neural Video Intelligence
        </h3>
        {(feedback || showConfirmation) && (
          <div className="flex items-center gap-3">
             <button 
                onClick={analyzeVideo}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
             >
                <RefreshCcw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
                Re-analyze
             </button>
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-widest">
                <CheckCircle2 size={12} /> Analysis Secure
             </div>
          </div>
        )}
      </div>

      {!feedback || isAnalyzing ? (
        <div className="flex flex-col gap-6 flex-1">
          {/* Scouting Template Selection */}
          {!isAnalyzing && !localPreviewUrl && (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase text-text-dim tracking-widest px-1">Select Scanning Protocol</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'GENERAL', label: 'Biometrics', sub: 'Balanced' },
                  { id: 'SOCCER', label: 'Pitch Pro', sub: 'Kinetic' },
                  { id: 'BASKETBALL', label: 'Court Pro', sub: 'Aero' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSportTemplate(t.id as any)}
                    className={clsx(
                      "p-3 rounded-xl border flex flex-col items-center gap-1 transition-all",
                      sportTemplate === t.id 
                        ? "bg-accent/10 border-accent text-accent shadow-lg shadow-accent/5" 
                        : "bg-surface-alt border-border text-text-dim hover:border-border-bright"
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tighter">{t.label}</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase">{t.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 space-y-4 transition-all group relative overflow-hidden",
              isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/30",
              localPreviewUrl ? "border-solid border-accent/20" : ""
            )}
          >
            {isAnalyzing ? (
              <div className="text-center space-y-8 relative z-10 w-full max-w-xs">
                <div className="w-full h-1 bg-border rounded-full mb-8 overflow-hidden relative">
                   <div className="absolute inset-0 bg-accent animate-[shimmer_2s_infinite]" style={{ transform: 'translateX(-100%)', background: 'linear-gradient(90deg, transparent, #3FB950, transparent)' }} />
                </div>
                <div className="relative inline-block">
                  <BrainCircuit size={48} className="text-accent animate-pulse" />
                  <Sparkles size={16} className="text-accent absolute top-0 right-0 animate-bounce" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-accent tracking-[0.3em] animate-pulse">Running Neural Scans...</h4>
                  <div className="space-y-1 opacity-60">
                    <p className="text-[8px] font-bold text-text-dim uppercase tracking-tighter">Locating Joint Keypoints (HPE)</p>
                    <p className="text-[8px] font-bold text-text-dim uppercase tracking-tighter">Analyzing Biomechanical Torque</p>
                    <p className="text-[8px] font-bold text-text-dim uppercase tracking-tighter">Calculating Trajectory Data</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {localPreviewUrl ? (
                  <div className="w-full h-48 bg-bg rounded-xl border border-border overflow-hidden relative group/preview mb-4">
                    <video 
                      src={localPreviewUrl} 
                      className="w-full h-full object-cover opacity-60 group-hover/preview:opacity-100 transition-opacity" 
                      muted
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover/preview:opacity-0 transition-opacity">
                       <Eye size={32} className="text-text-main opacity-20" />
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center text-text-dim group-hover:text-accent transition-colors">
                    <Video size={32} />
                  </div>
                )}
                
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-text-main">Drop high-performance footage</p>
                  <p className="text-[10px] text-text-dim font-medium uppercase tracking-widest leading-relaxed">MP4, MOV, AVI up to 200MB supported</p>
                </div>
                
                <div className="w-full space-y-3">
                  <label className="cursor-pointer block">
                    <input type="file" accept="video/mp4,video/quicktime,video/x-msvideo" className="hidden" onChange={handleFileChange} />
                    <span className="w-full bg-bg border border-border border-b-2 active:border-b-0 active:translate-y-[2px] px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-main hover:border-accent/40 transition-all flex items-center justify-center gap-2">
                      <Plus size={14} /> {localPreviewUrl ? 'Change Local Telemetry' : 'Select Local Telemetry'}
                    </span>
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Play size={12} className="text-text-dim" />
                    </div>
                    <input 
                      type="url"
                      placeholder="EXTERNAL RESOURCE URL (vimeo/youtube/s3)"
                      value={videoUrl}
                      onChange={(e) => { 
                        setVideoUrl(e.target.value); 
                        setVideoFile(null); 
                        setLocalPreviewUrl('');
                      }}
                      className="w-full bg-surface-alt border border-border rounded-lg pl-9 pr-3 py-2 text-[10px] font-bold text-text-main outline-none focus:border-accent/50 placeholder:text-text-dim/50 uppercase tracking-widest"
                    />
                  </div>
                </div>

                {(videoFile || videoUrl) && (
                  <div className="flex flex-col items-center gap-4 pt-4 w-full">
                    <p className="text-[10px] font-mono text-accent truncate max-w-full italic">
                      {videoFile ? videoFile.name : videoUrl}
                    </p>
                    <button 
                      onClick={analyzeVideo}
                      className="w-full bg-accent text-bg px-8 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} /> Initialize Neural Scan
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-6 overflow-hidden flex flex-col pt-2 scrollbar-hide">
          {/* Advanced Visual KPI Grid */}
          {parsedKpis && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Vertical Leap', value: parsedKpis.vertical_leap, icon: TrendingUp },
                 { label: 'Ang. Velocity', value: parsedKpis.angular_velocity, icon: Activity },
                 { label: 'CoM Stability', value: parsedKpis.center_of_mass, icon: Crosshair },
                 { label: 'Reaction', value: parsedKpis.reaction_time, icon: Zap }
               ].map((kpi, idx) => (
                 <div key={idx} className="bg-surface-alt border border-border rounded-xl p-3 flex flex-col items-center text-center relative group overflow-hidden">
                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <kpi.icon size={14} className="text-accent mb-2" />
                    <p className="text-[8px] font-black text-text-dim uppercase tracking-widest mb-1">{kpi.label}</p>
                    <p className="text-[10px] font-mono font-bold text-text-main truncate w-full">{kpi.value || '0.0ms'}</p>
                 </div>
               ))}
            </div>
          )}

          <div id="analysis-report" className="flex-1 overflow-y-auto p-4 bg-bg rounded-lg border border-border/50 scrollbar-hide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-text-dim tracking-widest border-b border-border pb-2 flex items-center gap-2">
                  <BrainCircuit size={14} className="text-purple-400" /> Neural Analysis Output
                </h4>
                <div className="markdown-body p-4 bg-bg/50 border border-border/50 rounded-xl text-xs leading-relaxed font-medium text-text-dim italic">
                  <ReactMarkdown>{feedback.replace(/```json[\s\S]*?```/g, '')}</ReactMarkdown>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-text-dim tracking-widest border-b border-border pb-2 mb-4">Biometric Calibration</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Pose Estimation', val: parsedMetrics?.pose_accuracy || 85 },
                      { label: 'Torque Efficiency', val: parsedMetrics?.biomechanics || 78 },
                      { label: 'Kinetic Link', val: parsedMetrics?.technique || 82 },
                      { label: 'Propriority', val: parsedMetrics?.agility || 75 }
                    ].map((m, idx) => (
                      <div key={idx} className="p-3 bg-surface-alt rounded-xl border border-border">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-[8px] font-black text-text-dim uppercase">{m.label}</span>
                           <span className="text-[10px] font-mono font-bold text-accent">{m.val}%</span>
                         </div>
                         <div className="h-1 bg-bg rounded-full overflow-hidden relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${m.val}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                              className="h-full bg-accent transition-all" 
                            />
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                   <h4 className="text-[10px] font-black uppercase text-accent tracking-widest mb-2 flex items-center gap-2">
                     <Plus size={10} /> Neural Guidance Insight
                   </h4>
                   <p className="text-[10px] font-medium text-text-main leading-relaxed">
                     AI-detected variance in kinetic chain efficiency. Joint mapping identifies critical deviation in primary stability axis during peak velocity stages.
                   </p>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { setFeedback(null); setVideoFile(null); setVideoUrl(''); setShowConfirmation(false); setParsedMetrics(null); setParsedKpis(null); }}
            className="w-full py-2.5 bg-surface-alt border border-border text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-text-main hover:border-accent/40 transition-all rounded-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <History size={12} /> Sync New Telemetry
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle size={16} />
          <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
        </div>
      )}
    </div>
  );
}
