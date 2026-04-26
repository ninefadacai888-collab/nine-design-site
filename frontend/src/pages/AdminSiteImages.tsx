import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { client } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  Loader2,
  Image as ImageIcon,
  Film,
  Save,
} from 'lucide-react';

const BUCKET_NAME = 'site-images';

/* ── Image slot definitions — clearly labels where each image appears ── */
interface ImageSlot {
  key: string;              // setting_key in DB
  title: string;            // display name in admin
  location: string;         // where it shows on the site
  description: string;      // helper text
  recommendedSize: string;
  defaultUrl: string;       // fallback preview
}

const IMAGE_SLOTS: ImageSlot[] = [
  {
    key: 'home_custom_product_img',
    title: '首頁 - 客製化商品區塊圖',
    location: '首頁 > 商品分類區 > 左側「客製化商品」卡片',
    description: '顯示在首頁商品分類區塊的左邊，點擊後進入客製化頁面。',
    recommendedSize: '1600 × 900 px（16:9 橫式）',
    defaultUrl:
      'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msftneyaae4q.png',
  },
  {
    key: 'home_exclusive_design_img',
    title: '首頁 - 獨家設計商品區塊圖',
    location: '首頁 > 商品分類區 > 右側「獨家設計商品」卡片',
    description: '顯示在首頁商品分類區塊的右邊，點擊後進入商品頁面。',
    recommendedSize: '1600 × 900 px（16:9 橫式）',
    defaultUrl:
      'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msgso7iaae4q.png',
  },
  {
    key: 'home_about_video_cover',
    title: '首頁 - 關於我們影片封面圖',
    location: '首頁 > 關於我們區塊 > 右側影片封面',
    description: '點擊播放按鈕前顯示的影片封面圖。',
    recommendedSize: '1200 × 900 px（4:3 橫式）',
    defaultUrl:
      'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msftkliaae4a.png',
  },
  {
    key: 'home_custom_cta_img',
    title: '首頁 - 客製化 CTA 區塊圖',
    location: '首頁 > 最下方「想要獨一無二的設計？」區塊',
    description: '顯示在首頁底部客製化行動呼籲區塊的右側。',
    recommendedSize: '1200 × 900 px（4:3 橫式）',
    defaultUrl:
      'https://mgx-backend-cdn.metadl.com/generate/images/1086560/2026-04-13/msftkvaaae3a.png',
  },
];

const VIDEO_SETTING_KEY = 'about_video_url';

interface SiteSetting {
  id: number;
  setting_key: string;
  setting_value: string;
}

/** Generate a unique object key for uploaded files */
function generateObjectKey(file: File, prefix: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'jpg';
  const safeName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  return `${prefix}/${timestamp}_${randomStr}_${safeName}.${ext}`;
}

/** Resolve an image value (object_key or URL) to a full URL */
async function resolveImageUrl(value: string): Promise<string> {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
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

const AdminSiteImages: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.entities.site_settings.query({ limit: 100 });
      const items: SiteSetting[] = res.data?.items || [];
      const map: Record<string, SiteSetting> = {};
      items.forEach((s) => {
        map[s.setting_key] = s;
      });
      setSettings(map);

      // Resolve image URLs for each slot
      const urlMap: Record<string, string> = {};
      await Promise.all(
        IMAGE_SLOTS.map(async (slot) => {
          const setting = map[slot.key];
          if (setting?.setting_value) {
            urlMap[slot.key] = await resolveImageUrl(setting.setting_value);
          } else {
            urlMap[slot.key] = slot.defaultUrl;
          }
        })
      );
      setImageUrls(urlMap);

      // Set video URL
      const videoSetting = map[VIDEO_SETTING_KEY];
      setVideoUrl(videoSetting?.setting_value || '');
    } catch (e) {
      console.error('Failed to fetch settings:', e);
      toast.error('載入設定失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /** Save/update a single setting */
  const saveSetting = async (key: string, value: string) => {
    const existing = settings[key];
    if (existing) {
      await client.entities.site_settings.update({
        id: String(existing.id),
        data: { setting_key: key, setting_value: value },
      });
    } else {
      await client.entities.site_settings.create({
        data: { setting_key: key, setting_value: value },
      });
    }
  };

  /** Handle image upload for a specific slot */
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: ImageSlot
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('圖片大小不能超過 10MB');
      return;
    }

    setUploadingKey(slot.key);
    try {
      const objectKey = generateObjectKey(file, 'site');
      await client.storage.upload({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
        file,
      });

      await saveSetting(slot.key, objectKey);

      const downloadRes = await client.storage.getDownloadUrl({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
      });
      setImageUrls((prev) => ({
        ...prev,
        [slot.key]: downloadRes.data?.download_url || '',
      }));

      toast.success(`${slot.title} 已更新`);
      await fetchSettings();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('圖片上傳失敗');
    } finally {
      setUploadingKey(null);
      if (inputRefs.current[slot.key]) {
        inputRefs.current[slot.key]!.value = '';
      }
    }
  };

  /** Reset a slot back to its default image */
  const handleResetToDefault = async (slot: ImageSlot) => {
    if (!confirm(`確定要將「${slot.title}」重設為預設圖片嗎？`)) return;
    try {
      const existing = settings[slot.key];
      if (existing) {
        await client.entities.site_settings.update({
          id: String(existing.id),
          data: { setting_key: slot.key, setting_value: '' },
        });
      }
      toast.success(`${slot.title} 已重設為預設圖片`);
      await fetchSettings();
    } catch (e) {
      console.error('Reset failed:', e);
      toast.error('重設失敗');
    }
  };

  /** Save video URL */
  const handleSaveVideo = async () => {
    setSavingVideo(true);
    try {
      await saveSetting(VIDEO_SETTING_KEY, videoUrl.trim());
      toast.success('影片網址已儲存');
      await fetchSettings();
    } catch (e) {
      console.error('Save video failed:', e);
      toast.error('儲存失敗');
    } finally {
      setSavingVideo(false);
    }
  };

  return (
    <Layout>
      <section className="py-16 md:py-20 bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/sn-studio-mgmt-7k3x9q">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">首頁圖片與影片管理</h1>
              <p className="text-sm text-muted-foreground mt-1">
                集中管理首頁各區塊的靜態圖片與關於我們影片網址。每個圖片欄位都標示了實際顯示位置。
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Video URL Section */}
              <Card className="border-sky-200 bg-sky-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Film className="h-5 w-5 text-sky-700" />
                    關於我們 - 影片網址
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    顯示位置：首頁 &gt; 關於我們區塊 &gt; 點擊封面後播放的影片。
                    支援 YouTube 分享網址或 Embed 網址。
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label htmlFor="video_url">YouTube 影片網址</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="video_url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=xxxx 或 https://youtu.be/xxxx"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSaveVideo}
                      disabled={savingVideo}
                      className="bg-foreground text-background hover:bg-foreground/90"
                    >
                      {savingVideo ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      儲存影片網址
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    留空則表示不播放影片，使用者點擊播放按鈕時會顯示提示訊息。
                  </p>
                </CardContent>
              </Card>

              {/* Image Slots */}
              {IMAGE_SLOTS.map((slot) => {
                const currentUrl = imageUrls[slot.key] || slot.defaultUrl;
                const isUploading = uploadingKey === slot.key;
                const hasCustom = !!settings[slot.key]?.setting_value;

                return (
                  <Card key={slot.key}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            {slot.title}
                          </CardTitle>
                          <p className="text-sm text-sky-700 mt-1 font-medium">
                            📍 {slot.location}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {slot.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            建議尺寸：{slot.recommendedSize}
                          </p>
                        </div>
                        {hasCustom && (
                          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full whitespace-nowrap">
                            已自訂
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
                        {/* Preview */}
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                          {currentUrl ? (
                            <img
                              src={currentUrl}
                              alt={slot.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 md:min-w-[160px]">
                          <Button
                            onClick={() => inputRefs.current[slot.key]?.click()}
                            disabled={isUploading}
                            className="bg-foreground text-background hover:bg-foreground/90"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                上傳中...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {hasCustom ? '更換圖片' : '上傳圖片'}
                              </>
                            )}
                          </Button>
                          {hasCustom && (
                            <Button
                              variant="outline"
                              onClick={() => handleResetToDefault(slot)}
                              disabled={isUploading}
                              className="!bg-transparent !hover:bg-transparent"
                            >
                              重設為預設
                            </Button>
                          )}
                          <input
                            ref={(el) => (inputRefs.current[slot.key] = el)}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, slot)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminSiteImages;