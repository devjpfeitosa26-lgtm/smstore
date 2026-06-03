import { useState } from 'react';

type CardType = 'standard' | 'adult' | 'drink';

interface GameCardProps {
  type: CardType;
  text?: string;
  showBack?: boolean;
}

// SVG Icons for card backs
const LaughingEmoji = () => (
  <svg width="90" height="90" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFD700" />
    <circle cx="50" cy="50" r="46" fill="none" stroke="#E6B800" strokeWidth="2" />
    <path d="M30 38 Q35 30 40 38" stroke="#333" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="M60 38 Q65 30 70 38" stroke="#333" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="M25 58 Q50 82 75 58" fill="#cc3300" stroke="#333" strokeWidth="2" />
    <path d="M25 58 Q50 72 75 58" fill="#fff" />
    <line x1="37" y1="58" x2="37" y2="66" stroke="#ddd" strokeWidth="1.5" />
    <line x1="50" y1="58" x2="50" y2="68" stroke="#ddd" strokeWidth="1.5" />
    <line x1="63" y1="58" x2="63" y2="66" stroke="#ddd" strokeWidth="1.5" />
    <ellipse cx="26" cy="44" rx="4" ry="6" fill="#60BFFF" opacity="0.7" />
    <ellipse cx="74" cy="44" rx="4" ry="6" fill="#60BFFF" opacity="0.7" />
  </svg>
);

const DevilEmoji = () => (
  <svg width="90" height="90" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="56" r="38" fill="#9B59B6" />
    <circle cx="50" cy="56" r="38" fill="none" stroke="#6C3483" strokeWidth="2" />
    <polygon points="28,24 20,8 36,20" fill="#6C3483" />
    <polygon points="72,24 80,8 64,20" fill="#6C3483" />
    <ellipse cx="37" cy="50" rx="6" ry="5" fill="#1a0a2e" />
    <ellipse cx="63" cy="50" rx="6" ry="5" fill="#1a0a2e" />
    <ellipse cx="38" cy="49" rx="2" ry="2" fill="#ff0055" />
    <ellipse cx="64" cy="49" rx="2" ry="2" fill="#ff0055" />
    <path d="M29 43 Q37 38 45 43" stroke="#4a0060" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M55 43 Q63 38 71 43" stroke="#4a0060" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M30 66 Q50 80 70 66" fill="#cc0044" stroke="#6C3483" strokeWidth="1.5" />
    <path d="M30 66 Q50 72 70 66" fill="#ff4488" />
    <polygon points="41,66 37,73 45,73" fill="#fff" />
    <polygon points="59,66 55,73 63,73" fill="#fff" />
    <path d="M82 68 Q95 60 90 50 Q85 40 92 35" stroke="#6C3483" strokeWidth="3" fill="none" strokeLinecap="round" />
    <polygon points="92,35 98,30 94,42" fill="#6C3483" />
  </svg>
);

const BeerMug = () => (
  <svg width="80" height="90" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="18" rx="18" ry="10" fill="#fff" opacity="0.95" />
    <ellipse cx="22" cy="20" rx="10" ry="8" fill="#fff" opacity="0.95" />
    <ellipse cx="44" cy="20" rx="10" ry="8" fill="#fff" opacity="0.95" />
    <ellipse cx="33" cy="14" rx="14" ry="7" fill="#fff" />
    <path d="M14 22 L14 90 Q14 98 22 98 L56 98 Q64 98 64 90 L64 22 Z" fill="#F4C430" />
    <path d="M14 22 L14 90 Q14 98 22 98 L56 98 Q64 98 64 90 L64 22 Z" fill="none" stroke="#D4A017" strokeWidth="2" />
    <path d="M64 35 Q85 35 85 55 Q85 75 64 75" stroke="#D4A017" strokeWidth="8" fill="none" strokeLinecap="round" />
    <clipPath id="mugClip">
      <path d="M16 30 L16 90 Q16 96 22 96 L56 96 Q62 96 62 90 L62 30 Z" />
    </clipPath>
    <rect x="16" y="30" width="46" height="66" fill="#F4A900" clipPath="url(#mugClip)" />
    <circle cx="28" cy="70" r="3" fill="#FFD700" opacity="0.6" />
    <circle cx="42" cy="55" r="2" fill="#FFD700" opacity="0.6" />
    <circle cx="35" cy="80" r="2.5" fill="#FFD700" opacity="0.5" />
    <circle cx="52" cy="65" r="2" fill="#FFD700" opacity="0.6" />
    <path d="M22 22 Q24 30 22 35" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
    <path d="M44 22 Q46 32 44 38" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
  </svg>
);

const cardConfig = {
  standard: {
    label: 'Standard',
    frontBg: 'bg-black',
    frontBorder: 'border-white',
    backBg: 'bg-black',
    backBorder: 'border-white',
    textColor: 'text-white',
    badgeColor: 'text-white/30',
    BackIcon: LaughingEmoji,
    backLabel: 'Standard',
    backLabelColor: 'text-white/40',
  },
  adult: {
    label: '+18',
    frontBg: 'bg-gradient-to-br from-red-900 via-red-600 to-red-800',
    frontBorder: 'border-purple-500',
    backBg: 'bg-gradient-to-br from-red-900 via-red-600 to-red-800',
    backBorder: 'border-purple-500',
    textColor: 'text-red-100',
    badgeColor: 'text-red-200/40',
    BackIcon: DevilEmoji,
    backLabel: '+18',
    backLabelColor: 'text-purple-200/50',
  },
  drink: {
    label: 'Bebida',
    frontBg: 'bg-gradient-to-br from-green-900 via-green-700 to-green-800',
    frontBorder: 'border-yellow-400',
    backBg: 'bg-gradient-to-br from-green-900 via-green-700 to-green-800',
    backBorder: 'border-yellow-400',
    textColor: 'text-white',
    badgeColor: 'text-green-200/40',
    BackIcon: BeerMug,
    backLabel: 'Bebida',
    backLabelColor: 'text-yellow-200/50',
  },
};

export function GameCard({ type, text, showBack = false }: GameCardProps) {
  const [flipped, setFlipped] = useState(showBack);
  const cfg = cardConfig[type];
  const { BackIcon } = cfg;

  const isBack = flipped !== showBack ? !showBack : showBack;

  return (
    <div
      className="w-[220px] h-[310px] cursor-pointer"
      style={{ perspective: '900px' }}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-2xl border-4 ${cfg.frontBg} ${cfg.frontBorder} flex flex-col items-center justify-center p-6 text-center shadow-2xl`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Inner decorative border */}
          <div className="absolute inset-2 rounded-xl border border-white/10 pointer-events-none" />
          {/* Type badge */}
          <span className={`absolute top-3 left-3 text-[10px] tracking-widest uppercase font-bold ${cfg.badgeColor}`}>
            {cfg.label}
          </span>
          {/* +18 corner badge */}
          {type === 'adult' && (
            <span className="absolute top-2 right-2 bg-purple-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
              +18
            </span>
          )}
          <p className={`${cfg.textColor} text-base font-bold leading-relaxed`}>
            {text || `Carta ${cfg.label}`}
          </p>
        </div>

        {/* Back face */}
        <div
          className={`absolute inset-0 rounded-2xl border-4 ${cfg.backBg} ${cfg.backBorder} flex flex-col items-center justify-center gap-3 shadow-2xl`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <BackIcon />
          <span className={`text-[10px] tracking-widest uppercase font-bold ${cfg.backLabelColor}`}>
            {cfg.backLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
