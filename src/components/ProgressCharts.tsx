import React, { useMemo, useRef, useState } from 'react';
import { DailyBlockStat } from '../data/types';
import { formatNaira } from '../utils/currency';

interface ProgressPoint {
  dayNumber: number;
  label: string;
  savedNaira: number;
  achieved: boolean;
}

export const BettingFreeProgressChart: React.FC<{
  cleanDays: number;
  cleanHoursRemainder: number;
  dailySpendEstimate: number;
  nextMilestoneDay: number;
}> = ({ cleanDays, cleanHoursRemainder, dailySpendEstimate, nextMilestoneDay }) => {
  const points: ProgressPoint[] = useMemo(() => {
    const horizon = Math.max(nextMilestoneDay, Math.max(cleanDays + 1, 7));
    const step = horizon <= 10 ? 1 : horizon <= 30 ? 3 : horizon <= 90 ? 10 : 30;
    const daySet = new Set<number>();
    for (let d = 0; d < horizon; d += step) {
      daySet.add(d);
    }
    if (cleanDays > 0 && cleanDays < horizon) {
      daySet.add(cleanDays);
    }
    daySet.add(horizon);
    return Array.from(daySet)
      .sort((a, b) => a - b)
      .map((day) => {
        const achieved = day <= cleanDays;
        const saved =
          day === cleanDays && cleanDays === 0
            ? Math.floor((cleanHoursRemainder / 24) * dailySpendEstimate)
            : day * dailySpendEstimate;
        return {
          dayNumber: day,
          label: day === 0 ? 'Start' : `D${day}`,
          savedNaira: saved,
          achieved,
        };
      });
  }, [cleanDays, cleanHoursRemainder, dailySpendEstimate, nextMilestoneDay]);

  const defaultIndex = useMemo(() => {
    let lastAchieved = 0;
    points.forEach((p, idx) => {
      if (p.achieved) lastAchieved = idx;
    });
    return lastAchieved;
  }, [points]);

  const [selectedIndex, setSelectedIndex] = useState<number>(defaultIndex);
  const clampedIndex = Math.min(selectedIndex, Math.max(0, points.length - 1));
  const activePoint = points[clampedIndex] ?? points[0];
  const maxDay = Math.max(1, points[points.length - 1]?.dayNumber ?? 7);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const updateIndexFromPointer = (clientX: number) => {
    const el = svgRef.current;
    if (!el || points.length <= 1) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
    const idx = Math.round(frac * (points.length - 1));
    setSelectedIndex(Math.min(points.length - 1, Math.max(0, idx)));
  };

  const w = 440;
  const h = 148;
  const topPad = 12;
  const bottomPad = 12;
  const chartH = h - topPad - bottomPad;
  const stepX = points.length > 1 ? (w - 16) / (points.length - 1) : w - 16;
  const leftOffset = 8;

  const projectedPoints = points.map((pt, idx) => {
    const x = leftOffset + idx * stepX;
    const y = topPad + chartH * (1 - Math.min(1, Math.max(0, pt.dayNumber / maxDay)));
    return { x, y, pt, idx };
  });

  const projectedPathD = projectedPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const achievedFloatDay = cleanDays + cleanHoursRemainder / 24;
  const achievedCoords = projectedPoints
    .filter((p) => p.pt.dayNumber <= achievedFloatDay)
    .map((p) => ({ x: p.x, y: p.y }));

  if (achievedCoords.length > 0 && achievedFloatDay < maxDay) {
    const exactY = topPad + chartH * (1 - Math.min(1, Math.max(0, achievedFloatDay / maxDay)));
    let baseIdx = 0;
    points.forEach((pt, idx) => {
      if (pt.dayNumber <= achievedFloatDay) baseIdx = idx;
    });
    const nextIdx = Math.min(points.length - 1, baseIdx + 1);
    if (nextIdx > baseIdx) {
      const d0 = points[baseIdx].dayNumber;
      const d1 = points[nextIdx].dayNumber;
      const localT = Math.min(1, Math.max(0, (achievedFloatDay - d0) / Math.max(1, d1 - d0)));
      const exactX = leftOffset + (baseIdx + localT) * stepX;
      achievedCoords.push({ x: exactX, y: exactY });
    }
  }

  const achievedLineD =
    achievedCoords.length >= 2
      ? achievedCoords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
      : '';
  const achievedAreaD =
    achievedCoords.length >= 2
      ? `M ${achievedCoords[0].x.toFixed(1)} ${(topPad + chartH).toFixed(1)} ${achievedCoords
          .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(' ')} L ${achievedCoords[achievedCoords.length - 1].x.toFixed(1)} ${(topPad + chartH).toFixed(1)} Z`
      : '';

  const selCoord = projectedPoints[clampedIndex] ?? projectedPoints[0];

  const xLabels =
    points.length <= 6
      ? points
      : [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]];

  return (
    <div className="w-full">
      {/* Live Interactive Tooltip Strip */}
      <div className="flex items-center justify-between rounded-[14px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-2.5">
        <div>
          <p className="text-xs font-semibold text-[var(--ink)]">
            {activePoint.achieved
              ? `Achieved • Day ${activePoint.dayNumber}`
              : `Target • Day ${activePoint.dayNumber}`}
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            {activePoint.achieved
              ? 'Betting-free milestone unlocked'
              : `${Math.max(1, activePoint.dayNumber - cleanDays)} day(s) remaining`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-base font-bold tabular-nums text-[var(--accent-ink)]">
            {formatNaira(activePoint.savedNaira)}
          </p>
          <p className="text-[11px] text-[var(--ink-muted)]">Est. Saved</p>
        </div>
      </div>

      <div className="mt-3.5 flex items-center">
        {/* Y-Axis Labels */}
        <div className="flex h-[148px] flex-col justify-between pr-2 text-right font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          <span>{maxDay}d</span>
          <span>{Math.floor(maxDay / 2)}d</span>
          <span>0d</span>
        </div>

        {/* Interactive SVG Chart */}
        <div className="flex-1 select-none">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${w} ${h}`}
            className="h-[148px] w-full cursor-crosshair touch-none"
            onPointerDown={(e) => {
              setDragging(true);
              updateIndexFromPointer(e.clientX);
            }}
            onPointerMove={(e) => {
              if (dragging) updateIndexFromPointer(e.clientX);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
          >
            {/* Horizontal dashed gridlines */}
            {[0, 0.5, 1].map((frac) => {
              const y = topPad + chartH * frac;
              return (
                <line
                  key={frac}
                  x1={0}
                  y1={y}
                  x2={w}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.14}
                  strokeWidth="1"
                  strokeDasharray="6 6"
                />
              );
            })}

            {/* Projected trajectory */}
            <path
              d={projectedPathD}
              fill="none"
              stroke="var(--active-fill)"
              strokeOpacity={0.28}
              strokeWidth="1.8"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />

            {/* Achieved area & solid line */}
            {achievedAreaD ? (
              <path d={achievedAreaD} fill="var(--active-fill)" fillOpacity={0.14} />
            ) : null}
            {achievedLineD ? (
              <path
                d={achievedLineD}
                fill="none"
                stroke="var(--active-fill)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Active vertical crosshair */}
            {selCoord ? (
              <line
                x1={selCoord.x}
                y1={topPad}
                x2={selCoord.x}
                y2={topPad + chartH}
                stroke="var(--active-fill)"
                strokeOpacity={0.48}
                strokeWidth="1"
                strokeDasharray="5 5"
              />
            ) : null}

            {/* Nodes */}
            {projectedPoints.map((p) => {
              const isSelected = p.idx === clampedIndex;
              const radius = isSelected ? 6 : 3.5;
              return (
                <g
                  key={p.pt.dayNumber}
                  onClick={() => setSelectedIndex(p.idx)}
                  className="cursor-pointer"
                >
                  {isSelected ? (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={radius + 2.5}
                      fill="var(--active-content)"
                      stroke="var(--active-fill)"
                      strokeWidth="1.75"
                    />
                  ) : null}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={radius}
                    fill={p.pt.achieved ? 'var(--active-fill)' : 'var(--muted-fill)'}
                    stroke={p.pt.achieved ? 'none' : 'var(--active-fill)'}
                    strokeOpacity={p.pt.achieved ? 0 : 0.45}
                    strokeWidth="1.25"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="mt-1.5 flex justify-between pl-7 font-mono text-[11px] text-[var(--ink-muted)]">
        {xLabels.map((pt) => (
          <span
            key={pt.dayNumber}
            className={
              pt.dayNumber === activePoint.dayNumber
                ? 'font-semibold text-[var(--accent-ink)]'
                : ''
            }
          >
            {pt.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const InteractiveBlockedBarChart: React.FC<{
  stats: DailyBlockStat[];
}> = ({ stats }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(Math.max(0, stats.length - 1));
  if (stats.length === 0) return null;

  const clampedIdx = Math.min(selectedIdx, stats.length - 1);
  const selectedStat = stats[clampedIdx];
  const maxCount = Math.max(1, ...stats.map((s) => s.count));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between rounded-[14px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--ink)]">
          {selectedStat.dayLabel} Intercepts
        </span>
        <span className="font-mono text-sm font-bold tabular-nums text-[var(--accent-ink)]">
          {selectedStat.count} blocked
        </span>
      </div>

      <div className="relative mt-3 h-[120px] w-full">
        {/* Dashed gridlines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-1">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="w-full border-t border-dashed border-[var(--ink)] opacity-15"
            />
          ))}
        </div>

        <div className="relative z-10 grid h-full grid-cols-7 items-end gap-2 pt-1.5 pb-1">
          {stats.map((stat, idx) => {
            const isSelected = idx === clampedIdx;
            const heightPct = stat.count > 0 ? Math.max(14, (stat.count / maxCount) * 100) : 0;
            return (
              <button
                key={`${stat.dayLabel}-${idx}`}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                aria-label={`${stat.dayLabel}: ${stat.count} blocked`}
                className={`relative flex h-full w-full cursor-pointer items-end justify-center rounded-lg bg-[var(--muted-fill)] p-0.5 transition-all duration-150 ${
                  isSelected ? 'ring-1 ring-[var(--active-fill)]' : ''
                }`}
              >
                {stat.count > 0 ? (
                  <div
                    className="w-full rounded-md bg-[var(--active-fill)] transition-all duration-200"
                    style={{
                      height: `${heightPct}%`,
                      opacity: isSelected ? 1 : 0.65,
                    }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-7 text-center font-mono text-[11px]">
        {stats.map((stat, idx) => (
          <button
            key={`${stat.dayLabel}-label-${idx}`}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`cursor-pointer ${
              idx === clampedIdx ? 'font-bold text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
            }`}
          >
            {stat.dayLabel}
          </button>
        ))}
      </div>
    </div>
  );
};
