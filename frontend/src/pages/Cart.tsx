import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

const Cart = () => {
  const { items, updateQuantity, removeItem, total } = useCart();

  if (!items || items.length === 0) {
    return (
      <main className="min-h-screen px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">購物車</h1>
        <p className="mt-4 text-muted-foreground">購物車目前是空的。</p>
        <Link to="/shop">
          <Button className="mt-8">回到線上商店</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-24 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-10">購物車</h1>

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="border p-5 flex gap-5 items-center">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-24 h-24 object-cover bg-muted"
            />

            <div className="flex-1">
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-sm text-muted-foreground">
                NT$ {item.price.toLocaleString()}
              </p>

              <div className="flex items-center gap-3 mt-4">
                <button
                  className="border px-3 py-1"
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="border px-3 py-1"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="text-sm text-red-500"
              onClick={() => removeItem(item.id)}
            >
              移除
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t pt-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">訂單總金額</p>
          <p className="text-2xl font-bold">NT$ {total.toLocaleString()}</p>
        </div>

        <Link to="/checkout">
          <Button size="lg">前往結帳</Button>
        </Link>
      </div>
    </main>
  );
};

export default Cart;
