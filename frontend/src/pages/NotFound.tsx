import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

/**
 * NotFound — Elegant 404 page
 *
 * Design goals:
 *  - Match the site's minimal aesthetic (black / warm white / #c4a882 accent)
 *  - Bilingual ZH/EN copy consistent with Index.tsx
 *  - Clear primary action: go back to home
 *  - Secondary navigation to main sections so users don't hit another dead end
 */
const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const suggestedLinks: { to: string; label: string; en: string }[] = [
    { to: '/', label: '首頁', en: 'Home' },
    { to: '/shop', label: '商品', en: 'Shop' },
    { to: '/portfolio', label: '作品集', en: 'Portfolio' },
    { to: '/custom', label: '客製化', en: 'Custom' },
    { to: '/about', label: '關於我們', en: 'About' },
    { to: '/contact', label: '聯絡我們', en: 'Contact' },
  ];

  return (
    <Layout>
      <section className="relative min-h-[80vh] bg-[#fafaf8] flex items-center overflow-hidden">
        {/* Decorative background number */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <span className="text-[30vw] md:text-[22vw] lg:text-[18vw] font-bold leading-none text-foreground/[0.04] tracking-tighter">
            404
          </span>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-24 md:py-32 w-full text-center">
          {/* Label */}
          <p className="text-[11px] text-[#c4a882] tracking-[0.3em] uppercase mb-4">
            Error 404 · Page Not Found
          </p>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            迷路了嗎？
          </h1>
          <div className="w-12 h-[2px] bg-[#c4a882] mx-auto mb-6" />

          {/* Description */}
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-4">
            很抱歉，您要找的頁面不存在、已被移除，或網址輸入有誤。
          </p>
          <p className="text-muted-foreground/70 text-sm tracking-wider mb-10">
            The page you are looking for could not be found.
          </p>

          {/* Path hint */}
          {location.pathname && location.pathname !== '/' && (
            <div className="inline-flex items-center gap-2 bg-white border border-border/60 px-4 py-2 mb-10 text-xs text-muted-foreground">
              <Search className="w-3.5 h-3.5 text-[#c4a882]" />
              <span className="font-mono break-all">{location.pathname}</span>
            </div>
          )}

          {/* Primary actions */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link to="/">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 min-w-[180px]"
              >
                <Home className="w-4 h-4 mr-2" />
                返回首頁
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(-1)}
              className="!bg-transparent border-foreground/20 hover:bg-foreground hover:text-background min-w-[180px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回上一頁
            </Button>
          </div>

          {/* Suggested navigation */}
          <div className="pt-10 border-t border-border/60">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Compass className="w-4 h-4 text-[#c4a882]" />
              <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase">
                Explore — 你可能想去
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {suggestedLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group inline-flex items-baseline gap-2 text-sm text-foreground hover:text-[#c4a882] transition-colors"
                >
                  <span className="font-medium">{link.label}</span>
                  <span className="text-[11px] text-muted-foreground group-hover:text-[#c4a882]/70 tracking-wider uppercase">
                    {link.en}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;