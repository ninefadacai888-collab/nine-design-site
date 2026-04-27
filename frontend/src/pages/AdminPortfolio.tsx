import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

interface FormData {
  title: string;
  description: string;
  category: string;
  cover_image: string;
  images: string;
  client_name: string;
  year: string;
}

interface ImageItem {
  objectKey: string;
  displayUrl: string;
}

const emptyForm: FormData = {
  title: '',
  description: '',
  category: 'cis',
  cover_image: '',
  images: '[]',
  client_name: '',
  year: new Date().getFullYear().toString(),
};

const categoryOptions = [
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
  // If it's already a full URL, return as-is
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  // Otherwise treat as object_key and get download URL
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

const AdminPortfolio: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<PortfolioCase | null>(null);
  const [deletingCase, setDeletingCase] = useState<PortfolioCase | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cover image state
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Additional images state
  const [additionalImages, setAdditionalImages] = useState<ImageItem[]>([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Resolved cover URLs for table display
  const [coverUrls, setCoverUrls] = useState<Record<number, string>>({});

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.entities.portfolio_cases.query({
        limit: 100,
        sort: '-created_at',
      });
      const items = res.data?.items || [];
      setCases(items);

      // Resolve cover image URLs for display
      const urlMap: Record<number, string> = {};
      await Promise.all(
        items.map(async (c: PortfolioCase) => {
          if (c.cover_image) {
            urlMap[c.id] = await resolveImageUrl(c.cover_image);
          }
        })
      );
      setCoverUrls(urlMap);
    } catch (e) {
      console.error('Failed to fetch portfolio cases:', e);
      toast.error('載入案例失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const parseImages = (imagesStr: string): string[] => {
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const openCreateDialog = () => {
    setEditingCase(null);
    setForm(emptyForm);
    setCoverPreview('');
    setAdditionalImages([]);
    setDialogOpen(true);
  };

  const openEditDialog = async (c: PortfolioCase) => {
    setEditingCase(c);
    setForm({
      title: c.title || '',
      description: c.description || '',
      category: c.category || 'cis',
      cover_image: c.cover_image || '',
      images: c.images || '[]',
      client_name: c.client_name || '',
      year: c.year || '',
    });

    // Resolve cover preview
    if (c.cover_image) {
      const url = await resolveImageUrl(c.cover_image);
      setCoverPreview(url);
    } else {
      setCoverPreview('');
    }

    // Resolve additional images
    const imgKeys = parseImages(c.images);
    const resolved: ImageItem[] = await Promise.all(
      imgKeys.map(async (key) => ({
        objectKey: key,
        displayUrl: await resolveImageUrl(key),
      }))
    );
    setAdditionalImages(resolved);

    setDialogOpen(true);
  };

  const openDeleteDialog = (c: PortfolioCase) => {
    setDeletingCase(c);
    setDeleteDialogOpen(true);
  };

  const handleFormChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** Upload cover image file */
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('圖片大小不能超過 10MB');
      return;
    }

    setCoverUploading(true);
    try {
      const objectKey = generateObjectKey(file, 'covers');
      const res = await client.storage.upload({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
        file: file,
      });

      // Store the object_key in form
      handleFormChange('cover_image', objectKey);

      // Get download URL for preview
      const downloadRes = await client.storage.getDownloadUrl({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
      });
      setCoverPreview(downloadRes.data?.download_url || '');

      toast.success('封面圖片上傳成功');
    } catch (err) {
      console.error('Cover upload failed:', err);
      toast.error('封面圖片上傳失敗');
    } finally {
      setCoverUploading(false);
      // Reset file input
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  /** Remove cover image */
  const removeCoverImage = () => {
    handleFormChange('cover_image', '');
    setCoverPreview('');
  };

  /** Upload additional images */
  const handleAdditionalImagesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate all files
    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith('image/')) {
        toast.error(`「${files[i].name}」不是圖片檔案`);
        return;
      }
      if (files[i].size > 10 * 1024 * 1024) {
        toast.error(`「${files[i].name}」大小超過 10MB`);
        return;
      }
    }

    setImagesUploading(true);
    try {
      const newImages: ImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const objectKey = generateObjectKey(file, 'gallery');

        await client.storage.upload({
          bucket_name: BUCKET_NAME,
          object_key: objectKey,
          file: file,
        });

        const downloadRes = await client.storage.getDownloadUrl({
          bucket_name: BUCKET_NAME,
          object_key: objectKey,
        });

        newImages.push({
          objectKey,
          displayUrl: downloadRes.data?.download_url || '',
        });
      }

      setAdditionalImages((prev) => [...prev, ...newImages]);
      toast.success(`已上傳 ${files.length} 張圖片`);
    } catch (err) {
      console.error('Images upload failed:', err);
      toast.error('圖片上傳失敗');
    } finally {
      setImagesUploading(false);
      if (imagesInputRef.current) {
        imagesInputRef.current.value = '';
      }
    }
  };

  /** Remove an additional image */
  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('請填寫案例標題');
      return;
    }
    if (!form.category) {
      toast.error('請選擇分類');
      return;
    }

    setSaving(true);
    try {
      // Collect additional image keys
      const imageKeys = additionalImages.map((img) => img.objectKey);
      const payload = {
        ...form,
        images: JSON.stringify(imageKeys),
      };

      if (editingCase) {
        await client.entities.portfolio_cases.update({
          id: String(editingCase.id),
          data: payload,
        });
        toast.success('案例已更新');
      } else {
        await client.entities.portfolio_cases.create({
          data: payload,
        });
        toast.success('案例已新增');
      }

      setDialogOpen(false);
      fetchCases();
    } catch (e) {
      console.error('Save failed:', e);
      toast.error(editingCase ? '更新失敗' : '新增失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCase) return;
    setDeleting(true);
    try {
      await client.entities.portfolio_cases.delete({
        id: String(deletingCase.id),
      });
      toast.success('案例已刪除');
      setDeleteDialogOpen(false);
      setDeletingCase(null);
      fetchCases();
    } catch (e) {
      console.error('Delete failed:', e);
      toast.error('刪除失敗');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <section className="py-16 md:py-20 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/sn-studio-mgmt-7k3x9q">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">作品案例管理</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  管理所有作品案例的新增、編輯與刪除
                </p>
              </div>
            </div>
            <Button
              onClick={openCreateDialog}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增案例
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                案例列表（共 {cases.length} 筆）
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
              ) : cases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>尚無案例資料</p>
                  <p className="text-sm mt-1">點擊「新增案例」開始建立</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">封面</TableHead>
                        <TableHead>標題</TableHead>
                        <TableHead>分類</TableHead>
                        <TableHead>客戶</TableHead>
                        <TableHead>年份</TableHead>
                        <TableHead className="text-right w-[120px]">
                          操作
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            {coverUrls[c.id] ? (
                              <img
                                src={coverUrls[c.id]}
                                alt={c.title}
                                className="w-16 h-12 object-cover rounded"
                              />
                            ) : c.cover_image ? (
                              <img
                                src={c.cover_image}
                                alt={c.title}
                                className="w-16 h-12 object-cover rounded"
                                onError={(e) => {
                                  (
                                    e.target as HTMLImageElement
                                  ).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {c.title}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 bg-muted rounded">
                              {categoryLabel[c.category] || c.category}
                            </span>
                          </TableCell>
                          <TableCell>{c.client_name || '-'}</TableCell>
                          <TableCell>{c.year || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(c)}
                                title="編輯"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(c)}
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
              {editingCase ? '編輯案例' : '新增案例'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">標題 *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="案例標題"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分類 *</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => handleFormChange('category', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">客戶名稱</Label>
                <Input
                  id="client_name"
                  value={form.client_name}
                  onChange={(e) =>
                    handleFormChange('client_name', e.target.value)
                  }
                  placeholder="客戶名稱"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">年份</Label>
                <Input
                  id="year"
                  value={form.year}
                  onChange={(e) => handleFormChange('year', e.target.value)}
                  placeholder="例如 2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  handleFormChange('description', e.target.value)
                }
                placeholder="案例描述"
                rows={3}
              />
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>封面圖片</Label>
              {coverPreview ? (
                <div className="relative group">
                  <img
                    src={coverPreview}
                    alt="封面預覽"
                    className="w-full max-h-48 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={coverUploading}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      更換
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeCoverImage}
                    >
                      <X className="h-3 w-3 mr-1" />
                      移除
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        上傳中...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        點擊上傳封面圖片
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        支援 JPG、PNG、WebP，最大 10MB
                      </p>
                    </div>
                  )}
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            {/* Additional Images Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>其他圖片</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imagesInputRef.current?.click()}
                  disabled={imagesUploading}
                >
                  {imagesUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      上傳圖片
                    </>
                  )}
                </Button>
              </div>
              <input
                ref={imagesInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAdditionalImagesUpload}
              />

              {additionalImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {additionalImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.displayUrl}
                        alt={`圖片 ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {/* Add more button */}
                  <div
                    className="w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => imagesInputRef.current?.click()}
                  >
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => imagesInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      點擊上傳更多圖片（可多選）
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      支援 JPG、PNG、WebP，每張最大 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || coverUploading || imagesUploading}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {saving ? '儲存中...' : editingCase ? '更新' : '新增'}
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
            確定要刪除案例「{deletingCase?.title}」嗎？此操作無法復原。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminPortfolio;