import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';
import Layout from '@/components/Layout';

const LINE_URL = 'https://lin.ee/RK4aaeq';
const CUSTOM_IMG = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msftneyaae4q.png';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

const CUSTOM_CATEGORIES = ['custom-gift', 'custom-car', 'custom-wedding', 'custom'];

const steps = [
  {
    num: '01',
    title: '告訴我們你的想法',
    desc: '透過 LINE 描述你想要的客製內容、用途與數量。',
  },
  {
    num: '02',
    title: '設計提案與報價',
    desc: '我們會根據需求提供設計草稿與詳細報價。',
  },
  {
    num: '03',
    title: '確認製作與交付',
    desc: '確認設計後進入製作，完成後安排出貨。',
  },
];

const Custom: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async (retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await client.entities.products.query({ limit: 50, sort: '-created_at' });
          const items = res.data?.items || [];
          setProducts(items.filter((p: Product) => CUSTOM_CATEGORIES.includes(p.category)));
          return;
        } catch (e: unknown) {
          console.error(`Fetch custom products attempt ${attempt}/${retries} failed:`, e instanceof Error ? e.message : String(e));
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delay * attempt));
          }
        }
      }
    };
    fetchProducts();
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src={CUSTOM_IMG}
          alt="客製化設計"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <p className="text-white/60 text-[11px] tracking-[0.2em] uppercase mb-3">Custom</p>
          <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold">客製化專區</h1>
          <p className="text-white/70 mt-4 text-base md:text-lg font-light">
            從想法到成品，為你量身打造
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold">客製流程</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="text-center">
                <div className="text-4xl font-bold text-[#c4a882] mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block w-5 h-5 text-muted-foreground/30 mx-auto mt-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Products */}
      {products.length > 0 && (
        <section className="py-24 md:py-32 bg-[#fafaf8]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-3">Examples</p>
              <h2 className="text-3xl md:text-4xl font-bold">客製範例</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((product) => (
                <div key={product.id} className="group">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 md:py-32 bg-[#1a1a1a] text-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-5">
            有想法？讓我們一起實現
          </h2>
          <p className="text-white/50 leading-relaxed mb-8">
            無論是企業禮品、活動周邊或個人客製，<br />
            歡迎透過 LINE 與我們聊聊。
          </p>
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-[#1a1a1a] hover:bg-white/90">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
              </svg>
              LINE 諮詢客製需求
            </Button>
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default Custom;