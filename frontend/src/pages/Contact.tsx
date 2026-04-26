import React from 'react';
import { Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const LINE_URL = 'https://lin.ee/RK4aaeq';
const IG_URL = 'https://www.instagram.com/nine.creativity.design/';

const Contact: React.FC = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 md:py-32 bg-[#fafaf8]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-3">Contact</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5">聯絡我們</h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            有任何設計需求或合作想法，歡迎隨時與我們聯繫。
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-border/50 p-8 md:p-10">
              <Mail className="w-5 h-5 text-muted-foreground mb-5" />
              <h3 className="text-sm font-semibold tracking-wide mb-2">Email</h3>
              <a
                href="mailto:ninefadacai888@gmail.com"
                className="text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                ninefadacai888@gmail.com
              </a>
            </div>

            <div className="border border-border/50 p-8 md:p-10">
              <svg className="w-5 h-5 text-muted-foreground mb-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
              </svg>
              <h3 className="text-sm font-semibold tracking-wide mb-2">LINE 官方帳號</h3>
              <a
                href={LINE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                加入好友
              </a>
            </div>

            <div className="border border-border/50 p-8 md:p-10">
              <svg className="w-5 h-5 text-muted-foreground mb-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <h3 className="text-sm font-semibold tracking-wide mb-2">Instagram</h3>
              <a
                href={IG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                @nine.creativity.design
              </a>
            </div>

            <div className="border border-border/50 p-8 md:p-10">
              <MapPin className="w-5 h-5 text-muted-foreground mb-5" />
              <h3 className="text-sm font-semibold tracking-wide mb-2">工作室地址</h3>
              <p className="text-muted-foreground text-sm">
                台北市大安區敦化南路一段 100 號 5F
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LINE CTA */}
      <section className="py-24 md:py-32 bg-[#fafaf8]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-[#06C755] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">最快的聯繫方式</h2>
          <p className="text-muted-foreground mb-8">
            加入我們的 LINE 官方帳號，即時回覆您的設計需求與報價諮詢。
          </p>
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-[#06C755] text-white hover:bg-[#05b34c]">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
              </svg>
              加入 LINE 好友
            </Button>
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;