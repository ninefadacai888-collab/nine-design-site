import { useState } from "react";

const Checkout = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    store: "",
    accountLast5: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.email || !form.accountLast5) {
      alert("請填寫完整資料");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        import.meta.env.VITE_API_BASE_URL + "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) throw new Error("下單失敗");

      setSuccess(true);
    } catch (err) {
      alert("送出失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">訂單已送出</h1>
          <p className="mt-4">我們會盡快與您確認訂單</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-8">結帳資訊</h1>

      <div className="space-y-4">
        <input
          name="name"
          placeholder="姓名"
          onChange={handleChange}
          className="w-full border p-3"
        />

        <input
          name="phone"
          placeholder="電話"
          onChange={handleChange}
          className="w-full border p-3"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full border p-3"
        />

        <input
          name="store"
          placeholder="7-11 取貨門市"
          onChange={handleChange}
          className="w-full border p-3"
        />

        <input
          name="accountLast5"
          placeholder="匯款帳號末五碼"
          onChange={handleChange}
          className="w-full border p-3"
        />

        <div className="bg-gray-100 p-4 mt-6">
          <p>請匯款至以下帳戶：</p>
          <p className="mt-2 font-bold">銀行：XXX銀行</p>
          <p>帳號：123-456-789</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-3 mt-6"
        >
          {loading ? "送出中..." : "確認下單"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
