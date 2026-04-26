import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { client } from '@/lib/api';

const BANK_INFO = {
  bankName: '請填入銀行名稱',
  bankCode: '請填入銀行代碼',
  accountName: '請填入戶名',
  accountNumber: '請填入匯款帳號',
};

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    lineId: '',
    note: '',
    recipientName: '',
    recipientPhone: '',
    storeName: '',
    storeId: '',
    storeAddress: '',
    paymentLast5: '',
  });

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitOrder = async () => {
    if (!form.name || !form.phone || !form.email || !form.paymentLast5) {
      alert('請填寫姓名、電話、Email 與匯款帳號末五碼');
      return;
    }

    if (!items.length) {
      alert('購物車是空的');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        line_id: form.lineId,
        note: form.note,
        items: JSON.stringify(items),
        total_amount: total,
        payment_method: 'bank_transfer',
        payment_status: 'pending_verify',
        payment_last5: form.paymentLast5,
        shipping_method: '7-11_store_pickup',
        cvs_store_id: form.storeId,
        cvs_store_name: form.storeName,
        cvs_store_address: form.storeAddress,
        recipient_name: form.recipientName,
        recipient_phone: form.recipientPhone,
        order_status: 'pending',
      };

      const res = await client.entities.orders.create(orderPayload);
      const createdOrder = res.data;

      try {
        await client.request({
          method: 'POST',
          url: `/api/v1/entities/orders/${createdOrder.id}/notify`,
        });
      } catch (emailError) {
        console.warn('Email 通知失敗，但訂單已建立', emailError);
      }

      setOrderNumber(createdOrder.order_number || String(createdOrder.id));
      clearCart();
    } catch (error) {
      console.error(error);
      alert('訂單送出失敗，請稍後再試或聯絡我們。');
    } finally {
      setLoading(false);
    }
  };

  if (orderNumber) {
    return (
      <main className="min-h-screen px-6 py-24 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold">訂單已送出</h1>
        <p className="mt-4 text-muted-foreground">
          您的訂單編號為：{orderNumber}
        </p>

        <div className="mt-8 border p-6 text-left">
          <h2 className="font-bold mb-4">匯款資訊</h2>
          <p>銀行名稱：{BANK_INFO.bankName}</p>
          <p>銀行代碼：{BANK_INFO.bankCode}</p>
          <p>戶名：{BANK_INFO.accountName}</p>
          <p>匯款帳號：{BANK_INFO.accountNumber}</p>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          我們收到款項並核對末五碼後，會更新訂單狀態。
        </p>

        <Link to="/shop">
          <Button className="mt-8">回到商店</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-24 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-10">結帳</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4">訂購人資料</h2>
            <div className="space-y-3">
              <input className="w-full border p-3" placeholder="姓名 *" value={form.name} onChange={(e) => update('name', e.target.value)} />
              <input className="w-full border p-3" placeholder="電話 *" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              <input className="w-full border p-3" placeholder="Email *" value={form.email} onChange={(e) => update('email', e.target.value)} />
              <input className="w-full border p-3" placeholder="LINE ID" value={form.lineId} onChange={(e) => update('lineId', e.target.value)} />
              <textarea className="w-full border p-3" placeholder="備註" value={form.note} onChange={(e) => update('note', e.target.value)} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">7-11 店到店資訊</h2>
            <div className="space-y-3">
              <input className="w-full border p-3" placeholder="收件人姓名" value={form.recipientName} onChange={(e) => update('recipientName', e.target.value)} />
              <input className="w-full border p-3" placeholder="收件人電話" value={form.recipientPhone} onChange={(e) => update('recipientPhone', e.target.value)} />
              <input className="w-full border p-3" placeholder="7-11 門市名稱" value={form.storeName} onChange={(e) => update('storeName', e.target.value)} />
              <input className="w-full border p-3" placeholder="7-11 門市店號" value={form.storeId} onChange={(e) => update('storeId', e.target.value)} />
              <input className="w-full border p-3" placeholder="7-11 門市地址" value={form.storeAddress} onChange={(e) => update('storeAddress', e.target.value)} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">付款資訊</h2>
            <div className="border p-5 mb-4">
              <p>付款方式：銀行轉帳</p>
              <p>銀行名稱：{BANK_INFO.bankName}</p>
              <p>銀行代碼：{BANK_INFO.bankCode}</p>
              <p>戶名：{BANK_INFO.accountName}</p>
              <p>匯款帳號：{BANK_INFO.accountNumber}</p>
            </div>
            <input
              className="w-full border p-3"
              placeholder="匯款帳號末五碼 *"
              value={form.paymentLast5}
              onChange={(e) => update('paymentLast5', e.target.value)}
            />
          </div>
        </section>

        <aside className="border p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">訂單明細</h2>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>NT$ {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-6 pt-6 flex justify-between font-bold">
            <span>總金額</span>
            <span>NT$ {total.toLocaleString()}</span>
          </div>

          <Button className="w-full mt-6" disabled={loading} onClick={submitOrder}>
            {loading ? '送出中...' : '送出訂單'}
          </Button>
        </aside>
      </div>
    </main>
  );
};

export default Checkout;
