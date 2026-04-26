import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Home, Plane, Store, ShoppingBag, User, MapPin, CreditCard, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { client } from '@/lib/api';
import { getAPIBaseURL } from '@/lib/config';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PaymentConfirmation from './PaymentConfirmation';

const LINE_URL = 'https://lin.ee/RK4aaeq';

interface CheckoutFormProps {
  onBack: () => void;
}

type ShippingMethod = 'home_tw' | 'home_overseas' | 'cvs_711';
type ShippingRegion = 'taiwan' | 'hk_mo' | 'overseas';

interface ShippingOption {
  id: ShippingMethod;
  title: string;
  subtitle: string;
  fee: number;
  feeLabel: string;
  icon: React.ReactNode;
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'cvs_711',
    title: '7-11 店到店取貨',
    subtitle: '台灣超商取貨，方便快速',
    fee: 60,
    feeLabel: 'NT$ 60',
    icon: <Store className="w-5 h-5" />,
  },
  {
    id: 'home_tw',
    title: '宅配到府（台灣）',
    subtitle: '台灣本島配送，專人送達',
    fee: 120,
    feeLabel: 'NT$ 120',
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: 'home_overseas',
    title: '港澳 / 海外宅配',
    subtitle: '港澳地區 NT$ 160 起，實際運費另計',
    fee: 160,
    feeLabel: 'NT$ 160 起',
    icon: <Plane className="w-5 h-5" />,
  },
];

type StepId = 'contact' | 'shipping' | 'payment' | 'review';

const STEPS: { id: StepId; title: string; icon: React.ElementType }[] = [
  { id: 'contact', title: '訂購資料', icon: User },
  { id: 'shipping', title: '取貨方式', icon: MapPin },
  { id: 'payment', title: '匯款確認', icon: CreditCard },
  { id: 'review', title: '確認送出', icon: FileCheck },
];

interface FormErrors {
  [key: string]: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onBack }) => {
  const { items, totalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [step, setStep] = useState<StepId>('contact');

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('cvs_711');
  const [overseasRegion, setOverseasRegion] = useState<ShippingRegion>('hk_mo');
  const [paymentLast5, setPaymentLast5] = useState('');
  const [paymentLater, setPaymentLater] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cvsStoreName: '',
    cvsStoreId: '',
    cvsStoreAddress: '',
    note: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const shippingFee = useMemo(() => {
    const option = SHIPPING_OPTIONS.find((o) => o.id === shippingMethod);
    return option ? option.fee : 0;
  }, [shippingMethod]);

  const grandTotal = totalAmount + shippingFee;

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Step-level validations
  const validateContactStep = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = '請填寫收件人姓名';
    if (!form.phone.trim()) {
      e.phone = '請填寫聯絡電話';
    } else if (!/^[\d\s\-+()]{7,20}$/.test(form.phone.trim())) {
      e.phone = '電話格式不正確';
    }
    if (!form.email.trim()) {
      e.email = '請填寫 Email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Email 格式不正確';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateShippingStep = (): boolean => {
    const e: FormErrors = {};
    if (shippingMethod === 'cvs_711') {
      if (!form.cvsStoreName.trim()) e.cvsStoreName = '請填寫 7-11 取貨門市名稱';
      if (!form.cvsStoreAddress.trim()) e.cvsStoreAddress = '請填寫 7-11 門市地址';
    } else {
      if (!form.address.trim()) e.address = '請填寫完整收件地址';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePaymentStep = (): boolean => {
    const e: FormErrors = {};
    if (!paymentLater) {
      if (!paymentLast5.trim()) {
        e.paymentLast5 = '請填寫匯款後五碼，或勾選「稍後匯款」';
      } else if (!/^\d{5}$/.test(paymentLast5.trim())) {
        e.paymentLast5 = '後五碼須為 5 位數字';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    let ok = true;
    if (step === 'contact') ok = validateContactStep();
    else if (step === 'shipping') ok = validateShippingStep();
    else if (step === 'payment') ok = validatePaymentStep();

    if (!ok) {
      toast.error('請先修正表單錯誤');
      return;
    }
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const goPrev = () => {
    const idx = currentStepIndex;
    if (idx > 0) setStep(STEPS[idx - 1].id);
    else onBack();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const userRes = await client.auth.me();
      if (!userRes?.data) {
        toast.error('請先登入後再結帳');
        await client.auth.toLogin();
        return;
      }

      const shippingRegion: ShippingRegion =
        shippingMethod === 'home_tw'
          ? 'taiwan'
          : shippingMethod === 'cvs_711'
            ? 'taiwan'
            : overseasRegion;

      const finalShippingAddress =
        shippingMethod === 'cvs_711'
          ? `[7-11店到店] ${form.cvsStoreName}${form.cvsStoreId ? ` (${form.cvsStoreId})` : ''} - ${form.cvsStoreAddress}`
          : form.address;

      const noteWithPayment = [
        form.note,
        paymentLater
          ? '[付款狀態] 顧客表示稍後匯款'
          : paymentLast5
            ? `[匯款後五碼] ${paymentLast5}`
            : '',
      ]
        .filter(Boolean)
        .join('\n');

      const orderRes = await client.entities.orders.create({
        data: {
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email,
          shipping_address: finalShippingAddress,
          note: noteWithPayment,
          total_amount: grandTotal,
          subtotal_amount: totalAmount,
          shipping_method: shippingMethod,
          shipping_region: shippingRegion,
          shipping_fee: shippingFee,
          cvs_store_id: shippingMethod === 'cvs_711' ? form.cvsStoreId : '',
          cvs_store_name: shippingMethod === 'cvs_711' ? form.cvsStoreName : '',
          cvs_store_address: shippingMethod === 'cvs_711' ? form.cvsStoreAddress : '',
          status: 'pending',
          payment_status: paymentLast5 && !paymentLater ? 'pending_review' : 'unpaid',
          payment_last5: paymentLast5 || '',
          created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
      });

      const newOrderId = orderRes.data?.id;

      for (const item of items) {
        await client.entities.order_items.create({
          data: {
            order_id: newOrderId,
            product_id: item.productId,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            custom_content: item.customContent || '',
            custom_image_key: item.customImageKey || '',
          },
        });
      }

      if (newOrderId) {
        try {
          await fetch(`${getAPIBaseURL()}/api/v1/entities/orders/${newOrderId}/notify`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (notifyErr) {
          console.warn('Email notification failed:', notifyErr);
        }
      }

      setOrderId(newOrderId);
      setOrderComplete(true);
      clearCart();
    } catch (err) {
      console.error(err);
      toast.error('訂單送出失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════
  // Order complete screen
  // ══════════════════════════════════════════════════
  if (orderComplete) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto py-2">
        <div className="text-center py-4 px-2">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
          <h3
            className="text-xl font-semibold mb-1"
            style={{ fontFamily: "'Noto Serif TC', serif" }}
          >
            訂單已送出！
          </h3>
          <p className="text-muted-foreground text-sm mb-1">
            訂單編號：<span className="font-mono font-semibold text-foreground">#{orderId}</span>
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            感謝您的訂購，以下為匯款資訊，完成匯款後專人將為您確認訂單。
          </p>
        </div>

        <div className="px-1 mb-4">
          <PaymentConfirmation orderId={orderId || undefined} orderAmount={grandTotal} />
        </div>

        {paymentLast5 && !paymentLater && (
          <div className="mx-1 mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-xs text-emerald-900">
              ✅ 您已提供匯款後五碼：
              <span className="font-mono font-semibold ml-1">{paymentLast5}</span>
              ，我們將於 1 個工作天內完成核對。
            </p>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // Stepper UI
  // ══════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Step indicator */}
      <div className="flex items-center justify-between px-1 pt-2 pb-4 border-b">
        {STEPS.map((s, idx) => {
          const active = s.id === step;
          const completed = idx < currentStepIndex;
          const Icon = s.icon;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    active && 'bg-foreground text-background ring-4 ring-foreground/10',
                    completed && 'bg-emerald-500 text-white',
                    !active && !completed && 'bg-muted text-muted-foreground'
                  )}
                >
                  {completed ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={cn(
                    'text-[10px] tracking-wider whitespace-nowrap',
                    active ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {s.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-[2px] mx-1 transition-colors',
                    idx < currentStepIndex ? 'bg-emerald-500' : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-4 px-0.5">
        {/* Summary card (always visible at top) */}
        <div className="bg-secondary/40 rounded-lg p-3 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              訂單摘要 · {items.length} 件商品
            </h4>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">商品小計</span>
              <span>NT$ {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">運費</span>
              <span>NT$ {shippingFee.toLocaleString()}</span>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-sm">
            <span>應付總額</span>
            <span className="text-primary">NT$ {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Step 1: Contact */}
        {step === 'contact' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <h3 className="text-base font-semibold" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              訂購人資料
            </h3>
            <div>
              <Label htmlFor="name" className="text-sm">
                收件人姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="請輸入姓名"
                className={cn('mt-1', errors.name && 'border-destructive')}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm">
                聯絡電話 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0912-345-678"
                className={cn('mt-1', errors.phone && 'border-destructive')}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-sm">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={cn('mt-1', errors.email && 'border-destructive')}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">
                訂單確認通知將寄送至此信箱
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Shipping */}
        {step === 'shipping' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <h3 className="text-base font-semibold" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              配送 / 取貨方式
            </h3>
            <RadioGroup
              value={shippingMethod}
              onValueChange={(v) => setShippingMethod(v as ShippingMethod)}
              className="space-y-2"
            >
              {SHIPPING_OPTIONS.map((option) => {
                const selected = shippingMethod === option.id;
                return (
                  <label
                    key={option.id}
                    htmlFor={`shipping-${option.id}`}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      selected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/30'
                    )}
                  >
                    <RadioGroupItem value={option.id} id={`shipping-${option.id}`} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn('flex-shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}>
                          {option.icon}
                        </span>
                        <span className="font-medium text-sm">{option.title}</span>
                        <span
                          className={cn(
                            'ml-auto flex-shrink-0 text-sm font-semibold',
                            selected ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          {option.feeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-7">{option.subtitle}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>

            {shippingMethod === 'home_overseas' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Label className="text-xs text-amber-900 font-medium mb-2 block">選擇配送地區</Label>
                <RadioGroup
                  value={overseasRegion}
                  onValueChange={(v) => setOverseasRegion(v as ShippingRegion)}
                  className="flex gap-4"
                >
                  <label htmlFor="region-hk" className="flex items-center gap-2 cursor-pointer text-sm">
                    <RadioGroupItem value="hk_mo" id="region-hk" />
                    港澳 (NT$ 160 起)
                  </label>
                  <label htmlFor="region-overseas" className="flex items-center gap-2 cursor-pointer text-sm">
                    <RadioGroupItem value="overseas" id="region-overseas" />
                    其他海外地區
                  </label>
                </RadioGroup>
                <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                  ⚠️ 實際運費將依收件地區、重量另計，送出訂單後將由專人與您確認最終金額。
                </p>
              </div>
            )}

            {/* 7-11 fields */}
            {shippingMethod === 'cvs_711' ? (
              <div className="space-y-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs text-emerald-900 font-medium flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  請填寫您希望取貨的 7-11 門市資訊
                </p>
                <div>
                  <Label htmlFor="cvsStoreName" className="text-sm">
                    門市名稱 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cvsStoreName"
                    name="cvsStoreName"
                    value={form.cvsStoreName}
                    onChange={handleChange}
                    placeholder="例：7-11 信義門市"
                    className={cn('mt-1 bg-white', errors.cvsStoreName && 'border-destructive')}
                  />
                  {errors.cvsStoreName && (
                    <p className="text-xs text-destructive mt-1">{errors.cvsStoreName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cvsStoreId" className="text-sm">
                    門市店號 <span className="text-muted-foreground">(選填)</span>
                  </Label>
                  <Input
                    id="cvsStoreId"
                    name="cvsStoreId"
                    value={form.cvsStoreId}
                    onChange={handleChange}
                    placeholder="例：123456"
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cvsStoreAddress" className="text-sm">
                    門市地址 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cvsStoreAddress"
                    name="cvsStoreAddress"
                    value={form.cvsStoreAddress}
                    onChange={handleChange}
                    placeholder="例：台北市信義區信義路五段7號"
                    className={cn('mt-1 bg-white', errors.cvsStoreAddress && 'border-destructive')}
                  />
                  {errors.cvsStoreAddress && (
                    <p className="text-xs text-destructive mt-1">{errors.cvsStoreAddress}</p>
                  )}
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  💡 可至{' '}
                  <a
                    href="https://emap.pcsc.com.tw/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    7-11 官方門市查詢
                  </a>{' '}
                  查詢您希望取貨的門市資訊。
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="address" className="text-sm">
                  收件地址 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder={
                    shippingMethod === 'home_tw'
                      ? '例：台北市大安區忠孝東路四段1號'
                      : '例：香港九龍尖沙咀彌敦道123號'
                  }
                  className={cn('mt-1', errors.address && 'border-destructive')}
                />
                {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
              </div>
            )}

            <div>
              <Label htmlFor="note" className="text-sm">
                備註
              </Label>
              <Textarea
                id="note"
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="有什麼想告訴我們的嗎？"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <h3 className="text-base font-semibold" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              匯款資訊
            </h3>
            <PaymentConfirmation
              orderAmount={grandTotal}
              last5={paymentLast5}
              onLast5Change={(v) => {
                setPaymentLast5(v);
                if (errors.paymentLast5) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.paymentLast5;
                    return next;
                  });
                }
              }}
              showLast5Input={!paymentLater}
              last5Error={errors.paymentLast5}
            />

            <label className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={paymentLater}
                onChange={(e) => {
                  setPaymentLater(e.target.checked);
                  if (e.target.checked) {
                    setPaymentLast5('');
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.paymentLast5;
                      return next;
                    });
                  }
                }}
                className="mt-1 accent-foreground"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">我稍後再匯款</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  您可以先送出訂單，完成匯款後再透過 LINE 通知我們匯款後五碼。
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <h3 className="text-base font-semibold" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              確認您的訂單
            </h3>

            <div className="space-y-3">
              <ReviewBlock title="訂購人" onEdit={() => setStep('contact')}>
                <div className="text-sm space-y-0.5">
                  <div>{form.name}</div>
                  <div className="text-muted-foreground">{form.phone}</div>
                  <div className="text-muted-foreground">{form.email}</div>
                </div>
              </ReviewBlock>

              <ReviewBlock title="配送方式" onEdit={() => setStep('shipping')}>
                <div className="text-sm space-y-0.5">
                  <div className="font-medium">
                    {SHIPPING_OPTIONS.find((o) => o.id === shippingMethod)?.title}
                  </div>
                  {shippingMethod === 'cvs_711' ? (
                    <div className="text-muted-foreground text-xs">
                      {form.cvsStoreName}
                      {form.cvsStoreId ? ` (${form.cvsStoreId})` : ''}
                      <br />
                      {form.cvsStoreAddress}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-xs">{form.address}</div>
                  )}
                  {form.note && (
                    <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-dashed">
                      備註：{form.note}
                    </div>
                  )}
                </div>
              </ReviewBlock>

              <ReviewBlock title="付款方式" onEdit={() => setStep('payment')}>
                <div className="text-sm">
                  <div className="font-medium">銀行轉帳</div>
                  {paymentLater ? (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      稍後匯款（送出訂單後透過 LINE 通知後五碼）
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      後五碼：
                      <span className="font-mono font-semibold text-foreground ml-1">
                        {paymentLast5}
                      </span>
                    </div>
                  )}
                </div>
              </ReviewBlock>

              <div className="p-3 rounded-lg border bg-secondary/40">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                  商品明細
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-0.5">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="flex-shrink-0">
                        NT$ {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">商品小計</span>
                  <span>NT$ {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">運費</span>
                  <span>NT$ {shippingFee.toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>應付總額</span>
                  <span className="text-primary">NT$ {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="border-t pt-3 pb-1 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={goPrev}
          className="!bg-transparent !hover:bg-transparent flex-shrink-0"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {currentStepIndex === 0 ? '購物車' : '上一步'}
        </Button>

        {step !== 'review' ? (
          <Button
            type="button"
            size="lg"
            onClick={goNext}
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
          >
            下一步
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
          >
            {loading ? '送出中...' : '確認送出訂單'}
            {!loading && <CheckCircle className="w-4 h-4 ml-1" />}
          </Button>
        )}
      </div>
    </div>
  );
};

// Review section block
const ReviewBlock: React.FC<{
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}> = ({ title, onEdit, children }) => (
  <div className="p-3 rounded-lg border bg-card">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{title}</h4>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-primary hover:underline"
      >
        修改
      </button>
    </div>
    {children}
  </div>
);

export default CheckoutForm;