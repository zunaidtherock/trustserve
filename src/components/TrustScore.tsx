import React from 'react';
import { motion } from 'motion/react';
import { Shield, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TrustScore: React.FC<TrustScoreProps> = ({ score, size = 'md', showLabel = true }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (s >= 50) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  const getProgressColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const sizes = {
    sm: { container: 'p-1.5 gap-1', text: 'text-xs', icon: 'w-3 h-3', bar: 'h-1' },
    md: { container: 'p-2.5 gap-2', text: 'text-sm', icon: 'w-4 h-4', bar: 'h-1.5' },
    lg: { container: 'p-4 gap-3', text: 'text-lg', icon: 'w-6 h-6', bar: 'h-2' },
  };

  const currentSize = sizes[size];

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex items-center rounded-xl border ${getColor(score)} ${currentSize.container}`}>
        <Shield className={currentSize.icon} fill="currentColor" fillOpacity={0.2} />
        <div className="flex flex-col">
          {showLabel && <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 leading-none mb-0.5">Trust Score</span>}
          <span className={`font-bold leading-none ${currentSize.text}`}>{score}/100</span>
        </div>
      </div>
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${currentSize.bar}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${getProgressColor(score)}`}
        />
      </div>
    </div>
  );
};

export const TrustScoreBreakdown: React.FC<{ score: number }> = ({ score }) => {
  const factors = [
    { label: 'Verification', value: 25, icon: Shield, description: 'Identity and credentials verified' },
    { label: 'Job Completion', value: 30, icon: Info, description: 'History of successfully finished tasks' },
    { label: 'Review Authenticity', value: 25, icon: Info, description: 'AI-verified genuine customer feedback' },
    { label: 'Response Speed', value: 20, icon: Info, description: 'Average time to reply to inquiries' },
  ];

  return (
    <div className="space-y-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900">Score Breakdown</h4>
        <span className="text-2xl font-black text-indigo-600">{score}</span>
      </div>
      <div className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.label} className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1">
                <span>{factor.label}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 opacity-40" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{factor.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span>{factor.value}% weight</span>
            </div>
            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 opacity-60" 
                style={{ width: `${(score / 100) * factor.value * 4}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 italic">
        * Score is updated dynamically based on real-time platform activity and AI fraud detection.
      </p>
    </div>
  );
};
