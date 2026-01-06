
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', variant = 'dark' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const bgColors = variant === 'dark' ? 'bg-emerald-600' : 'bg-white';
  const iconColor = variant === 'dark' ? 'white' : '#059669';

  return (
    <div className={`relative ${sizes[size]} ${bgColors} rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 group ${className}`}>
      {/* Unique Modern Rwanda AI Icon: Stylized Geometric Hills + Pulse */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-2/3 h-2/3"
      >
        <path 
          d="M2 18L7 8L12 18L17 4L22 18" 
          stroke={iconColor} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="group-hover:animate-pulse"
        />
        <circle cx="17" cy="4" r="1.5" fill={variant === 'dark' ? '#34D399' : '#10B981'} className="animate-ping" />
      </svg>
      {/* Decorative aura */}
      <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
};
