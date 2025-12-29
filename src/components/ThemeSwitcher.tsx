import { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEMES = {
  young: [
    { id: 'neon-purple', name: '霓虹紫', primary: '270 95% 60%', accent: '280 100% 70%', bg: '270 50% 5%' },
    { id: 'ocean-blue', name: '海洋蓝', primary: '200 100% 50%', accent: '190 100% 60%', bg: '210 50% 5%' },
    { id: 'sunset-orange', name: '日落橙', primary: '25 100% 55%', accent: '35 100% 60%', bg: '20 40% 5%' },
    { id: 'mint-green', name: '薄荷绿', primary: '160 70% 50%', accent: '150 80% 55%', bg: '165 40% 5%' },
  ],
  middleAge: [
    { id: 'classic-dark', name: '经典黑', primary: '220 15% 55%', accent: '220 20% 65%', bg: '220 15% 8%' },
    { id: 'warm-gray', name: '暖灰色', primary: '30 20% 55%', accent: '35 25% 60%', bg: '30 10% 8%' },
    { id: 'navy-blue', name: '藏青蓝', primary: '215 50% 45%', accent: '210 55% 55%', bg: '220 30% 8%' },
    { id: 'forest-green', name: '森林绿', primary: '140 35% 40%', accent: '135 40% 50%', bg: '145 25% 6%' },
  ],
};

function applyTheme(theme: typeof THEMES.young[0]) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--background', theme.bg);
  root.style.setProperty('--card', theme.bg);
  root.style.setProperty('--popover', theme.bg);
  localStorage.setItem('selected-theme', theme.id);
}

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('selected-theme');
    return saved || 'neon-purple';
  });

  const handleSelectTheme = (theme: typeof THEMES.young[0]) => {
    applyTheme(theme);
    setCurrentTheme(theme.id);
    setIsOpen(false);
  };

  // Apply saved theme on mount
  useState(() => {
    const saved = localStorage.getItem('selected-theme');
    if (saved) {
      const allThemes = [...THEMES.young, ...THEMES.middleAge];
      const theme = allThemes.find(t => t.id === saved);
      if (theme) applyTheme(theme);
    }
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 glass-panel px-3 py-2 hover:bg-accent/20 transition-colors"
      >
        <Palette className="w-4 h-4 text-primary" />
        <span className="text-xs hidden sm:inline">主题</span>
        <ChevronDown className={cn(
          "w-3 h-3 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full right-0 mt-2 glass-panel py-3 px-4 z-50 w-64 animate-fade-in">
            {/* Young themes */}
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                年轻活力
              </div>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.young.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-left",
                      "hover:bg-accent/30",
                      currentTheme === theme.id && "ring-1 ring-primary bg-primary/10"
                    )}
                  >
                    <div 
                      className="w-4 h-4 rounded-full ring-1 ring-white/20"
                      style={{ background: `hsl(${theme.primary})` }}
                    />
                    <span className="text-xs">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle-age themes */}
            <div>
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-500 to-slate-400" />
                沉稳经典
              </div>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.middleAge.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-left",
                      "hover:bg-accent/30",
                      currentTheme === theme.id && "ring-1 ring-primary bg-primary/10"
                    )}
                  >
                    <div 
                      className="w-4 h-4 rounded-full ring-1 ring-white/20"
                      style={{ background: `hsl(${theme.primary})` }}
                    />
                    <span className="text-xs">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
