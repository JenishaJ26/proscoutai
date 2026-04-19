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
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface VideoAnalysisProps {
  onAnalysisComplete: (feedback: string, videoUrl: string) => void;
}

export default function VideoAnalysis({ onAnalysisComplete }: VideoAnalysisProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 200 * 1024 * 1024) {
        setError("Telemetry file exceeds 200MB threshold. Optimal scan density reached.");
        return;
      }
      setVideoFile(file);
      const preview = URL.createObjectURL(file);
      setLocalPreviewUrl(preview);
      setVideoUrl('');
      setFeedback(null);
      setError(null);
      setShowConfirmation(false);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const analyzeVideo = async () => {
    if (!videoFile && !videoUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setShowConfirmation(false);

    try {
      let videoPart: any;
      
      if (videoFile) {
        videoPart = await fileToGenerativePart(videoFile);
      } else {
        videoPart = { text: `[SYSTEM: Analyze athlete performance from this URL: ${videoUrl}]` };
      }

      const prompt = `Analyze this sports performance video. 
      Identify key movements, biomechanical strengths, and areas for improvement. 
      Specifically evaluate STAMINA (endurance markers), kinetic efficiency, and technical precision.
      
      Provide professional scouting feedback in a clear, structured way.
      
      CRITICAL: At the end of your analysis, include a raw JSON block (enclosed in triple backticks) with estimated performance scores (0-100) for these traits:
      {
        "metrics": {
          "speed": number,
          "agility": number,
          "strength": number,
          "technique": number,
          "stamina": number
        }
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            videoFile ? videoPart : { text: `Analyze the video found at this link: ${videoUrl}. Focus on stamina and core kinetic metrics.` }
          ]
        }
      });
      
      const text = response.text || "Neural engine could not formulate a report. Insufficient kinetic data.";
      
      setFeedback(text);
      setShowConfirmation(true);
      onAnalysisComplete(text, videoFile ? localPreviewUrl : videoUrl);
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
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 space-y-4 transition-colors hover:border-accent/30 group relative overflow-hidden">
          {isAnalyzing ? (
            <div className="text-center space-y-4 relative z-10">
              <div className="relative inline-block">
                <Loader2 size={48} className="text-accent animate-spin" />
                <Sparkles size={16} className="text-accent absolute top-0 right-0 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-text-main">Decoding Kinetic Vectors</p>
                <p className="text-[10px] text-text-dim font-medium">Gemini 3 Vision Engine processing frames...</p>
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
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-bg/80 backdrop-blur-md rounded text-[8px] font-black uppercase text-accent border border-accent/20">
                     Video Preview Loaded
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
      ) : (
        <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
          {showConfirmation && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-3 text-accent mb-4"
            >
              <CheckCircle2 size={16} />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest">Kinetic Analysis Ready</p>
                <p className="text-[8px] font-medium opacity-80 uppercase">Scouting insights synchronized. Review detailed feedback below.</p>
              </div>
              <button 
                onClick={() => document.getElementById('analysis-report')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[9px] font-black uppercase underline decoration-2 underline-offset-4 hover:text-white transition-colors"
              >
                Jump to Report
              </button>
            </motion.div>
          )}

          <div id="analysis-report" className="flex-1 overflow-y-auto p-4 bg-bg rounded-lg border border-border/50 scrollbar-hide">
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-xs text-text-main leading-relaxed whitespace-pre-wrap font-medium">
                {feedback}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => { setFeedback(null); setVideoFile(null); setVideoUrl(''); setShowConfirmation(false); }}
            className="w-full py-2.5 bg-surface-alt border border-border text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-text-main transition-colors rounded-lg flex items-center justify-center gap-2"
          >
            <History size={12} /> New Analysis Session
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
