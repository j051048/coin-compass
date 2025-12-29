import { useState, useEffect } from 'react';
import { Palette, ChevronDown, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  accent: string;
  bg: string;
  cardBg: string;
  foreground: string;
  mutedFg: string;
  border: string;
}

// Dark mode themes
const DARK_THEMES: { young: ThemeConfig[]; middleAge: ThemeConfig[] } = {
  young: [
    { 
      id: 'neon-purple', name: '霓虹紫', 
      primary: '270 95% 60%', accent: '280 100% 70%', 
      bg: '270 30% 6%', cardBg: '270 25% 10%',
      foreground: '270 20% 95%', mutedFg: '270 15% 60%', border: '270 30% 20%'
    },
    { 
      id: 'ocean-blue', name: '海洋蓝', 
      primary: '200 100% 50%', accent: '190 100% 60%', 
      bg: '210 40% 6%', cardBg: '210 35% 10%',
      foreground: '200 20% 95%', mutedFg: '200 15% 60%', border: '210 30% 20%'
    },
    { 
      id: 'sunset-orange', name: '日落橙', 
      primary: '25 100% 55%', accent: '35 100% 60%', 
      bg: '20 30% 6%', cardBg: '20 25% 10%',
      foreground: '30 20% 95%', mutedFg: '25 15% 60%', border: '20 25% 20%'
    },
    { 
      id: 'mint-green', name: '薄荷绿', 
      primary: '160 70% 50%', accent: '150 80% 55%', 
      bg: '165 30% 5%', cardBg: '165 25% 9%',
      foreground: '160 20% 95%', mutedFg: '160 15% 60%', border: '165 25% 18%'
    },
  ],
  middleAge: [
    { 
      id: 'classic-dark', name: '经典黑', 
      primary: '220 15% 55%', accent: '220 20% 65%', 
      bg: '220 15% 7%', cardBg: '220 15% 11%',
      foreground: '220 10% 92%', mutedFg: '220 10% 55%', border: '220 15% 18%'
    },
    { 
      id: 'warm-gray', name: '暖灰色', 
      primary: '30 20% 55%', accent: '35 25% 60%', 
      bg: '30 8% 7%', cardBg: '30 8% 11%',
      foreground: '30 10% 92%', mutedFg: '30 8% 55%', border: '30 10% 18%'
    },
    { 
      id: 'navy-blue', name: '藏青蓝', 
      primary: '215 50% 45%', accent: '210 55% 55%', 
      bg: '220 25% 7%', cardBg: '220 25% 11%',
      foreground: '215 15% 92%', mutedFg: '215 12% 55%', border: '220 20% 18%'
    },
    { 
      id: 'forest-green', name: '森林绿', 
      primary: '140 35% 40%', accent: '135 40% 50%', 
      bg: '145 20% 5%', cardBg: '145 18% 9%',
      foreground: '140 15% 92%', mutedFg: '140 12% 55%', border: '145 18% 16%'
    },
  ],
};

// Light mode themes
const LIGHT_THEMES: { young: ThemeConfig[]; middleAge: ThemeConfig[] } = {
  young: [
    { 
      id: 'neon-purple-light', name: '霓虹紫', 
      primary: '270 80% 50%', accent: '280 90% 60%', 
      bg: '270 30% 98%', cardBg: '270 25% 95%',
      foreground: '270 30% 10%', mutedFg: '270 15% 45%', border: '270 20% 88%'
    },
    { 
      id: 'ocean-blue-light', name: '海洋蓝', 
      primary: '200 90% 45%', accent: '190 90% 50%', 
      bg: '210 40% 98%', cardBg: '210 35% 95%',
      foreground: '210 40% 10%', mutedFg: '200 15% 45%', border: '210 25% 88%'
    },
    { 
      id: 'sunset-orange-light', name: '日落橙', 
      primary: '25 90% 50%', accent: '35 90% 55%', 
      bg: '30 30% 98%', cardBg: '30 25% 95%',
      foreground: '20 30% 10%', mutedFg: '25 15% 45%', border: '25 20% 88%'
    },
    { 
      id: 'mint-green-light', name: '薄荷绿', 
      primary: '160 60% 40%', accent: '150 70% 45%', 
      bg: '165 30% 98%', cardBg: '165 25% 95%',
      foreground: '165 30% 10%', mutedFg: '160 15% 45%', border: '165 20% 88%'
    },
  ],
  middleAge: [
    { 
      id: 'classic-light', name: '经典白', 
      primary: '220 20% 45%', accent: '220 25% 55%', 
      bg: '220 15% 98%', cardBg: '220 15% 95%',
      foreground: '220 15% 10%', mutedFg: '220 10% 45%', border: '220 12% 88%'
    },
    { 
      id: 'warm-cream', name: '暖米色', 
      primary: '30 30% 45%', accent: '35 35% 50%', 
      bg: '40 30% 97%', cardBg: '40 25% 94%',
      foreground: '30 15% 10%', mutedFg: '30 10% 45%', border: '35 15% 88%'
    },
    { 
      id: 'sky-blue-light', name: '天空蓝', 
      primary: '215 60% 40%', accent: '210 65% 50%', 
      bg: '215 30% 98%', cardBg: '215 25% 95%',
      foreground: '220 25% 10%', mutedFg: '215 15% 45%', border: '215 18% 88%'
    },
    { 
      id: 'sage-green', name: '鼠尾草', 
      primary: '140 30% 35%', accent: '135 35% 45%', 
      bg: '145 20% 97%', cardBg: '145 18% 94%',
      foreground: '145 20% 10%', mutedFg: '140 12% 45%', border: '145 15% 88%'
    },
  ],
};

function applyTheme(theme: ThemeConfig, isDark: boolean) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-foreground', isDark ? '0 0% 100%' : '0 0% 100%');
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-foreground', theme.foreground);
  root.style.setProperty('--background', theme.bg);
  root.style.setProperty('--foreground', theme.foreground);
  root.style.setProperty('--card', theme.cardBg);
  root.style.setProperty('--card-foreground', theme.foreground);
  root.style.setProperty('--popover', theme.cardBg);
  root.style.setProperty('--popover-foreground', theme.foreground);
  root.style.setProperty('--muted', theme.cardBg);
  root.style.setProperty('--muted-foreground', theme.mutedFg);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--input', theme.border);
  root.style.setProperty('--secondary', theme.cardBg);
  root.style.setProperty('--secondary-foreground', theme.foreground);
  localStorage.setItem('selected-theme', theme.id);
  localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
}

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved !== 'light';
  });
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('selected-theme');
    return saved || 'neon-purple';
  });

  const THEMES = isDarkMode ? DARK_THEMES : LIGHT_THEMES;

  const handleSelectTheme = (theme: ThemeConfig) => {
    applyTheme(theme, isDarkMode);
    setCurrentTheme(theme.id);
    setIsOpen(false);
  };

  const toggleMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Find equivalent theme in new mode
    const sourceThemes = newMode ? LIGHT_THEMES : DARK_THEMES;
    const targetThemes = newMode ? DARK_THEMES : LIGHT_THEMES;
    
    // Get base theme name (remove -light suffix if present)
    const baseThemeName = currentTheme.replace('-light', '');
    
    // Find the theme in target themes
    const allTargetThemes = [...targetThemes.young, ...targetThemes.middleAge];
    const targetTheme = allTargetThemes.find(t => 
      t.id === baseThemeName || t.id === baseThemeName + '-light'
    ) || allTargetThemes[0];
    
    applyTheme(targetTheme, newMode);
    setCurrentTheme(targetTheme.id);
  };

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('selected-theme');
    const savedMode = localStorage.getItem('theme-mode');
    const isDark = savedMode !== 'light';
    
    const themes = isDark ? DARK_THEMES : LIGHT_THEMES;
    const allThemes = [...themes.young, ...themes.middleAge];
    const theme = allThemes.find(t => t.id === savedTheme) || allThemes[0];
    
    applyTheme(theme, isDark);
  }, []);

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
          <div className="absolute top-full right-0 mt-2 glass-panel py-3 px-4 z-50 w-72 animate-fade-in">
            {/* Day/Night Mode Toggle */}
            <div className="mb-4 pb-3 border-b border-border">
              <div className="text-xs text-muted-foreground mb-2">显示模式</div>
              <div className="flex gap-2">
                <button
                  onClick={toggleMode}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all",
                    !isDarkMode 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-sm">日间</span>
                </button>
                <button
                  onClick={toggleMode}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all",
                    isDarkMode 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-sm">夜间</span>
                </button>
              </div>
            </div>

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
                      className="w-4 h-4 rounded-full ring-1 ring-foreground/20"
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
                      className="w-4 h-4 rounded-full ring-1 ring-foreground/20"
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