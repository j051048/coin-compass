import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { POPULAR_SYMBOLS } from '@/types/trading';
import { searchSymbols } from '@/lib/binanceApi';

interface SymbolSearchProps {
  value: string;
  onChange: (symbol: string) => void;
}

export function SymbolSearch({ value, onChange }: SymbolSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query) {
        setSuggestions(POPULAR_SYMBOLS);
        return;
      }
      
      setIsLoading(true);
      try {
        const results = await searchSymbols(query);
        setSuggestions(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 glass-panel px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onFocus={() => setIsOpen(true)}
          placeholder={value || '搜索交易对...'}
          className="bg-transparent border-none outline-none text-sm font-mono w-32 placeholder:text-muted-foreground"
        />
        {value && (
          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded font-mono">
            {value}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel py-2 z-50 max-h-64 overflow-y-auto scrollbar-thin animate-fade-in">
          {!query && (
            <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              热门交易对
            </div>
          )}
          
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">加载中...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">未找到交易对</div>
          ) : (
            suggestions.map((symbol) => (
              <button
                key={symbol}
                onClick={() => handleSelect(symbol)}
                className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-accent/50 transition-colors flex items-center justify-between group"
              >
                <span>{symbol}</span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  选择
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
