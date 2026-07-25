import React, { useState } from 'react';
import { Shield, Check, Briefcase, Heart, Globe, AlertTriangle, Star, Award } from 'lucide-react';

export interface TvsBadgeProps {
  badgeType: 'Individual' | 'Business' | 'Government' | 'Healthcare' | 'NGO' | 'Emergency' | 'Leader';
  level?: 'Basic' | 'Professional' | 'Premium' | 'Gold Trusted';
  certificateId?: string;
  verifiedAt?: string;
  isInline?: boolean;
}

export default function TvsBadge({
  badgeType,
  level = 'Basic',
  certificateId = 'DHC-TVS-2026-000001',
  verifiedAt = '2026-07-07',
  isInline = true
}: TvsBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Styling based on Badge Type
  const config = {
    Individual: {
      color: 'bg-emerald-600 text-white hover:bg-emerald-700',
      icon: Check,
      label: 'Verified Individual',
      badgeColor: '🟦'
    },
    Business: {
      color: 'bg-emerald-500 text-white hover:bg-emerald-600',
      icon: Briefcase,
      label: 'Verified Business',
      badgeColor: '🟨'
    },
    Government: {
      color: 'bg-red-600 text-white hover:bg-red-750',
      icon: Shield,
      label: 'Government Verified',
      badgeColor: '🟥'
    },
    Healthcare: {
      color: 'bg-emerald-500 text-white hover:bg-emerald-600',
      icon: Heart,
      label: 'Healthcare Verified',
      badgeColor: '🟩'
    },
    NGO: {
      color: 'bg-emerald-600 text-white hover:bg-purple-700',
      icon: Globe,
      label: 'NGO Verified',
      badgeColor: '🟪'
    },
    Emergency: {
      color: 'bg-slate-900 text-white hover:bg-black',
      icon: AlertTriangle,
      label: 'Emergency Services',
      badgeColor: '⚫'
    },
    Leader: {
      color: 'bg-yellow-400 text-slate-900 hover:bg-yellow-500',
      icon: Star,
      label: 'Community Leader',
      badgeColor: '⭐'
    }
  };

  const badge = config[badgeType] || config.Individual;
  const IconComponent = badge.icon;

  return (
    <div 
      className={`relative inline-flex align-middle shrink-0 select-none ${isInline ? 'ms-1' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Badge Circle Indicator */}
      <span 
        className={`inline-flex items-center justify-center rounded-full p-0.5 cursor-help transition-all shadow-2xs`}
        style={{ width: '15px', height: '15px' }}
      >
        <span className="text-[10px] leading-none shrink-0" title={badge.label}>
          {badge.badgeColor}
        </span>
      </span>

      {/* Premium Hover Tooltip */}
      {showTooltip && (
        <div 
          className="absolute z-50 bottom-full start-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900 text-white text-[10px] p-3.5 rounded-2xl shadow-xl border border-slate-700/50 space-y-1.5 animate-fadeIn leading-normal"
          style={{ contentVisibility: 'auto' }}
        >
          <div className="flex items-center gap-1.5 font-black border-b border-slate-700/60 pb-1">
            <span className="text-xs">{badge.badgeColor}</span>
            <span className="text-white uppercase tracking-wider">{badge.label}</span>
          </div>
          <div className="space-y-0.5 font-semibold text-slate-300">
            <p className="flex justify-between">
              <span>Level:</span>
              <span className="text-amber-400 font-extrabold uppercase">{level}</span>
            </p>
            <p className="flex justify-between">
              <span>Verified On:</span>
              <span className="font-mono">{verifiedAt}</span>
            </p>
            <p className="flex justify-between">
              <span>Cert ID:</span>
              <span className="font-mono text-indigo-400 cursor-pointer hover:underline" onClick={() => window.open(`/verify/${certificateId}`, '_blank')}>
                {certificateId}
              </span>
            </p>
          </div>
          <p className="text-[8px] text-slate-500 font-black tracking-widest text-center uppercase pt-1 border-t border-slate-800">
            Verified by DHC Portal
          </p>
        </div>
      )}
    </div>
  );
}

