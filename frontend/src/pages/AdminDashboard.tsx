import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Image as ImageIcon,
  ShoppingBag,
  Briefcase,
  Film,
  ArrowRight,
  LayoutDashboard,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSection {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const ADMIN_BASE = '/sn-studio-mgmt-7k3x9q';

const SECTIONS: AdminSection[] = [
  {
    key: 'orders',
    title: '訂單管理',
    description:
      '查看、搜尋、更新訂單與付款狀態，支援匯出 Excel / CSV 方便帳務整理。',
    icon: ClipboardList,
    path: `${ADMIN_BASE}/orders`,
    color: 'bg-rose-50 text-rose-700',
  },
  {
    key: 'banners',
    title: 'Banner 管理',
    description: '首頁最上方輪播 Banner 的新增、編輯、排序與啟用狀態。',
    icon: ImageIcon,
    path: `${ADMIN_BASE}/banners`,
    color: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'site-images',
    title: '首頁圖片與影片',
    description:
      '管理首頁各區塊的靜態圖片（客製商品、獨家設計、CTA）與關於我們影片網址。',
    icon: Film,
    path: `${ADMIN_BASE}/site-images`,
    color: 'bg-sky-50 text-sky-700',
  },
  {
    key: 'products',
    title: '商品管理',
    description: '商品的新增、編輯、刪除、熱銷/特價標籤與上下架切換。',
    icon: ShoppingBag,
    path: `${ADMIN_BASE}/products`,
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'portfolio',
    title: '作品集管理',
    description: '設計作品集的案例管理，包含封面圖片、分類與客戶資訊。',
    icon: Briefcase,
    path: `${ADMIN_BASE}/portfolio`,
    color: 'bg-violet-50 text-violet-700',
  },
];

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Layout>
      <section className="py-16 md:py-20 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <LayoutDashboard className="h-7 w-7 text-foreground" />
                <h1 className="text-2xl md:text-3xl font-bold">管理中心</h1>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                  Restricted
                </span>
              </div>
              <p className="text-muted-foreground">
                選擇下方任一區塊進入對應的後台管理頁面。所有圖片、商品、訂單、作品集皆可在此集中管理。
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground mt-2">
                  目前登入：<span className="font-mono">{user.email}</span>
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex-shrink-0"
            >
              <LogOut className="h-4 w-4 mr-1" />
              登出後台
            </Button>
          </div>

          {/* Sections Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.key} to={section.path} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
                    <CardHeader>
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${section.color} mb-3`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {section.title}
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Tips */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg border">
            <h3 className="font-semibold mb-2">💡 使用提示</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>
                訂單管理頁面可按訂單狀態、付款狀態、日期區間篩選，並一鍵匯出 Excel / CSV。
              </li>
              <li>所有圖片上傳後會自動儲存到雲端，網站前台會自動更新。</li>
              <li>
                商品的「熱銷」標籤會顯示在首頁熱門商品區，「特價」標籤會顯示在每月促銷區。
              </li>
              <li>
                Banner 輪播可設定「桌機版」與「手機版」圖片，系統會依裝置自動切換。
              </li>
              <li>若首頁圖片未上傳，系統會顯示預設圖片避免版面破版。</li>
            </ul>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 text-xs">
            <div className="font-semibold mb-1 text-amber-300">🔒 安全提醒</div>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>此後台網址為私密路徑，請勿對外分享。</li>
              <li>離開後台時，建議點選「登出後台」徹底結束管理員 Session。</li>
              <li>所有前台頁面皆不會顯示任何後台入口連結。</li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboard;