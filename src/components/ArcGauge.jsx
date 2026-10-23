import { useMemo } from 'react';

/** Flat-color semicircle gauge built from SVG arcs (solid flat colors). */
export function ArcGauge({ value, size = 220, thickness = 18, label, sublabel }) {
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 180;
  const endAngle = 360;

  const describeArc = (fromAngle, toAngle) => {
    const polar = (angle) => {
      const a = (angle * Math.PI) / 180;
      return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
    };
    const start = polar(fromAngle);
    const end = polar(toAngle);
    const large = toAngle - fromAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const isRanked = typeof value === 'number' && !isNaN(value);
  const clamped = isRanked ? Math.max(0, Math.min(100, value)) : 0;
  const valueAngle = useMemo(() => startAngle + (clamped / 100) * (endAngle - startAngle), [clamped]);
  const trackEnd = endAngle;

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + thickness}
        viewBox={`0 0 ${size} ${size / 2 + thickness}`}
      >
        <path
          d={describeArc(startAngle, trackEnd)}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          className="stroke-[#DDE3E8] dark:stroke-[#242424] transition-colors"
        />
        {isRanked && (
          <path
            d={describeArc(startAngle, valueAngle)}
            fill="none"
            strokeWidth={thickness}
            strokeLinecap="round"
            stroke="#007BA7"
            style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
          />
        )}
      </svg>
      <div className="-mt-14 flex flex-col items-center">
        {isRanked ? (
          <span className="text-6xl font-extrabold tracking-tight text-[#101213] dark:text-[#F8FAFC]">
            {clamped}
            <span className="text-2xl font-bold text-[#007BA7]">%</span>
          </span>
        ) : (
          <span className="text-6xl font-extrabold tracking-tight text-slate-400 dark:text-slate-500">
            —
          </span>
        )}
        {label && <span className="mt-1 text-sm font-semibold text-[#101213] dark:text-slate-300">{label}</span>}
        {sublabel && <span className="text-xs text-[#5B666E] dark:text-slate-400">{sublabel}</span>}
      </div>
    </div>
  );
}
