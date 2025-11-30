import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  isLoading: boolean;
  label?: string;
  duration?: number; // Estimated duration in ms for 0-90%
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ isLoading, label, duration = 3000 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    let timeout: any;

    if (isLoading) {
      setProgress(0);
      // Update frequency 100ms
      const stepTime = 100;
      // Calculate step size to reach 90% in 'duration'
      // Steps count = duration / stepTime
      const steps = duration / stepTime;
      const increment = 90 / steps;

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // Stall at 90%
          return Math.min(prev + increment, 90);
        });
      }, stepTime);
    } else {
      // When loading finishes, jump to 100%
      if (progress > 0 || progress === 0) {
        setProgress(100);
        // Reset after animation
        timeout = setTimeout(() => {
          setProgress(0);
        }, 500); 
      }
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoading, duration]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="w-full space-y-1.5 animate-in fade-in duration-300 py-2">
      {label && (
        <div className="flex justify-between text-xs text-emerald-700 font-medium px-1">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-emerald-100/50 rounded-full overflow-hidden border border-emerald-100">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};