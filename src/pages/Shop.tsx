import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, ShoppingBag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { client } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  specs: string;
  in_stock: boolean;
  is_hot: boolean;
  is_sale: boolean;
}

/* ── Category definitions ── */

type MainTab = 'all' | 'camping' | 'exclusive' | 'custom';

const ALL_SUBCATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'wedding', label: '婚禮小物' },
  { value: 'pet', label: '寵物相關' },
  { value: 'apparel', label: '衣著/團服' },
  { value: 'birthday', label: '生日送禮' },
  { value: 'printing', label: '各類印刷' },
  { value: 'seasonal', label: '節日限定' },
] as const;

const CUSTOM_SUBCATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'custom-gift', label: '客製禮物' },
  { value: 'custom-car', label: '客製汽車用品' },
  { value: 'custom-wedding', label: '客製婚禮小物' },
] as const;

const ALL_PRODUCT_CATEGORIES = ['wedding', 'pet', 'apparel', 'birthday', 'printing', 'seasonal'];
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

/* ── Shop page ── */
const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>('all');
  const [subCategory, setSubCategory] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<string>('newest');

  useEffect(() => {
    const fetchProducts = async (retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await client.entities.products.query({ limit: 50, sort: '-created_at' });
          setProducts(res.data?.items || []);
          setLoading(false);
          return;
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          console.error(`Fetch products attempt ${attempt}/${retries} failed:`, errMsg);
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delay * attempt));
          } else {
            toast.error('商品載入失敗，請稍後重新整理頁面再試');
            setLoading(false);
          }
        }
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    setSubCategory('all');
  }, [mainTab]);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.ceil(Math.max(...products.map((p) => p.price)) / 100) * 100;
  }, [products]);

  useEffect(() => {
    if (products.length > 0) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice, products.length]);

  const isCustomProduct = (product: Product) => {
    return CUSTOM_PRODUCT_CATEGORIES.includes(product.category) || product.category === 'custom';
  };

  const filtered = useMemo(() => {
    let result = products;

    switch (mainTab) {
      case 'all':
        result = result.filter((p) => ALL_PRODUCT_CATEGORIES.includes(p.category));
        break;
      case 'camping':
        result = result.filter((p) => p.category === 'camping');
        break;
      case 'exclusive':
        result = result.filter((p) => p.category === 'exclusive');
        break;
      case 'custom':
        result = result.filter((p) => CUSTOM_PRODUCT_CATEGORIES.includes(p.category) || p.category === 'custom');
        break;
    }

    if (subCategory !== 'all') {
      result = result.filter((p) => p.category === subCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    const sorted = [...result];
    switch (sortOption) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return sorted;
  }, [products, mainTab, subCategory, searchQuery, priceRange, sortOption]);

  const clearSearch = () => setSearchQuery('');

  const resetFilters = () => {
    setSearchQuery('');
    setPriceRange([0, maxPrice]);
    setSortOption('newest');
    setSubCategory('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || priceRange[0] > 0 || priceRange[1] < maxPrice || sortOption !== 'newest';

  const getCategoryLabel = (cat: string) => categoryLabelMap[cat] || cat;

  const currentSubcategories = mainTab === 'all' ? ALL_SUBCATEGORIES : mainTab === 'custom' ? CUSTOM_SUBCATEGORIES : [];

  const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.image_url,
      isCustom: isCustomProduct(product),
    });
    toast.success(`已將「${product.name}」加入購物車`);
  };

  return (
    <Layout>
      {/* Products */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-[#fafaf8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-white border border-border">
                <TabsTrigger value="all">所有商品</TabsTrigger>
                <TabsTrigger value="camping">露營專區</TabsTrigger>
                <TabsTrigger value="exclusive">獨家設計</TabsTrigger>
                <TabsTrigger value="custom">客製專區</TabsTrigger>
              </TabsList>
            </div>

            {/* Custom Notice */}
            {mainTab === 'custom' && (
              <div className="mb-6 bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">客製專區商品皆需透過 LINE 諮詢</p>
                  <p className="text-xs text-amber-600 mt-1">
                    客製化商品無法直接下單，請點擊商品後透過 LINE 與我們聯繫，由專人為您服務。
                  </p>
                </div>
              </div>
            )}

            {/* Subcategory Pills */}
            {currentSubcategories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {currentSubcategories.map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() => setSubCategory(sub.value)}
                    className={`px-4 py-1.5 text-sm transition-all ${
                      subCategory === sub.value
                        ? 'bg-foreground text-background'
                        : 'bg-white text-muted-foreground border border-border hover:text-foreground'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search & Filter */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="搜尋商品名稱或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 bg-white border-border h-11"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`shrink-0 gap-2 !bg-white ${showFilters ? 'border-foreground text-foreground' : ''}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  價格篩選
                </Button>

                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-[160px] shrink-0 bg-white border-border h-11">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="排序方式" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新上架</SelectItem>
                    <SelectItem value="price-asc">價格低到高</SelectItem>
                    <SelectItem value="price-desc">價格高到低</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    清除
                  </Button>
                )}
              </div>

              {/* Price Range */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  showFilters ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="bg-white border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">價格範圍</Label>
                    <span className="text-sm text-muted-foreground">
                      NT$ {priceRange[0].toLocaleString()} — NT$ {priceRange[1].toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={maxPrice}
                    step={100}
                    value={priceRange}
                    onValueChange={(val) => setPriceRange(val as [number, number])}
                    className="w-full"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground">
                  找到 {filtered.length} 件商品
                </p>
              )}
            </div>

            {/* Product Grid */}
            <TabsContent value={mainTab} className="mt-0">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((product) => {
                    const isCustom = isCustomProduct(product);
                    return (
                      <div key={product.id} className="group">
                        {/* Clickable image area → navigate to detail */}
                        <button
                          onClick={() => navigate(`/shop/${product.id}`)}
                          className="w-full text-left block"
                        >
                          <div className="aspect-square overflow-hidden bg-muted relative">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                            />
                            {isCustom && (
                              <div className="absolute top-3 right-3 bg-[#c4a882] text-white text-xs font-medium px-2.5 py-1">
                                客製商品
                              </div>
                            )}
                            {!product.in_stock && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white text-sm font-medium tracking-wider">已售完</span>
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Product info + add to cart */}
                        <div className="mt-4 flex items-start justify-between gap-3">
                          <button
                            onClick={() => navigate(`/shop/${product.id}`)}
                            className="text-left flex-1 min-w-0"
                          >
                            <p className="text-[11px] text-muted-foreground tracking-[0.15em] uppercase">
                              {getCategoryLabel(product.category)}
                            </p>
                            <h3 className="text-base font-semibold mt-1 truncate">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{product.description}</p>
                            <div className="mt-2">
                              {isCustom ? (
                                <span className="text-sm text-[#c4a882] font-medium">需 LINE 詢價</span>
                              ) : (
                                <span className="text-base font-bold">
                                  NT$ {product.price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Quick add to cart button */}
                          {!isCustom && product.in_stock && (
                            <button
                              onClick={(e) => handleQuickAddToCart(e, product)}
                              className="mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center border border-border bg-white hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200"
                              aria-label={`加入 ${product.name} 到購物車`}
                              title="加入購物車"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  {hasActiveFilters ? (
                    <div>
                      <p className="mb-3">找不到符合條件的商品</p>
                      <Button variant="outline" onClick={resetFilters} className="!bg-transparent">
                        清除所有篩選條件
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">此分類尚無商品</p>
                      <p className="text-sm">我們正在準備更多精彩商品，敬請期待！</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Shop;