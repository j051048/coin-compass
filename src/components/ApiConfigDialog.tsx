import { useState, useEffect } from 'react';
import { Settings, TestTube, Save, Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface LogEntry {
  timestamp: Date;
  type: 'info' | 'success' | 'error';
  message: string;
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://proxy.flydao.top/v1',
  apiKey: '',
  model: 'gemini-3.0-pro',
};

const STORAGE_KEY = 'kline-api-config';

export const getApiConfig = (): ApiConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load API config:', e);
  }
  return DEFAULT_CONFIG;
};

export const saveApiConfig = (config: ApiConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const ApiConfigDialog = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG);
  const [isTesting, setIsTesting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setConfig(getApiConfig());
  }, [open]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, { timestamp: new Date(), type, message }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleTest = async () => {
    if (!config.apiKey) {
      addLog('error', 'API Key 不能为空');
      return;
    }

    setIsTesting(true);
    addLog('info', `正在测试连接: ${config.baseUrl}`);
    addLog('info', `使用模型: ${config.model}`);

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'user', content: 'Hello, this is a test message. Reply with "OK" only.' }
          ],
          max_tokens: 10,
        }),
      });

      addLog('info', `HTTP 状态码: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        addLog('error', `请求失败: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      addLog('success', `连接成功！响应: ${JSON.stringify(data.choices?.[0]?.message?.content || data).slice(0, 100)}`);
      
      toast({
        title: '连接测试成功',
        description: 'API 配置有效',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      addLog('error', `连接失败: ${message}`);
      toast({
        title: '连接测试失败',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!config.baseUrl) {
      toast({
        title: '保存失败',
        description: 'Base URL 不能为空',
        variant: 'destructive',
      });
      return;
    }

    saveApiConfig(config);
    addLog('success', '配置已保存');
    toast({
      title: '保存成功',
      description: 'API 配置已保存到本地',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-trading-bull" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-trading-bear" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-primary/50" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-accent">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">API 配置</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl" className="text-sm text-muted-foreground">
              Base URL
            </Label>
            <Input
              id="baseUrl"
              value={config.baseUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="https://proxy.flydao.top/v1"
              className="bg-background border-border font-mono text-sm"
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm text-muted-foreground">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="输入你的 API Key"
              className="bg-background border-border font-mono text-sm"
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm text-muted-foreground">
              模型
            </Label>
            <Input
              id="model"
              value={config.model}
              onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
              placeholder="gemini-3.0-pro"
              className="bg-background border-border font-mono text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              测试连接
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              保存配置
            </Button>
          </div>

          {/* Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">日志</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                清空
              </Button>
            </div>
            <ScrollArea className="h-[150px] rounded-md border border-border bg-background/50 p-2">
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  暂无日志
                </p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-xs font-mono"
                    >
                      <span className="text-muted-foreground shrink-0">
                        [{formatTime(log.timestamp)}]
                      </span>
                      {getLogIcon(log.type)}
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-trading-bull'
                            : log.type === 'error'
                            ? 'text-trading-bear'
                            : 'text-foreground'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
