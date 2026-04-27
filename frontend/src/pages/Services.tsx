// Services page

import React from 'react';

import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const LINE_URL = 'https://lin.ee/RK4aaeq';

const SERVICE_CIS = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-04/8468a06f-b087-4848-b829-7d98a1a3a069.png';
const SERVICE_COMMERCIAL = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-04/9f2fa139-e610-4c0a-84e9-399535297003.png';
const SERVICE_CUSTOM = 'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-04/9e7f5954-fc9b-4678-97bf-94a3530402e9.png';

const services = [
  {
    id: 'cis',
    title: 'CIS 品牌識別設計',
    subtitle: 'Corporate Identity System',
    image: SERVICE_CIS,
    description: '從品牌核心價值出發，建立完整的視覺識別系統。深入了解您的品牌故事，透過設計語言將品牌精神具象化。',
    items: ['Logo 設計', '色彩計畫', '字型規範', '名片設計', '品牌手冊', '包裝設計'],
  },
  {
    id: 'commercial',
    title: '商業空間設計',
    subtitle: 'Commercial Space Design',
    image: SERVICE_COMMERCIAL,
    description: '結合品牌美學與空間機能，為商業空間注入靈魂。從概念發想到施工監造，提供一站式空間設計服務。',
    items: ['空間規劃', '室內設計', '動線規劃', '燈光設計', '材質搭配', '軟裝佈置'],
  },
  {
    id: 'custom',
    title: '客製化設計',
    subtitle: 'Custom Design',
    image: SERVICE_CUSTOM,
    description: '依據需求量身打造，從企業禮品到活動周邊，提供全方位的客製化設計服務。注重每個細節，完美呈現您的想法。',
    items: ['企業禮品', '活動周邊', '客製包裝', '紀念品設計', '聯名商品', '印刷品設計'],
  },
];

const processSteps = [
  { step: '01', title: '需求溝通', desc: '透過 LINE 或面談了解您的需求' },
  { step: '02', title: '提案報價', desc: '根據需求提供設計提案與報價' },
  { step: '03', title: '設計執行', desc: '確認方向後開始設計與溝通調整' },
  { step: '04', title: '完成交付', desc: '交付所有檔案與使用規範' },
];

const Services: React.FC = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-3">Services</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5">設計服務</h1>
          <p className="text-muted-foreground leading-relaxed">
            品牌識別、商業空間與客製化設計三大核心服務，<br className="hidden md:block" />
            為每個專案注入獨特的設計靈魂。
          </p>
        </div>
      </section>

      {/* Service Modules */}
      {services.map((service, idx) => (
        <section
          key={service.id}
          className={`py-24 md:py-32 ${idx % 2 === 0 ? 'bg-[#fafaf8]' : 'bg-white'}`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center`}>
              <div className={idx % 2 !== 0 ? 'lg:order-2' : ''}>
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className={idx % 2 !== 0 ? 'lg:order-1' : ''}>
                <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-2">
                  {service.subtitle}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{service.title}</h2>
                <p className="text-muted-foreground leading-relaxed mb-8">{service.description}</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-10">
                  {service.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <span className="w-1 h-1 bg-foreground/30 rounded-full flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-foreground text-background hover:bg-foreground/90">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
                    </svg>
                    LINE 諮詢此服務
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Process */}
      <section className="py-24 md:py-32 bg-[#1a1a1a] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[11px] text-white/40 tracking-[0.2em] uppercase mb-3">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold">合作流程</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            {processSteps.map((p) => (
              <div key={p.step} className="text-center">
                <div className="text-3xl font-bold text-[#c4a882] mb-3">{p.step}</div>
                <h3 className="text-base font-medium mb-2">{p.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">準備好開始了嗎？</h2>
          <p className="text-muted-foreground mb-8">
            歡迎透過 LINE 與我們聊聊您的需求
          </p>
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.268 14.294 24 12.417 24 10.304zM8.497 12.932H6.187a.553.553 0 01-.553-.553V8.756a.553.553 0 111.106 0v3.07h1.757a.553.553 0 010 1.106zm2.017-.553a.553.553 0 11-1.106 0V8.756a.553.553 0 111.106 0v3.623zm5.165 0a.553.553 0 01-.992.332l-2.262-3.082v2.75a.553.553 0 11-1.106 0V8.756a.553.553 0 01.992-.332l2.262 3.082V8.756a.553.553 0 111.106 0v3.623zm3.327-2.517a.553.553 0 110 1.106h-1.757v.858h1.757a.553.553 0 010 1.106h-2.31a.553.553 0 01-.553-.553V8.756a.553.553 0 01.553-.553h2.31a.553.553 0 010 1.106h-1.757v.553h1.757z" />
              </svg>
              LINE 諮詢
            </Button>
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
