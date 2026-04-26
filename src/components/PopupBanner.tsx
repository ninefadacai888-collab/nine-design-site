import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { client } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

const SESSION_KEY = 'popup_banner_dismissed';

const PopupBanner: React.FC = () => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show once per session
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (dismissed) return;

    const fetchBanner = async (retries = 4, delay = 2000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await client.entities.banners.query({ limit: 50, sort: 'sort_order' });
          const activeBanners = (res.data?.items || []).filter((b: Banner) => b.is_active);
          if (activeBanners.length > 0) {
            setBanner(activeBanners[0]);
            setTimeout(() => setVisible(true), 800);
          }
          return;
        } catch (e: unknown) {
          console.warn(`[PopupBanner] attempt ${attempt}/${retries} failed:`, e instanceof Error ? e.message : String(e));
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delay * attempt));
          }
        }
      }
    };
    fetchBanner();
  }, []);

  const handleClose = () => {
    setAnimateOut(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
    setTimeout(() => setVisible(false), 300);
  };

  const handleClick = () => {
    if (!banner?.link_url) return;
    handleClose();
    if (banner.link_url.startsWith('http')) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(banner.link_url);
    }
  };

  if (!visible || !banner) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        animateOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-lg transform transition-all duration-500 ${
          animateOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-20 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          aria-label="關閉"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>

        {/* Banner image */}
        <div
          className="overflow-hidden rounded-lg shadow-2xl cursor-pointer group"
          onClick={handleClick}
        >
          <img
            src={banner.image_url}
            alt={banner.title || '最新消息'}
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          {/* Title overlay at bottom */}
          {banner.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
              <p className="text-white text-lg font-bold">{banner.title}</p>
              <p className="text-white/60 text-xs mt-1">點擊查看詳情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupBanner;