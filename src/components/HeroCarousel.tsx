import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ===== 輪播設定 =====
 * 修改此陣列即可更換輪播圖片、文字與連結。
 * - image: 圖片網址（建議尺寸 1920x1080 以上）
 * - title: 主標題
 * - subtitle: 副標題（選填）
 * - description: 說明文字（選填）
 * - link: 按鈕連結網址
 * - linkText: 按鈕文字
 * - linkExternal: 是否為外部連結（預設 false）
 */
export interface HeroSlide {
  image: string;
  title: string;
  subtitle?: string;
  description?: string;
  link?: string;
  linkText?: string;
  linkExternal?: boolean;
}

export const heroSlides: HeroSlide[] = [
  {
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-04/db3d7900-ef56-46cb-8e14-31afb35bbc71.png',
    subtitle: 'Twenty Design Studio',
    title: '以設計\n連結自然與生活',
    description: '品牌識別 · 空間設計 · 客製商品\n打造有溫度的品牌體驗',
    link: '/portfolio',
    linkText: '瀏覽作品',
  },
  {
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-04/8468a06f-b087-4848-b829-7d98a1a3a069.png',
    subtitle: 'Brand Identity',
    title: '品牌識別設計',
    description: '從Logo到完整視覺系統\n為品牌建立獨特的識別形象',
    link: '/services',
    linkText: '了解服務',
  },
  {
    image: 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-04/9f2fa139-e610-4c0a-84e9-399535297003.png',
    subtitle: 'Outdoor Collection',
    title: '露營風格商品',
    description: '結合設計美學與戶外生活\n探索我們的精選商品',
    link: '/shop',
    linkText: '逛逛商品',
  },
];

interface HeroCarouselProps {
  slides?: HeroSlide[];
  hideText?: boolean;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides = heroSlides, hideText = false }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 ${hideText ? 'bg-black/10' : 'bg-gradient-to-r from-black/70 via-black/40 to-transparent'}`} />
              </div>

              {/* Content */}
              {!hideText && (
                <div className="relative z-10 h-full flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-xl">
                      {slide.subtitle && (
                        <p className="text-white/70 text-sm tracking-[0.3em] uppercase mb-4 animate-fade-in-up">
                          {slide.subtitle}
                        </p>
                      )}
                      <h1
                        className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6 animate-fade-in-up"
                        style={{
                          fontFamily: "'Noto Serif TC', serif",
                          animationDelay: '0.1s',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {slide.title}
                      </h1>
                      {slide.description && (
                        <p
                          className="text-white/80 text-base md:text-lg mb-8 leading-relaxed animate-fade-in-up"
                          style={{ animationDelay: '0.2s', whiteSpace: 'pre-line' }}
                        >
                          {slide.description}
                        </p>
                      )}
                      {slide.link && (
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                          {slide.linkExternal ? (
                            <a href={slide.link} target="_blank" rel="noopener noreferrer">
                              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {slide.linkText || '了解更多'}
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </a>
                          ) : (
                            <a href={slide.link}>
                              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {slide.linkText || '了解更多'}
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="上一張"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="下一張"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`transition-all duration-300 rounded-full ${
              index === selectedIndex
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`前往第 ${index + 1} 張`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;