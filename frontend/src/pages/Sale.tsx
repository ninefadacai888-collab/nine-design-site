import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';
import Layout from '@/components/Layout';

const LINE_URL = 'https://lin.ee/RK4aaeq';
const SALE_HERO_IMG = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msgsrkiaae4a.png';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  in_stock: boolean;
}

const Sale: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async (retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await client.entities.products.query({ limit: 50, sort: '-created_at' });
          const items = res.data?.items || [];
          // Show in-stock items as sale products
          setProducts(items.filter((p: Product) => p.in_stock));
          setLoading(false);
          return;
        } catch (e: unknown) {
          console.error(`Fetch sale products attempt ${attempt}/${retries} failed:`, e instanceof Error ? e.message : String(e));
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delay * attempt));
          } else {
            setLoading(false);
          }
        }
      }
    };
    fetchProducts();
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        <img src={SALE_HERO_IMG} alt="每月促銷" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <p className="text-[11px] text-white/60 tracking-[0.25em] uppercase mb-3">Monthly Sale</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">每月促銷</h1>
          <p className="text-white/70 text-sm md:text-base max-w-lg">精選優惠商品，限時特價中</p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">載入中...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">目前沒有促銷商品</p>
              <Link to="/shop" className="inline-flex items-center gap-1.5 mt-4 text-sm text-[#c4a882] hover:underline">
                前往商店
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-14">
                <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-2">Sale</p>
                <h2 className="text-3xl md:text-4xl font-bold">促銷商品</h2>
                <p className="text-muted-foreground mt-3">共 {products.length} 件促銷商品</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link key={product.id} to={`/shop/${product.id}`} className="group block">
                    <div className="aspect-square overflow-hidden bg-muted relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-3 left-3 bg-[#c4a882] text-white text-[11px] font-medium tracking-wide px-3 py-1">
                        SALE
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">NT$ {product.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* CTA */}
          <div className="mt-20 text-center">
            <p className="text-muted-foreground mb-4">想了解更多優惠？</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304z" />
                  </svg>
                  LINE 洽詢優惠
                </Button>
              </a>
              <Link to="/shop">
                <Button size="lg" variant="outline" className="!bg-transparent border-foreground/20 hover:bg-foreground hover:text-background">
                  瀏覽全部商品
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Sale;