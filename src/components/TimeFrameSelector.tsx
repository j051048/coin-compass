import { TimeFrame, TIME_FRAME_OPTIONS } from '@/types/trading';

interface TimeFrameSelectorProps {
  value: TimeFrame;
  onChange: (tf: TimeFrame) => void;
}

export function TimeFrameSelector({ value, onChange }: TimeFrameSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 glass-panel p-0.5 sm:p-1 overflow-x-auto scrollbar-thin max-w-[200px] sm:max-w-none">
      {TIME_FRAME_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded transition-all whitespace-nowrap flex-shrink-0 ${
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