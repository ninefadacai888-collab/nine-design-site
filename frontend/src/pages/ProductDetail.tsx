import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { client } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

const LINE_URL = 'https://lin.ee/RK4aaeq';

const CUSTOM_PRODUCT_CATEGORIES = ['custom-gift', 'custom-car', 'custom-wedding'];

const categoryLabelMap: Record<string, string> = {
  camping: '露營專區',
  wedding: '婚禮小物',
  pet: '寵物相關',
  apparel: '衣著/團服',
  birthday: '生日送禮',
  printing: '各類印刷',
  seasonal: '節日限定',
  exclusive: '獨家設計',
  'custom-gift': '客製禮物',
  'custom-car': '客製汽車用品',
  'custom-wedding': '客製婚禮小物',
  custom: '客製專區',
};

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  specs: string;
  in_stock: boolean;
}

interface ParsedSpecs {
  [key: string]: string | string[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async (retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await client.entities.products.query({ limit: 50, sort: '-created_at' });
          const items: Product[] = res.data?.items || [];
          const found = items.find((p) => String(p.id) === id);
          if (found) {
            setProduct(found);
          } else {
            setNotFound(true);
          }
          setLoading(false);
          return;
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          console.error(`Fetch product attempt ${attempt}/${retries} failed:`, errMsg);
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delay * attempt));
          } else {
            setNotFound(true);
            setLoading(false);
          }
        }
      }
    };
    fetchProduct();
  }, [id]);

  const isCustomProduct = (p: Product) =>
    CUSTOM_PRODUCT_CATEGORIES.includes(p.category) || p.category === 'custom';

  const parseSpecs = (specsStr: string): ParsedSpecs => {
    try {
      return JSON.parse(specsStr);
    } catch {
      return {};
    }
  };

  const getCategoryLabel = (cat: string) => categoryLabelMap[cat] || cat;

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.image_url,
      specs: selectedSpecs,
      isCustom: isCustomProduct(product),
    });
    toast.success('已加入購物車');
  };

  if (loading) {
    return (
      <Layout>
        <section className="py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="space-y-4">
                <div className="h-4 w-24 bg-muted animate-pulse" />
                <div className="h-8 w-64 bg-muted animate-pulse" />
                <div className="h-4 w-full bg-muted animate-pulse" />
                <div className="h-4 w-3/4 bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (notFound || !product) {
    return (
      <Layout>
        <section className="py-24 md:py-32 text-center">
          <div className="max-w-md mx-auto px-6">
            <h1 className="text-2xl font-bold mb-4">找不到此商品</h1>
            <p className="text-muted-foreground mb-8">商品可能已下架或不存在。</p>
            <Button variant="outline" onClick={() => navigate('/shop')} className="!bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回商店
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const specs = parseSpecs(product.specs);
  const isCustom = isCustomProduct(product);

  return (
    <Layout>
      {/* Breadcrumb */}
      <section className="bg-white border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/shop" className="hover:text-foreground transition-colors">
              線上商店
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Detail */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {/* Image */}
            <div className="relative">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {isCustom && (
                <div className="absolute top-4 right-4 bg-[#c4a882] text-white text-xs font-medium px-3 py-1.5">
                  客製商品
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase">
                {getCategoryLabel(product.category)}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-6">{product.name}</h1>

              {/* Price or Custom Notice */}
              {isCustom ? (
                <div className="mb-6">
                  <div className="bg-amber-50 border border-amber-200 p-4 mb-6">
                    <p className="text-sm font-medium text-amber-800 mb-1">此為客製化商品</p>
                    <p className="text-xs text-amber-600">
                      需透過 LINE 與我們聯繫，告知需求後由專人報價。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-3xl font-bold mb-6">
                  NT$ {product.price.toLocaleString()}
                </div>
              )}

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>

              {/* Specs */}
              {Object.entries(specs).length > 0 && (
                <div className="space-y-4 mb-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    商品規格
                  </h3>
                  {Object.entries(specs).map(([key, value]) => {
                    if (!isCustom && Array.isArray(value) && value.length > 0) {
                      return (
                        <div key={key}>
                          <Label className="text-sm font-medium">{key}</Label>
                          <Select
                            value={selectedSpecs[key] || ''}
                            onValueChange={(v) =>
                              setSelectedSpecs((prev) => ({ ...prev, [key]: v }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={`請選擇${key}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {value.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground">{key}：</span>
                        <span>{Array.isArray(value) ? value.join('、') : value}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              {isCustom ? (
                <a
                  href={LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-auto"
                >
                  <Button size="lg" className="w-full bg-[#06C755] text-white hover:bg-[#06C755]/90">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                    </svg>
                    透過 LINE 諮詢客製內容
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              ) : (
                <div className="mt-auto space-y-4">
                  {/* Quantity */}
                  <div>
                    <Label className="text-sm">數量</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center border border-border hover:bg-muted transition-colors text-lg"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-medium text-lg">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center border border-border hover:bg-muted transition-colors text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={!product.in_stock}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      {product.in_stock ? '加入購物車' : '已售完'}
                    </Button>
                    <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" variant="outline" className="!bg-transparent">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                        </svg>
                        LINE
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Back to shop */}
              <button
                onClick={() => navigate('/shop')}
                className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
              >
                <ArrowLeft className="w-4 h-4" />
                返回商店
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;