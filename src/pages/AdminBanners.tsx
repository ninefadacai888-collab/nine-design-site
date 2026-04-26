import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Loader2,
  X,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BUCKET_NAME = 'banner-images';

interface Banner {
  id: number;
  title: string;
  image_url: string;
  mobile_image_url?: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

interface FormData {
  title: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormData = {
  title: '',
  image_url: '',
  mobile_image_url: '',
  link_url: '',
  sort_order: 0,
  is_active: true,
};

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

/* ── Device preview sizes ── */
const PREVIEW_DEVICES = [
  { key: 'desktop', label: '桌機 1920×1080', width: 960, height: 540, icon: Monitor, useDesktop: true },
  { key: 'laptop', label: '筆電 1440×900', width: 720, height: 450, icon: Monitor, useDesktop: true },
  { key: 'tablet', label: '平板 768×1024', width: 384, height: 512, icon: Tablet, useDesktop: true },
  { key: 'mobile', label: '手機 375×812', width: 187, height: 406, icon: Smartphone, useDesktop: false },
];

const AdminBanners: React.FC = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Desktop image state
  const [desktopPreview, setDesktopPreview] = useState<string>('');
  const [desktopUploading, setDesktopUploading] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  // Mobile image state
  const [mobilePreview, setMobilePreview] = useState<string>('');
  const [mobileUploading, setMobileUploading] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Resolved image URLs for table display
  const [desktopUrls, setDesktopUrls] = useState<Record<number, string>>({});
  const [mobileUrls, setMobileUrls] = useState<Record<number, string>>({});

  // Preview resolved URLs
  const [previewDesktopUrl, setPreviewDesktopUrl] = useState('');
  const [previewMobileUrl, setPreviewMobileUrl] = useState('');

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.entities.banners.query({
        limit: 100,
        sort: 'sort_order',
      });
      const items = res.data?.items || [];
      setBanners(items);

      // Resolve image URLs for display
      const dUrlMap: Record<number, string> = {};
      const mUrlMap: Record<number, string> = {};
      await Promise.all(
        items.map(async (b: Banner) => {
          if (b.image_url) {
            dUrlMap[b.id] = await resolveImageUrl(b.image_url);
          }
          if (b.mobile_image_url) {
            mUrlMap[b.id] = await resolveImageUrl(b.mobile_image_url);
          }
        })
      );
      setDesktopUrls(dUrlMap);
      setMobileUrls(mUrlMap);
    } catch (e) {
      console.error('Failed to fetch banners:', e);
      toast.error('載入 Banner 失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreateDialog = () => {
    setEditingBanner(null);
    setForm(emptyForm);
    setDesktopPreview('');
    setMobilePreview('');
    setDialogOpen(true);
  };

  const openEditDialog = async (b: Banner) => {
    setEditingBanner(b);
    setForm({
      title: b.title || '',
      image_url: b.image_url || '',
      mobile_image_url: b.mobile_image_url || '',
      link_url: b.link_url || '',
      sort_order: b.sort_order ?? 0,
      is_active: b.is_active ?? true,
    });

    if (b.image_url) {
      const url = await resolveImageUrl(b.image_url);
      setDesktopPreview(url);
    } else {
      setDesktopPreview('');
    }

    if (b.mobile_image_url) {
      const url = await resolveImageUrl(b.mobile_image_url);
      setMobilePreview(url);
    } else {
      setMobilePreview('');
    }

    setDialogOpen(true);
  };

  const openDeleteDialog = (b: Banner) => {
    setDeletingBanner(b);
    setDeleteDialogOpen(true);
  };

  const openPreviewDialog = async (b: Banner) => {
    setPreviewBanner(b);
    const dUrl = b.image_url ? await resolveImageUrl(b.image_url) : '';
    const mUrl = b.mobile_image_url ? await resolveImageUrl(b.mobile_image_url) : '';
    setPreviewDesktopUrl(dUrl);
    setPreviewMobileUrl(mUrl);
    setPreviewDialogOpen(true);
  };

  const handleFormChange = (field: keyof FormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** Upload image file */
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'desktop' | 'mobile'
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

    const setUploading = type === 'desktop' ? setDesktopUploading : setMobileUploading;
    const setPreview = type === 'desktop' ? setDesktopPreview : setMobilePreview;
    const formField = type === 'desktop' ? 'image_url' : 'mobile_image_url';
    const inputRef = type === 'desktop' ? desktopInputRef : mobileInputRef;

    setUploading(true);
    try {
      const objectKey = generateObjectKey(file, type === 'desktop' ? 'desktop' : 'mobile');
      await client.storage.upload({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
        file: file,
      });

      handleFormChange(formField, objectKey);

      const downloadRes = await client.storage.getDownloadUrl({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
      });
      setPreview(downloadRes.data?.download_url || '');

      toast.success(`${type === 'desktop' ? '桌機版' : '手機版'}圖片上傳成功`);
    } catch (err) {
      console.error(`${type} image upload failed:`, err);
      toast.error(`${type === 'desktop' ? '桌機版' : '手機版'}圖片上傳失敗`);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const removeImage = (type: 'desktop' | 'mobile') => {
    if (type === 'desktop') {
      handleFormChange('image_url', '');
      setDesktopPreview('');
    } else {
      handleFormChange('mobile_image_url', '');
      setMobilePreview('');
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('請填寫 Banner 標題');
      return;
    }
    if (!form.image_url) {
      toast.error('請上傳桌機版圖片');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        image_url: form.image_url,
        mobile_image_url: form.mobile_image_url || '',
        link_url: form.link_url || '',
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      if (editingBanner) {
        await client.entities.banners.update({
          id: String(editingBanner.id),
          data: payload,
        });
        toast.success('Banner 已更新');
      } else {
        await client.entities.banners.create({
          data: payload,
        });
        toast.success('Banner 已新增');
      }

      setDialogOpen(false);
      fetchBanners();
    } catch (e) {
      console.error('Save failed:', e);
      toast.error(editingBanner ? '更新失敗' : '新增失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBanner) return;
    setDeleting(true);
    try {
      await client.entities.banners.delete({
        id: String(deletingBanner.id),
      });
      toast.success('Banner 已刪除');
      setDeleteDialogOpen(false);
      setDeletingBanner(null);
      fetchBanners();
    } catch (e) {
      console.error('Delete failed:', e);
      toast.error('刪除失敗');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      await client.entities.banners.update({
        id: String(b.id),
        data: { is_active: !b.is_active },
      });
      toast.success(b.is_active ? 'Banner 已停用' : 'Banner 已啟用');
      fetchBanners();
    } catch (e) {
      console.error('Toggle active failed:', e);
      toast.error('更新狀態失敗');
    }
  };

  /** Render image upload section */
  const renderImageUpload = (
    type: 'desktop' | 'mobile',
    preview: string,
    uploading: boolean,
    inputRef: React.RefObject<HTMLInputElement>,
    recommendedSize: string
  ) => {
    const label = type === 'desktop' ? '桌機版圖片' : '手機版圖片';
    const required = type === 'desktop';

    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <p className="text-xs text-muted-foreground">建議尺寸：{recommendedSize}</p>
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt={`${label}預覽`}
              className="w-full max-h-40 object-cover rounded border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-3 w-3 mr-1" />
                更換
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeImage(type)}
              >
                <X className="h-3 w-3 mr-1" />
                移除
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">上傳中...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">點擊上傳{label}</p>
                <p className="text-xs text-muted-foreground/70">
                  支援 JPG、PNG、WebP，最大 10MB
                </p>
              </div>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e, type)}
        />
      </div>
    );
  };

  return (
    <Layout>
      <section className="py-16 md:py-20 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <Link to="/sn-studio-mgmt-7k3x9q">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Banner 管理</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  管理首頁輪播 Banner 的新增、編輯與刪除
                </p>
              </div>
            </div>
            <Button
              onClick={openCreateDialog}
              className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增 Banner
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Banner 列表（共 {banners.length} 筆）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : banners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>尚無 Banner 資料</p>
                  <p className="text-sm mt-1">點擊「新增 Banner」開始建立</p>
                </div>
              ) : (
                <>
                  {/* Desktop table view */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">桌機圖</TableHead>
                          <TableHead className="w-[80px]">手機圖</TableHead>
                          <TableHead>標題</TableHead>
                          <TableHead className="w-[80px]">排序</TableHead>
                          <TableHead className="w-[80px]">狀態</TableHead>
                          <TableHead className="text-right w-[150px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {banners.map((b) => (
                          <TableRow key={b.id} className={!b.is_active ? 'opacity-50' : ''}>
                            <TableCell>
                              {desktopUrls[b.id] ? (
                                <img
                                  src={desktopUrls[b.id]}
                                  alt={b.title}
                                  className="w-24 h-14 object-cover rounded"
                                />
                              ) : (
                                <div className="w-24 h-14 bg-muted rounded flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {mobileUrls[b.id] ? (
                                <img
                                  src={mobileUrls[b.id]}
                                  alt={`${b.title} 手機版`}
                                  className="w-10 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-10 h-16 bg-muted rounded flex items-center justify-center">
                                  <Smartphone className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{b.title}</TableCell>
                            <TableCell>
                              <span className="text-sm bg-muted px-2 py-1 rounded">
                                {b.sort_order}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={b.is_active}
                                onCheckedChange={() => handleToggleActive(b)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openPreviewDialog(b)}
                                  title="預覽"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(b)}
                                  title="編輯"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(b)}
                                  title="刪除"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile card view */}
                  <div className="md:hidden space-y-4">
                    {banners.map((b) => (
                      <Card key={b.id} className={`overflow-hidden ${!b.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex gap-3 p-4">
                          <div className="flex-shrink-0">
                            {desktopUrls[b.id] ? (
                              <img
                                src={desktopUrls[b.id]}
                                alt={b.title}
                                className="w-20 h-14 object-cover rounded"
                              />
                            ) : (
                              <div className="w-20 h-14 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{b.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                排序: {b.sort_order}
                              </span>
                              {mobileUrls[b.id] && (
                                <span className="text-xs text-green-600 flex items-center gap-0.5">
                                  <Smartphone className="h-3 w-3" />
                                  手機圖
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <Switch
                                checked={b.is_active}
                                onCheckedChange={() => handleToggleActive(b)}
                              />
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openPreviewDialog(b)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(b)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => openDeleteDialog(b)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? '編輯 Banner' : '新增 Banner'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                標題 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Banner 標題"
              />
            </div>

            {/* Sort order & Active */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">排序（數字越小越前面）</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => handleFormChange('sort_order', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>啟用狀態</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => handleFormChange('is_active', checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.is_active ? '已啟用' : '已停用'}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Image Upload */}
            {renderImageUpload(
              'desktop',
              desktopPreview,
              desktopUploading,
              desktopInputRef as React.RefObject<HTMLInputElement>,
              '1920 × 800 px（寬幅橫式）'
            )}

            {/* Mobile Image Upload */}
            {renderImageUpload(
              'mobile',
              mobilePreview,
              mobileUploading,
              mobileInputRef as React.RefObject<HTMLInputElement>,
              '750 × 1200 px（直式）'
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || desktopUploading || mobileUploading}
              className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto"
            >
              {saving ? '儲存中...' : editingBanner ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - 4 device sizes */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Banner 裝置預覽 — {previewBanner?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <p className="text-sm text-muted-foreground">
              以下為 4 種常見裝置尺寸的 Banner 預覽效果，手機版會顯示手機專用圖片（若有設定）。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PREVIEW_DEVICES.map((device) => {
                const imgUrl = device.useDesktop
                  ? previewDesktopUrl
                  : previewMobileUrl || previewDesktopUrl;

                return (
                  <div key={device.key} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <device.icon className="h-4 w-4 text-muted-foreground" />
                      {device.label}
                      {!device.useDesktop && previewMobileUrl && (
                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          手機版圖
                        </span>
                      )}
                      {!device.useDesktop && !previewMobileUrl && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          使用桌機圖
                        </span>
                      )}
                    </div>
                    <div
                      className="border rounded-lg overflow-hidden bg-muted/30 mx-auto"
                      style={{
                        width: `${Math.min(device.width, 480)}px`,
                        height: `${Math.min(device.height, 300)}px`,
                        maxWidth: '100%',
                      }}
                    >
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={`${device.label} 預覽`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-4">
            確定要刪除 Banner「{deletingBanner?.title}」嗎？此操作無法復原。
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminBanners;