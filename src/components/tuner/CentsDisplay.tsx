import { getCentsColor, formatCents } from '@/lib/pitch/cents';

interface CentsDisplayProps {
  cents: number;
}

export function CentsDisplay({ cents }: CentsDisplayProps) {
  const color = getCentsColor(cents);
  const formatted = formatCents(cents);

  return (
    <div className="cents-display" style={{ color }}>
      {formatted}
    </div>
  );
}
