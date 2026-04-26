import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import CheckoutForm from './CheckoutForm';

const LINE_URL = 'https://lin.ee/RK4aaeq';
const IG_URL = 'https://www.instagram.com/nine.creativity.design/';

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/services', label: '設計服務' },
  { to: '/portfolio', label: '作品案例' },
  { to: '/shop', label: '線上商店' },
  { to: '/custom', label: '客製化專區' },
  { to: '/contact', label: '聯絡我們' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { items, totalItems, totalAmount, removeItem, updateQuantity } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Track scroll for subtle header shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══════════════════════════════════════════
          Header / Navigation Bar
      ═══════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.06)]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo — Left */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img src="/assets/logo.png" alt="廿設計工作室" className="h-7 md:h-9 w-auto mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] rounded-none text-[16px] font-normal text-[#1A1A1A] bg-[#00000000] opacity-100" />
            </Link>

            {/* Desktop Nav — Right (horizontal) */}
            <nav className="hidden lg:flex items-center gap-9">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="relative tracking-[0.06em] transition-colors group mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] rounded-none text-[13px] font-normal text-[#1A1A1A] bg-[#00000000] opacity-100"
                  >
                    <span
                      className={
                        isActive
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }
                    >
                      {link.label}
                    </span>
                    {/* Hover / active underline */}
                    <span
                      className={`absolute -bottom-1 left-0 h-[1.5px] bg-foreground transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Actions — Right side icons */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative w-9 h-9">
                    <ShoppingBag className="w-[18px] h-[18px]" />
                    {totalItems > 0 && (
                      <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-foreground text-background rounded-full">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md flex flex-col">
                  <SheetHeader>
                    <SheetTitle className="text-left text-lg">
                      {showCheckout ? '結帳資訊' : '購物車'}
                    </SheetTitle>
                  </SheetHeader>

                  {showCheckout ? (
                    <CheckoutForm onBack={() => setShowCheckout(false)} />
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto py-4 space-y-3">
                        {items.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ShoppingBag className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm">購物車是空的</p>
                          </div>
                        ) : (
                          items.map((item) => (
                            <div key={item.id} className="flex gap-3 p-3 border border-border/50">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-16 h-16 object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate">{item.name}</h4>
                                {item.specs && Object.keys(item.specs).length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {Object.entries(item.specs)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(' / ')}
                                  </p>
                                )}
                                {item.customContent && (
                                  <p className="text-xs text-accent mt-0.5 truncate">
                                    客製: {item.customContent}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="w-6 h-6 flex items-center justify-center border border-border hover:bg-muted transition-colors"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="w-6 h-6 flex items-center justify-center border border-border hover:bg-muted transition-colors"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <span className="text-sm font-medium">
                                    NT$ {(item.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {items.length > 0 && (
                        <div className="border-t pt-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">小計</span>
                            <span className="text-lg font-medium">
                              NT$ {totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <Button
                            className="w-full bg-foreground text-background hover:bg-foreground/90"
                            size="lg"
                            onClick={() => setShowCheckout(true)}
                          >
                            前往結帳
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </SheetContent>
              </Sheet>

              {/* Mobile Hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden w-9 h-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          Mobile Full-Screen Menu Overlay
      ═══════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col lg:hidden animate-fade-in">
          {/* Top bar mirrors header height */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-black/5">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <img src="https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msg24gqaae2q.png" alt="廿設計工作室" className="h-7 w-auto" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col justify-center px-10 gap-7">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-2xl tracking-wide transition-colors ${
                    isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom LINE CTA */}
          <div className="px-10 pb-10">
            <a
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#06C755] text-white text-sm font-medium rounded-full"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
              </svg>
              LINE 諮詢
            </a>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          Main Content
      ═══════════════════════════════════════════ */}
      <main className="flex-1">{children}</main>

      {/* ═══════════════════════════════════════════
          Footer
      ═══════════════════════════════════════════ */}
      <footer className="bg-[#1a1a1a] text-white/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand + Social Icons */}
            <div>
              <div className="flex items-center gap-4 mb-5">
                {/* Instagram Logo */}
                <a
                  href={IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                {/* LINE Logo */}
                <a
                  href={LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="LINE"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                  </svg>
                </a>
              </div>
              <p className="text-sm leading-relaxed text-white/40">
                以設計連結自然與生活，
                <br />
                打造有溫度的品牌體驗。
              </p>
            </div>

            {/* Nav */}
            <div>
              <h4 className="text-sm font-bold text-white/70 uppercase tracking-[0.15em] mb-5">
                導覽
              </h4>
              <nav className="grid grid-cols-2 gap-x-8 gap-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-xs text-white/40 hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-white/70 uppercase tracking-[0.15em] mb-5">
                聯絡
              </h4>
              <div className="space-y-3 text-sm text-white/40">
                <p>ninefadacai888@gmail.com</p>
                <div className="flex items-center gap-4 mt-4">
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    Instagram
                  </a>
                  <a
                    href={LINE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                    </svg>
                    LINE 官方帳號
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-center text-xs text-white/25">
              © 2026 廿設計工作室 Twenty Design Studio
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════
          Floating LINE Button (bottom-right)
      ═══════════════════════════════════════════ */}
      <a
        href={LINE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#06C755] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        aria-label="LINE 諮詢"
      >
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
        </svg>
      </a>
    </div>
  );
};

export default Layout;