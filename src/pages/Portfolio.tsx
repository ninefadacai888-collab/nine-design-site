import React, { useEffect, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { client } from '@/lib/api';
import Layout from '@/components/Layout';

const LINE_URL = 'https://lin.ee/RK4aaeq';
const BUCKET_NAME = 'portfolio-images';

interface PortfolioCase {
  id: number;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  images: string;
  client_name: string;
  year: string;
}

const categories = [
  { value: 'all', label: '全部' },
  { value: 'cis', label: 'CIS 品牌識別' },
  { value: 'commercial', label: '商業空間' },
  { value: 'custom', label: '客製設計' },
  { value: 'custom-case', label: '客製化案例' },
];

const categoryLabel: Record<string, string> = {
  cis: 'CIS 品牌識別',
  commercial: '商業空間',
  custom: '客製設計',
  'custom-case': '客製化案例',
};

/** Resolve an image value to a displayable URL */
async function resolveImageUrl(value: string): Promise<string> {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  try {
    const res = await client.storage.getDownloadUrl({
      bucket_name: BUCKET_NAME,
      object_key: value,
    });
    return res.data?.download_url || value;
  } catch {
    return value;
  }
}

const Portfolio: React.FC = () => {
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCase, setSelectedCase] = useState<PortfolioCase | null>(null);

  // Resolved image URLs
  const [coverUrls, setCoverUrls] = useState<Record<number, string>>({});
  const [detailCoverUrl, setDetailCoverUrl] = useState<string>('');
  const [detailImageUrls, setDetailImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchCases = async (retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await client.entities.portfolio_cases.query({ limit: 50, sort: '-created_at' });
          const items: PortfolioCase[] = res.data?.items || [];
          setCases(items);

          // Resolve cover URLs
          const urlMap: Record<number, string> = {};
          await Promise.all(
            items.map(async (c) => {
              if (c.cover_image) {
                urlMap[c.id] = await resolveImageUrl(c.cover_image);
              }
            })
          );
          setCoverUrls(urlMap);

          setLoading(false);
          return;
        } catch (e: unknown) {
          console.error(`Fetch portfolio cases attempt ${attempt}/${retries} failed:`, e instanceof Error ? e.message : String(e));
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delay * attempt));
          } else {
            setLoading(false);
          }
        }
      }
    };
    fetchCases();
  }, []);

  const filtered = activeCategory === 'all' ? cases : cases.filter((c) => c.category === activeCategory);

  const parseImages = (imagesStr: string): string[] => {
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Resolve detail images when a case is selected
  const handleSelectCase = useCallback(async (c: PortfolioCase) => {
    setSelectedCase(c);

    // Resolve cover
    if (c.cover_image) {
      const url = await resolveImageUrl(c.cover_image);
      setDetailCoverUrl(url);
    } else {
      setDetailCoverUrl('');
    }

    // Resolve additional images
    const imgKeys = parseImages(c.images);
    const resolved = await Promise.all(imgKeys.map((key) => resolveImageUrl(key)));
    setDetailImageUrls(resolved);
  }, []);

  const handleCloseDetail = () => {
    setSelectedCase(null);
    setDetailCoverUrl('');
    setDetailImageUrls([]);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-3">Portfolio</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5">作品案例</h1>
          <p className="text-muted-foreground leading-relaxed">
            每一個作品都是與客戶共同創造的成果，<br className="hidden md:block" />
            展現廿設計對品質與細節的堅持。
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="py-16 md:py-20 bg-[#fafaf8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-5 py-2 text-sm tracking-wide transition-all ${
                  activeCategory === cat.value
                    ? 'bg-foreground text-background'
                    : 'bg-white text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className="group text-left block"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {(coverUrls[c.id] || c.cover_image) && (
                      <img
                        src={coverUrls[c.id] || c.cover_image}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      />
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-[11px] text-muted-foreground tracking-[0.15em] uppercase">
                      {categoryLabel[c.category] || c.category}
                    </p>
                    <h3 className="text-base font-semibold mt-1">{c.title}</h3>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p>此分類尚無作品</p>
            </div>
          )}
        </div>
      </section>

      {/* Case Detail Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCase && (
            <>
              <DialogHeader>
                <p className="text-[11px] text-muted-foreground tracking-[0.15em] uppercase">
                  {categoryLabel[selectedCase.category] || selectedCase.category}
                </p>
                <DialogTitle className="text-2xl mt-1">{selectedCase.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCase.client_name} · {selectedCase.year}
                </p>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                {detailCoverUrl && (
                  <img
                    src={detailCoverUrl}
                    alt={selectedCase.title}
                    className="w-full object-cover aspect-video"
                  />
                )}

                {detailImageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {detailImageUrls.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full object-cover aspect-square" />
                    ))}
                  </div>
                )}

                <p className="text-muted-foreground leading-relaxed">{selectedCase.description}</p>

                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-3">對這個案例感興趣？</p>
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-foreground text-background hover:bg-foreground/90">
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                      </svg>
                      LINE 諮詢
                    </Button>
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Portfolio;