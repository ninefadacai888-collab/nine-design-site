import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Layout from '@/components/Layout';
import HeroCarousel from '@/components/HeroCarousel';

const STUDIO_IMG = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-14/ms4tuniaafaa/brand-studio-workspace.png';
const OUTDOOR_IMG = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-14/ms4tueiaafaq/brand-outdoor-lifestyle.png';

const faqs = [
  { q: '設計服務的報價方式？', a: '根據專案規模與需求客製報價。歡迎透過 LINE 聯繫，我們會在 1-2 個工作天內回覆。' },
  { q: '合作流程是什麼？', a: '需求溝通 → 提案報價 → 確認合作 → 設計執行 → 修改調整 → 完成交付。' },
  { q: '商品可以退換貨嗎？', a: '一般商品收到後 7 天內可申請退換貨。客製化商品恕不接受退換貨。' },
  { q: '客製化商品需要多久？', a: '一般約 7-14 個工作天，視商品類型與數量而定。' },
  { q: '如何付款？', a: '目前接受銀行轉帳，訂單送出後透過 LINE 提供匯款資訊。' },
];

const About: React.FC = () => {
  return (
    <Layout>
      {/* 輪播圖 — 純圖片無文字 */}
      <HeroCarousel hideText />

      {/* 工作室介紹 */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={STUDIO_IMG}
                  alt="廿川設計工作室"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-40 h-40 md:w-52 md:h-52 overflow-hidden border-4 border-white shadow-lg hidden md:block">
                <img
                  src={OUTDOOR_IMG}
                  alt="露營生活"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground tracking-[0.25em] uppercase mb-4">
                About Us
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
                廿川設計
              </h2>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p className="text-lg font-medium text-foreground">
                  就是一個剛好喜歡露營的設計師。
                </p>
                <p>
                  從一頂帳篷下的靈感開始，我們將對戶外生活的熱愛融入每一件作品。不只是設計，更是一種生活態度的表達。
                </p>
                <p>
                  專注客製化露營周邊商品，從品牌識別到實體商品，為每位熱愛戶外的你，打造獨一無二的露營風格。
                </p>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold">萬+</div>
                  <p className="text-xs text-muted-foreground mt-1">年銷售件數</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold">99+</div>
                  <p className="text-xs text-muted-foreground mt-1">合作品牌</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold">5+</div>
                  <p className="text-xs text-muted-foreground mt-1">年設計經驗</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 品牌理念 */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <img
          src={OUTDOOR_IMG}
          alt="品牌理念"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 text-center text-white px-6 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-4">
            以自然為靈感<br />以簡約為語言
          </h2>
          <p className="text-sm md:text-base opacity-70">
            客製化露營周邊年銷售破萬件
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">常見問題</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-border px-0"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </Layout>
  );
};

export default About;