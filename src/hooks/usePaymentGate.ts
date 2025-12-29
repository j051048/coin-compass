import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useSendTransaction } from 'wagmi';
import { parseUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';

// Token contract addresses on X Layer
const USDT_ADDRESS = '0x1E4a5963aBFD975d8c9021ce480b42188849D41d' as const;
const FLYDAO_ADDRESS = '0xbcb009e1a796363629b958802cb622e53bfd7db9' as const;
const RECEIVER_ADDRESS = '0xd86d0fed278cd70e2ba9bdb2b9811cede825a558' as const;

// Payment amounts
const USDT_AMOUNT = '0.1'; // 0.1 USDT
const FLYDAO_AMOUNT = '5000'; // 5000 FLYDAO
const OKB_AMOUNT = '0.001'; // 0.001 OKB

// X Layer chain ID
const X_LAYER_CHAIN_ID = 196;

// ERC20 transfer ABI
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  }
] as const;

// Storage keys
const USAGE_KEY = 'ai_analysis_usage';
const FREE_USES = 3;
const PAID_USES = 3;

interface UsageData {
  freeUsesRemaining: number;
  paidUsesRemaining: number;
  lastReset: number;
}

const getDefaultUsage = (): UsageData => ({
  freeUsesRemaining: FREE_USES,
  paidUsesRemaining: 0,
  lastReset: Date.now(),
});

const loadUsage = (): UsageData => {
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    if (!stored) return getDefaultUsage();
    
    const data = JSON.parse(stored) as UsageData;
    // Reset if it's a new day
    const storedDate = new Date(data.lastReset);
    const today = new Date();
    if (storedDate.toDateString() !== today.toDateString()) {
      return getDefaultUsage();
    }
    return data;
  } catch {
    return getDefaultUsage();
  }
};

const saveUsage = (data: UsageData) => {
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save usage data:', e);
  }
};

export type PaymentToken = 'USDT' | 'FLYDAO' | 'OKB';

export function usePaymentGate() {
  const [usage, setUsage] = useState<UsageData>(loadUsage);
  const [isPaying, setIsPaying] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();
  
  const { address, isConnected, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { toast } = useToast();
  
  const { isSuccess: txSuccess, isLoading: txLoading } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  // Check if user can use the feature
  const canUse = usage.freeUsesRemaining > 0 || usage.paidUsesRemaining > 0;
  const needsPayment = usage.freeUsesRemaining === 0 && usage.paidUsesRemaining === 0;
  const remainingUses = usage.freeUsesRemaining + usage.paidUsesRemaining;
  const isOnCorrectChain = chain?.id === X_LAYER_CHAIN_ID;

  // Handle successful transaction
  useEffect(() => {
    if (txSuccess && pendingTxHash) {
      // Unlock paid uses
      const newUsage = {
        ...usage,
        paidUsesRemaining: usage.paidUsesRemaining + PAID_USES,
      };
      setUsage(newUsage);
      saveUsage(newUsage);
      setPendingTxHash(undefined);
      setIsPaying(false);
      
      toast({
        title: '支付成功',
        description: `已解锁 ${PAID_USES} 次 AI 分析`,
      });
    }
  }, [txSuccess, pendingTxHash, usage, toast]);

  // Consume one use
  const consumeUse = useCallback(() => {
    if (!canUse) return false;
    
    const newUsage = { ...usage };
    if (newUsage.freeUsesRemaining > 0) {
      newUsage.freeUsesRemaining--;
    } else if (newUsage.paidUsesRemaining > 0) {
      newUsage.paidUsesRemaining--;
    }
    
    setUsage(newUsage);
    saveUsage(newUsage);
    return true;
  }, [usage, canUse]);

  // Pay with token
  const payWithToken = useCallback(async (token: PaymentToken) => {
    if (!isConnected || !address) {
      toast({
        title: '请先连接钱包',
        description: '需要连接钱包才能付款',
        variant: 'destructive',
      });
      return;
    }

    // Check if on correct chain
    if (!isOnCorrectChain) {
      try {
        await switchChainAsync({ chainId: X_LAYER_CHAIN_ID });
      } catch (error) {
        toast({
          title: '网络切换失败',
          description: '请手动切换到 X Layer 网络',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsPaying(true);
    
    try {
      let hash: `0x${string}`;
      
      if (token === 'OKB') {
        // Native token transfer
        hash = await sendTransactionAsync({
          to: RECEIVER_ADDRESS,
          value: parseUnits(OKB_AMOUNT, 18),
        });
      } else {
        // ERC20 token transfer
        const tokenAddress = token === 'USDT' ? USDT_ADDRESS : FLYDAO_ADDRESS;
        const amount = token === 'USDT' ? USDT_AMOUNT : FLYDAO_AMOUNT;
        const decimals = token === 'USDT' ? 6 : 18; // USDT is typically 6 decimals
        
        hash = await writeContractAsync({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [RECEIVER_ADDRESS, parseUnits(amount, decimals)],
        } as any);
      }
      
      setPendingTxHash(hash);
      
      toast({
        title: '交易已提交',
        description: '正在等待区块确认...',
      });
      
    } catch (error: any) {
      setIsPaying(false);
      console.error('Payment error:', error);
      
      let errorMessage = '请稍后重试';
      if (error.message?.includes('rejected') || error.message?.includes('denied')) {
        errorMessage = '用户取消了交易';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = '余额不足';
      }
      
      toast({
        title: '支付失败',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [isConnected, address, isOnCorrectChain, switchChainAsync, writeContractAsync, sendTransactionAsync, toast]);

  return {
    canUse,
    needsPayment,
    remainingUses,
    freeRemaining: usage.freeUsesRemaining,
    paidRemaining: usage.paidUsesRemaining,
    isPaying: isPaying || txLoading,
    isConnected,
    isOnCorrectChain,
    consumeUse,
    payWithToken,
  };
}
