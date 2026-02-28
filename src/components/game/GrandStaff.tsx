import { ReactNode } from 'react';

interface GrandStaffProps {
  children?: ReactNode;  // Notes will be rendered as children
  className?: string;
}

// Staff line spacing and positions
export const STAFF_CONFIG = {
  lineSpacing: 10,       // pixels between staff lines
  staffHeight: 40,       // 4 spaces = 5 lines
  gap: 30,               // gap between treble and bass staff
  timingLinePosition: 80, // pixels from left edge where timing line is
};

export function GrandStaff({ children, className }: GrandStaffProps) {
  // Render 5 horizontal lines for a staff
  const renderStaffLines = (yOffset: number) => (
    <>
      {[0, 1, 2, 3, 4].map(line => (
        <line
          key={line}
          x1="0"
          x2="100%"
          y1={yOffset + line * STAFF_CONFIG.lineSpacing}
          y2={yOffset + line * STAFF_CONFIG.lineSpacing}
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />
      ))}
    </>
  );

  const totalHeight = STAFF_CONFIG.staffHeight * 2 + STAFF_CONFIG.gap + 40; // Extra padding

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height: totalHeight }}>
      <svg className="absolute inset-0 w-full h-full">
        {/* Treble staff (top) */}
        <g className="treble-staff">
          <text x="10" y="35" className="text-2xl fill-foreground">&#119070;</text>
          {renderStaffLines(20)}
        </g>
        
        {/* Bass staff (bottom) */}
        <g className="bass-staff">
          <text x="10" y={20 + STAFF_CONFIG.staffHeight + STAFF_CONFIG.gap + 15} className="text-2xl fill-foreground">&#119074;</text>
          {renderStaffLines(20 + STAFF_CONFIG.staffHeight + STAFF_CONFIG.gap)}
        </g>
        
        {/* Timing line (vertical line where notes should be played) */}
        <line
          x1={STAFF_CONFIG.timingLinePosition}
          x2={STAFF_CONFIG.timingLinePosition}
          y1="0"
          y2={totalHeight}
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          className="timing-line"
        />
      </svg>
      
      {/* Notes layer - positioned above staff */}
      <div className="absolute inset-0 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
