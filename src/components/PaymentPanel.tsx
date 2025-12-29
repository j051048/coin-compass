import { Coins, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentToken } from '@/hooks/usePaymentGate';

interface PaymentPanelProps {
  isPaying: boolean;
  isConnected: boolean;
  onPay: (token: PaymentToken) => void;
  onConnect: () => void;
}

const paymentOptions: { token: PaymentToken; amount: string; label: string }[] = [
  { token: 'USDT', amount: '0.1', label: 'USDT' },
  { token: 'FLYDAO', amount: '5000', label: 'FLYDAO' },
  { token: 'OKB', amount: '0.001', label: 'OKB' },
];

export function PaymentPanel({ isPaying, isConnected, onPay, onConnect }: PaymentPanelProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <Coins className="w-4 h-4" />
          解锁 AI 分析 (3次)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          选择以下任一方式支付，即可解锁 3 次 AI 技术分析
        </p>
        
        {!isConnected ? (
          <Button 
            onClick={onConnect}
            className="w-full"
            variant="outline"
          >
            <Wallet className="w-4 h-4 mr-2" />
            连接钱包后支付
          </Button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {paymentOptions.map(({ token, amount, label }) => (
              <Button
                key={token}
                onClick={() => onPay(token)}
                disabled={isPaying}
                variant="outline"
                className="flex flex-col h-auto py-3 hover:bg-primary/10 hover:border-primary"
              >
                <span className="text-lg font-bold">{amount}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </Button>
            ))}
          </div>
        )}
        
        {isPaying && (
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            交易处理中，请稍候...
          </p>
        )}
        
        <p className="text-xs text-muted-foreground text-center">
          支付将在 X Layer 网络上进行
        </p>
      </CardContent>
    </Card>
  );
}
