// TimingLine is integrated into GrandStaff.tsx as an SVG element
// This file exports utility functions for timing calculations

import { SCROLL_SPEEDS, type ScrollSpeed } from '@/types/game';

// Calculate how long a note takes to scroll from spawn to timing line
export function getScrollDuration(scrollSpeed: ScrollSpeed, distance: number): number {
  const pixelsPerSecond = SCROLL_SPEEDS[scrollSpeed];
  return (distance / pixelsPerSecond) * 1000; // ms
}

// Calculate note X position based on time since spawn
export function getNotePosition(
  spawnTime: number,
  scrollSpeed: ScrollSpeed,
  containerWidth: number,
  _timingLineX: number
): number {
  const elapsed = Date.now() - spawnTime;
  const pixelsPerMs = SCROLL_SPEEDS[scrollSpeed] / 1000;
  
  // Notes start at right edge and move left
  const startX = containerWidth;
  const currentX = startX - (elapsed * pixelsPerMs);
  
  return currentX;
}

export const TIMING_LINE_X = 80; // Match STAFF_CONFIG.timingLinePosition
