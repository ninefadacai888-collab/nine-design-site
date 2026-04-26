import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LINE_URL = 'https://lin.ee/RK4aaeq';

// Payment info (brand-controlled). Can later be managed from admin settings.
export const PAYMENT_INFO = {
  bankName: '玉山銀行',
  bankCode: '808',
  accountName: '廿設計工作室',
  accountNumber: '0000-000-000000',
};

interface PaymentConfirmationProps {
  orderId?: number | string;
  orderAmount: number;
  last5?: string;
  onLast5Change?: (v: string) => void;
  showLast5Input?: boolean;
  last5Error?: string;
  variant?: 'compact' | 'full';
}

const CopyButton: React.FC<{ value: string; label?: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`已複製${label ? ` ${label}` : ''}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('複製失敗');
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      aria-label="複製"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? '已複製' : '複製'}
    </button>
  );
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean; copyable?: boolean }> = ({
  label,
  value,
  mono,
  copyable,
}) => (
  <div className="flex items-center justify-between gap-3 py-2.5 border-b border-dashed border-[#c4a882]/30 last:border-0">
    <span className="text-xs text-muted-foreground tracking-wider">{label}</span>
    <div className="flex items-center gap-2">
      <span className={cn('text-sm text-foreground', mono && 'font-mono tracking-wide')}>{value}</span>
      {copyable && <CopyButton value={value} label={label} />}
    </div>
  </div>
);

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  orderId,
  orderAmount,
  last5 = '',
  onLast5Change,
  showLast5Input = false,
  last5Error,
  variant = 'full',
}) => {
  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-[#faf8f3] to-[#f5f1e8] border border-[#c4a882]/40 rounded-xl overflow-hidden',
        variant === 'full' ? 'p-6' : 'p-4'
      )}
    >
      {/* Corner ornaments (subtle brand touch) */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#c4a882]/60 rounded-tl-xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#c4a882]/60 rounded-br-xl" />

      {/* Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c4a882]/15 rounded-full mb-3">
          <span className="w-1.5 h-1.5 bg-[#c4a882] rounded-full" />
          <span className="text-[10px] tracking-[0.2em] text-[#8a6d3b] font-medium uppercase">
            Payment Confirmation
          </span>
        </div>
        <h3
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          匯款資訊
        </h3>
        <p className="text-xs text-muted-foreground mt-1">請依下列資訊完成匯款，並填寫後五碼以利核對</p>
      </div>

      {/* Order Summary */}
      {(orderId || orderAmount) && (
        <div className="bg-white/60 rounded-lg px-4 py-3 mb-4 border border-[#c4a882]/20">
          {orderId && (
            <InfoRow label="訂單編號" value={`#${orderId}`} mono copyable />
          )}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs text-muted-foreground tracking-wider">應匯款金額</span>
            <span className="text-xl font-bold text-[#8a6d3b]" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              NT$ {orderAmount.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Bank info */}
      <div className="bg-white/60 rounded-lg px-4 py-2 mb-4 border border-[#c4a882]/20">
        <InfoRow label="銀行名稱" value={PAYMENT_INFO.bankName} />
        <InfoRow label="銀行代碼" value={PAYMENT_INFO.bankCode} mono copyable />
        <InfoRow label="戶名" value={PAYMENT_INFO.accountName} />
        <InfoRow label="匯款帳號" value={PAYMENT_INFO.accountNumber} mono copyable />
      </div>

      {/* Last 5 digits input */}
      {showLast5Input && onLast5Change && (
        <div className="mb-4">
          <Label htmlFor="payment-last5" className="text-sm font-medium mb-1.5 block">
            匯款後五碼 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="payment-last5"
            value={last5}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
              onLast5Change(val);
            }}
            placeholder="請輸入匯款帳號後五碼"
            className={cn(
              'bg-white font-mono tracking-widest text-center text-base',
              last5Error && 'border-destructive focus-visible:ring-destructive/30'
            )}
            inputMode="numeric"
            maxLength={5}
          />
          {last5Error && <p className="text-xs text-destructive mt-1">{last5Error}</p>}
          <p className="text-xs text-muted-foreground mt-1.5">
            💡 若尚未匯款可先送出訂單，之後再透過 LINE 告知我們後五碼。
          </p>
        </div>
      )}

      {/* Reminder */}
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg px-4 py-3 mb-4">
        <p className="text-xs text-amber-900 leading-relaxed">
          ⏱ 完成匯款後，我們將由專人<strong>人工核對款項</strong>並更新訂單狀態，通常於
          <strong> 1 個工作天內</strong>完成確認。若超過 3 天未收到通知，歡迎透過 LINE 與我們聯繫。
        </p>
      </div>

      {/* LINE contact */}
      <a
        href={LINE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-[#06C755] text-white rounded-lg hover:bg-[#06C755]/90 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
        </svg>
        透過 LINE 聯絡我們
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

export default PaymentConfirmation;