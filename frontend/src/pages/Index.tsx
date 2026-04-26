import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { client } from '@/lib/api';
import Layout from '@/components/Layout';
import PopupBanner from '@/components/PopupBanner';

const LINE_URL = 'https://lin.ee/RK4aaeq';

/* ── Default Images (fallback when site_settings has no custom image) ── */
const DEFAULT_CUSTOM_PRODUCT_IMG = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msftneyaae4q.png';
const DEFAULT_CUSTOM_CTA_IMG = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msftkvaaae3a.png';
const DEFAULT_EXCLUSIVE_DESIGN_IMG = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msgso7iaae4q.png';
const DEFAULT_ABOUT_VIDEO_COVER = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msftkliaae4a.png';

/* Bucket where AdminSiteImages stores its uploads */
const SITE_IMAGES_BUCKET = 'site-images';

/* ── Interfaces ── */
interface Banner {
  id: number;
  title: string;
  image_url: string;
  mobile_image_url?: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  in_stock: boolean;
  is_hot: boolean;
  is_sale: boolean;
}

interface PortfolioCase {
  id: number;
  title: string;
  category: string;
  cover_image: string;
  client_name: string;
  year: string;
}

interface DesignCombo {
  id: number;
  name: string;
  description: string;
  items: string;
  original_price: number;
  sale_price: number;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

interface SiteSetting {
  id: number;
  setting_key: string;
  setting_value: string;
}

/* ── Default Banner Images (fallback only; each Banner is fully independent and can be replaced via /admin/banners with any URL) ── */
const STATIC_BANNERS: Banner[] = [
  { id: -1, title: 'Banner 1', image_url: '/assets/banners/banner-1.png', link_url: '', sort_order: 1, is_active: true },
  { id: -2, title: 'Banner 2', image_url: '/assets/banners/banner-2.png', link_url: '', sort_order: 2, is_active: true },
  { id: -3, title: 'Banner 3', image_url: '/assets/banners/banner-3.png', link_url: '', sort_order: 3, is_active: true },
  { id: -4, title: 'Banner 4', image_url: '/assets/banners/banner-4.png', link_url: '', sort_order: 4, is_active: true },
];

const categoryLabel: Record<string, string> = {
  cis: 'CIS 品牌識別',
  commercial: '商業空間',
  custom: '客製設計',
  'custom-case': '客製化案例',
};

/* ── Unified Product Card ── */
const ProductCard: React.FC<{ product: Product; badge?: string }> = ({ product, badge }) => (
  <Link to={`/shop/${product.id}`} className="group block">
    <div className="aspect-square overflow-hidden bg-muted relative">
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
      />
      {badge && (
        <div className="absolute top-3 left-3 bg-[#c4a882] text-white text-[11px] font-medium tracking-wide px-3 py-1">
          {badge}
        </div>
      )}
    </div>
    <div className="mt-4">
      <h3 className="text-sm font-semibold">{product.name}</h3>
      <p className="text-sm text-muted-foreground mt-1">NT$ {product.price.toLocaleString()}</p>
    </div>
  </Link>
);

/* ── Unified Case Card ── */
const CaseCard: React.FC<{ c: PortfolioCase }> = ({ c }) => (
  <Link to="/portfolio" className="group block">
    <div className="aspect-[4/3] overflow-hidden bg-muted">
      <img
        src={c.cover_image}
        alt={c.title}
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
      />
    </div>
    <div className="mt-4">
      <p className="text-[11px] text-muted-foreground tracking-[0.15em] uppercase">
        {categoryLabel[c.category] || c.category}
      </p>
      <h3 className="text-sm font-semibold mt-1">{c.title}</h3>
    </div>
  </Link>
);

/* ── Design Combo Card ── */
const ComboCard: React.FC<{ combo: DesignCombo }> = ({ combo }) => {
  const parseItems = (itemsStr: string): string[] => {
    try {
      return JSON.parse(itemsStr);
    } catch {
      return itemsStr ? itemsStr.split(',').map((s) => s.trim()) : [];
    }
  };

  const items = parseItems(combo.items || '[]');

  return (
    <div className="bg-white border border-border overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      {combo.image_url && (
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={combo.image_url}
            alt={combo.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-lg font-bold mb-2">{combo.name}</h3>
        {combo.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{combo.description}</p>
        )}
        {items.length > 0 && (
          <ul className="space-y-1.5 mb-5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-[#c4a882] mt-0.5">✦</span>
                {item}
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-2xl font-bold">NT$ {combo.sale_price.toLocaleString()}</span>
          {combo.original_price > 0 && combo.original_price > combo.sale_price && (
            <span className="text-sm text-muted-foreground line-through">
              NT$ {combo.original_price.toLocaleString()}
            </span>
          )}
        </div>
        <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
          <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
            </svg>
            LINE 立即洽詢
          </Button>
        </a>
      </div>
    </div>
  );
};

/* ── Carousel Config ── */
const SLIDE_DURATION = 4000;

/* ── Page ── */
const Index: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [designCombos, setDesignCombos] = useState<DesignCombo[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [customProductImg, setCustomProductImg] = useState(DEFAULT_CUSTOM_PRODUCT_IMG);
  const [exclusiveDesignImg, setExclusiveDesignImg] = useState(DEFAULT_EXCLUSIVE_DESIGN_IMG);
  const [customCtaImg, setCustomCtaImg] = useState(DEFAULT_CUSTOM_CTA_IMG);
  const [aboutVideoCover, setAboutVideoCover] = useState(DEFAULT_ABOUT_VIDEO_COVER);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Helper: convert YouTube URL to embed URL ── */
  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    // Already an embed URL
    if (url.includes('/embed/')) return url;
    // Standard YouTube URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  };

  useEffect(() => {
    const fetchWithRetry = async <T,>(
      fn: () => Promise<T>,
      label: string,
      retries = 4,
      delay = 2000,
    ): Promise<T | null> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await fn();
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn(`[${label}] attempt ${attempt}/${retries} failed: ${msg}`);
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delay * attempt));
          }
        }
      }
      return null;
    };

    const fetchData = async () => {
      const [prodRes, caseRes, bannerRes, comboRes, settingsRes] = await Promise.all([
        fetchWithRetry(() => client.entities.products.query({ limit: 50, sort: '-created_at' }), 'products'),
        fetchWithRetry(() => client.entities.portfolio_cases.query({ limit: 6, sort: '-created_at' }), 'cases'),
        fetchWithRetry(() => client.entities.banners.query({ limit: 50, sort: 'sort_order' }), 'banners'),
        fetchWithRetry(() => client.entities.design_combos.query({ limit: 20, sort: 'sort_order' }), 'combos'),
        fetchWithRetry(() => client.entities.site_settings.query({ limit: 50 }), 'settings'),
      ]);
      if (prodRes) setProducts(prodRes.data?.items || []);
      if (caseRes) setCases(caseRes.data?.items || []);
      if (bannerRes) {
        const activeBanners = (bannerRes.data?.items || []).filter((b: Banner) => b.is_active);
        setBanners(activeBanners.length > 0 ? activeBanners : STATIC_BANNERS);
      } else {
        setBanners(STATIC_BANNERS);
      }
      if (comboRes) {
        const activeCombos = (comboRes.data?.items || []).filter((c: DesignCombo) => c.is_active !== false);
        setDesignCombos(activeCombos);
      }
      if (settingsRes) {
        const settings: SiteSetting[] = settingsRes.data?.items || [];
        const getSetting = (key: string) =>
          settings.find((s) => s.setting_key === key)?.setting_value || '';

        const videoVal = getSetting('about_video_url');
        if (videoVal) setVideoUrl(videoVal);

        /* Helper: resolve an object_key or URL to a display URL */
        const resolveUrl = async (value: string, fallback: string): Promise<string> => {
          if (!value) return fallback;
          if (value.startsWith('http://') || value.startsWith('https://')) return value;
          try {
            const r = await client.storage.getDownloadUrl({
              bucket_name: SITE_IMAGES_BUCKET,
              object_key: value,
            });
            return r.data?.download_url || fallback;
          } catch {
            return fallback;
          }
        };

        const [cpImg, edImg, ctaImg, vcImg] = await Promise.all([
          resolveUrl(getSetting('home_custom_product_img'), DEFAULT_CUSTOM_PRODUCT_IMG),
          resolveUrl(getSetting('home_exclusive_design_img'), DEFAULT_EXCLUSIVE_DESIGN_IMG),
          resolveUrl(getSetting('home_custom_cta_img'), DEFAULT_CUSTOM_CTA_IMG),
          resolveUrl(getSetting('home_about_video_cover'), DEFAULT_ABOUT_VIDEO_COVER),
        ]);
        setCustomProductImg(cpImg);
        setExclusiveDesignImg(edImg);
        setCustomCtaImg(ctaImg);
        setAboutVideoCover(vcImg);
      }
    };
    fetchData();
  }, []);

  /* Progress bar + auto-rotate */
  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    clearTimers();
    setProgress(0);
    const step = 30;
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (step / SLIDE_DURATION) * 100;
        return next >= 100 ? 100 : next;
      });
    }, step);
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (banners.length > 0 ? (prev + 1) % banners.length : 0));
      setProgress(0);
    }, SLIDE_DURATION);
  }, [banners.length, clearTimers]);

  useEffect(() => {
    if (banners.length > 1 && !isPaused) {
      startTimer();
    }
    return clearTimers;
  }, [banners.length, isPaused, startTimer, clearTimers]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
    if (!isPaused) startTimer();
  };

  const prevSlide = () => {
    goToSlide(currentSlide === 0 ? banners.length - 1 : currentSlide - 1);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % banners.length);
  };

  const handleMouseEnter = () => { setIsPaused(true); clearTimers(); };
  const handleMouseLeave = () => { setIsPaused(false); };

  /* Derive product lists — use backend is_hot / is_sale flags */
  const hotProducts = products.filter((p) => p.is_hot).slice(0, 6);
  const saleProducts = products.filter((p) => p.is_sale).slice(0, 4);

  /* Pad number to 2 digits */
  const pad = (n: number) => String(n).padStart(2, '0');

  /* Embed URL for video */
  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <Layout>
      {/* Popup Banner */}
      <PopupBanner />

      {/* ═══════════════════════════════════════════
          1. Hero — International Carousel
          Container height adapts to image; object-contain ensures full display.
      ═══════════════════════════════════════════ */}
      <section
        className="relative w-full bg-black"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {banners.length > 0 ? (
          <div className="relative w-full">
            {/* Slides wrapper — relative so the "active" image drives height */}
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`w-full transition-opacity duration-[1200ms] ease-in-out ${
                  index === currentSlide
                    ? 'relative opacity-100 z-10'
                    : 'absolute inset-0 opacity-0 z-0'
                }`}
              >
                {/* Desktop banner image — contain: full image, no crop */}
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className={`w-full h-auto object-contain ${
                    banner.mobile_image_url ? 'hidden md:block' : ''
                  }`}
                />
                {/* Mobile banner image */}
                {banner.mobile_image_url && (
                  <img
                    src={banner.mobile_image_url}
                    alt={banner.title}
                    className="w-full h-auto object-contain block md:hidden"
                  />
                )}
              </div>
            ))}

            {/* Navigation arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full transition-colors duration-300"
                  aria-label="上一張"
                >
                  <ChevronLeft className="w-7 h-7 text-white/90" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full transition-colors duration-300"
                  aria-label="下一張"
                >
                  <ChevronRight className="w-7 h-7 text-white/90" />
                </button>
              </>
            )}

            {/* Progress indicators */}
            {banners.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 z-30 px-6 md:px-10 pb-6 bg-gradient-to-t from-black/40 to-transparent pt-12">
                <div className="max-w-7xl mx-auto flex items-end gap-6">
                  <div className="hidden md:flex items-baseline gap-1 text-white/60 font-light text-sm tabular-nums shrink-0">
                    <span className="text-white text-lg font-medium">{pad(currentSlide + 1)}</span>
                    <span className="mx-1">/</span>
                    <span>{pad(banners.length)}</span>
                  </div>
                  <div className="flex-1 flex gap-2">
                    {banners.map((banner, index) => (
                      <button
                        key={index}
                        onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                        className="flex-1 group relative"
                        aria-label={`${banner.title} — ${index + 1}/${banners.length}`}
                      >
                        <div className="h-[2px] group-hover:bg-white/30 transition-colors overflow-hidden mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] rounded-full text-[16px] font-normal text-center text-[#1A1A1A] bg-[#FFFFFF4D] opacity-100">
                          <div
                            className="h-full bg-white rounded-full transition-none"
                            style={{
                              width: index === currentSlide
                                ? `${progress}%`
                                : index < currentSlide
                                  ? '100%'
                                  : '0%',
                            }}
                          />
                        </div>
                        
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full min-h-[60vh] bg-[#1a1a1a] flex flex-col items-center justify-center text-center px-6">
            <div className="inline-flex flex-col items-center">
              <img
                src="https://mgx-backend-cdn.metadl.com/mgx-backend-1300249583/production/9wp1vd/f1b39147389f4ad9b5b56978222b0a16/27d82ba4eb9b463abaf8d289c2cd80b5.png"
                alt="廿設計"
                className="w-1/3 h-auto object-contain animate-fade-in"
              />
              <p className="text-white/70 text-sm md:text-base mt-4 tracking-[0.25em] uppercase font-light animate-fade-in-delay-1 whitespace-nowrap">
                Design That Stays
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          2. 產品入口區 — Product Categories
      ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-2">Products</p>
            <h2 className="text-3xl md:text-4xl font-bold">商品分類</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Link to="/custom" className="group block relative overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <img
                  src={customProductImg}
                  alt="客製化商品"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                />
              </div>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <h3 className="text-2xl md:text-3xl font-bold">客製化商品</h3>
                <p className="text-white/70 text-sm mt-2">Custom Products</p>
              </div>
            </Link>
            <Link to="/shop" className="group block relative overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <img
                  src={exclusiveDesignImg}
                  alt="獨家設計商品"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                />
              </div>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <h3 className="text-2xl md:text-3xl font-bold">獨家設計商品</h3>
                <p className="text-white/70 text-sm mt-2">Exclusive Design</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. 關於我們 — About (Left text + Right video)
      ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#fafaf8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Text */}
            <div>
              <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-3">About</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">廿設計工作室</h2>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg mb-4">
                以自然為靈感，以簡約為語言。
              </p>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg mb-6">
                我們用設計連結自然與生活，為每一位客戶打造有溫度的品牌體驗。從品牌識別到空間設計，每一個細節都承載著我們對美感與品質的堅持。
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                了解更多
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right — Video thumbnail with play button */}
            <div className="relative aspect-[4/3] bg-[#1a1a1a] overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => setShowVideoDialog(true)}
            >
              <img
                src={aboutVideoCover}
                alt="品牌影片封面"
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-[1.03] transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                  <Play className="w-6 h-6 md:w-8 md:h-8 text-[#1a1a1a] ml-1" />
                </div>
                <p className="text-white/70 text-sm mt-4 tracking-wider">播放影片</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden">
          <div className="relative aspect-video">
            {showVideoDialog && embedUrl && (
              <iframe
                src={`${embedUrl}?autoplay=1`}
                title="廿設計品牌影片"
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
            {showVideoDialog && !embedUrl && (
              <div className="absolute inset-0 flex items-center justify-center text-white/60">
                <p>尚未設定影片，請至後台設定影片網址</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════
          4. 熱門商品 — Hot Products
      ═══════════════════════════════════════════ */}
      {hotProducts.length > 0 && (
        <section className="py-24 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-2">Popular</p>
                <h2 className="text-3xl md:text-4xl font-bold">熱門商品</h2>
              </div>
              <Link
                to="/shop"
                className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {hotProducts.map((p) => (
                <ProductCard key={p.id} product={p} badge="HOT" />
              ))}
            </div>
            <div className="md:hidden text-center mt-10">
              <Link to="/shop">
                <Button variant="outline" className="!bg-transparent border-foreground/20 hover:bg-foreground hover:text-background">
                  查看全部商品
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          5. 每月促銷 — Sale Products
      ═══════════════════════════════════════════ */}
      {saleProducts.length > 0 && (
        <section className="py-24 md:py-32 bg-[#fafaf8]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-2">Monthly Sale</p>
                <h2 className="text-3xl md:text-4xl font-bold">每月促銷</h2>
              </div>
              <Link
                to="/sale"
                className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                查看全部促銷
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {saleProducts.map((p) => (
                <ProductCard key={p.id} product={p} badge="SALE" />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/sale">
                <Button variant="outline" className="!bg-transparent border-foreground/20 hover:bg-foreground hover:text-background">
                  查看全部促銷商品
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          6. 客製化設計款組合 — Design Combos (from backend)
      ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] text-[#c4a882] tracking-[0.2em] uppercase mb-2">Custom Combo</p>
            <h2 className="text-3xl md:text-4xl font-bold">客製化設計款組合</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              精心搭配的設計組合方案，讓您以更優惠的價格享受完整的品牌設計服務。
            </p>
          </div>

          {designCombos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {designCombos.map((combo) => (
                <ComboCard key={combo.id} combo={combo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">組合方案即將推出，敬請期待！</p>
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-4">
                <Button variant="outline" className="!bg-transparent border-foreground/20 hover:bg-foreground hover:text-background">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                  </svg>
                  LINE 諮詢客製方案
                </Button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          7. 精選設計案例 — Featured Cases
      ═══════════════════════════════════════════ */}
      {cases.length > 0 && (
        <section className="py-24 md:py-32 bg-[#fafaf8]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-2">Portfolio</p>
                <h2 className="text-3xl md:text-4xl font-bold">精選案例</h2>
              </div>
              <Link
                to="/portfolio"
                className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
            <div className="md:hidden text-center mt-10">
              <Link to="/portfolio">
                <Button variant="outline" className="!bg-transparent border-foreground/20 hover:bg-foreground hover:text-background">
                  查看全部案例
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          8. 客製化服務入口 — Custom CTA
      ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#1a1a1a] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[11px] text-white/40 tracking-[0.2em] uppercase mb-3">Custom</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-5">想要獨一無二的設計？</h2>
              <p className="text-white/50 leading-relaxed mb-8">
                告訴我們你的想法，從構想到成品，為你量身打造。
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/custom">
                  <Button size="lg" className="bg-white text-[#1a1a1a] hover:bg-white/90">
                    了解客製化
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="!bg-transparent border-white/30 text-white hover:bg-white/10">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                    </svg>
                    LINE 諮詢
                  </Button>
                </a>
              </div>
            </div>
            <div className="aspect-[4/3] overflow-hidden bg-white/5">
              <img
                src={customCtaImg}
                alt="客製化服務"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
