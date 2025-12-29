import { TimeFrame, TIME_FRAME_OPTIONS } from '@/types/trading';

interface TimeFrameSelectorProps {
  value: TimeFrame;
  onChange: (tf: TimeFrame) => void;
}

export function TimeFrameSelector({ value, onChange }: TimeFrameSelectorProps) {
  return (
    <div className="flex items-center gap-1 glass-panel p-1">
      {TIME_FRAME_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
            value === option.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
