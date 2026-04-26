import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { client } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  X,
  Image as ImageIcon,
  Package,
} from 'lucide-react';

const BUCKET_NAME = 'product-images';

const CATEGORY_OPTIONS = [
  { value: 'cis', label: 'CIS 品牌識別' },
  { value: 'commercial', label: '商業空間' },
  { value: 'custom', label: '客製設計' },
  { value: 'lifestyle', label: '生活選品' },
  { value: 'other', label: '其他' },
];

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  specs: string;
  in_stock: boolean;
  is_hot: boolean;
  is_sale: boolean;
}

interface FormData {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  specs: string;
  in_stock: boolean;
  is_hot: boolean;
  is_sale: boolean;
}

const emptyForm: FormData = {
  name: '',
  description: '',
  price: 0,
  category: 'custom',
  image_url: '',
  specs: '',
  in_stock: true,
  is_hot: false,
  is_sale: false,
};

function generateObjectKey(file: File): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'jpg';
  const safeName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  return `products/${timestamp}_${randomStr}_${safeName}.${ext}`;
}

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

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.entities.products.query({
        limit: 200,
        sort: '-created_at',
      });
      const items: Product[] = res.data?.items || [];
      setProducts(items);

      const urlMap: Record<number, string> = {};
      await Promise.all(
        items.map(async (p) => {
          if (p.image_url) {
            urlMap[p.id] = await resolveImageUrl(p.image_url);
          }
        })
      );
      setImageUrls(urlMap);
    } catch (e) {
      console.error('Failed to fetch products:', e);
      toast.error('載入商品失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImagePreview('');
    setDialogOpen(true);
  };

  const openEdit = async (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price || 0,
      category: p.category || 'custom',
      image_url: p.image_url || '',
      specs: p.specs || '',
      in_stock: p.in_stock ?? true,
      is_hot: p.is_hot ?? false,
      is_sale: p.is_sale ?? false,
    });
    if (p.image_url) {
      const url = await resolveImageUrl(p.image_url);
      setImagePreview(url);
    } else {
      setImagePreview('');
    }
    setDialogOpen(true);
  };

  const openDelete = (p: Product) => {
    setDeleting(p);
    setDeleteDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploading(true);
    try {
      const objectKey = generateObjectKey(file);
      await client.storage.upload({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
        file,
      });
      setForm((prev) => ({ ...prev, image_url: objectKey }));
      const res = await client.storage.getDownloadUrl({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
      });
      setImagePreview(res.data?.download_url || '');
      toast.success('圖片上傳成功');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('圖片上傳失敗');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image_url: '' }));
    setImagePreview('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('請填寫商品名稱');
      return;
    }
    if (form.price < 0) {
      toast.error('價格不能為負數');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        category: form.category,
        image_url: form.image_url || '',
        specs: form.specs || '',
        in_stock: form.in_stock,
        is_hot: form.is_hot,
        is_sale: form.is_sale,
      };
      if (editing) {
        await client.entities.products.update({
          id: String(editing.id),
          data: payload,
        });
        toast.success('商品已更新');
      } else {
        await client.entities.products.create({ data: payload });
        toast.success('商品已新增');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (e) {
      console.error('Save failed:', e);
      toast.error(editing ? '更新失敗' : '新增失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await client.entities.products.delete({ id: String(deleting.id) });
      toast.success('商品已刪除');
      setDeleteDialogOpen(false);
      setDeleting(null);
      fetchProducts();
    } catch (e) {
      console.error('Delete failed:', e);
      toast.error('刪除失敗');
    } finally {
      setRemoving(false);
    }
  };

  const toggleFlag = async (p: Product, field: 'in_stock' | 'is_hot' | 'is_sale') => {
    try {
      await client.entities.products.update({
        id: String(p.id),
        data: { [field]: !p[field] },
      });
      fetchProducts();
    } catch (e) {
      console.error('Toggle failed:', e);
      toast.error('更新失敗');
    }
  };

  return (
    <Layout>
      <section className="py-16 md:py-20 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <Link to="/sn-studio-mgmt-7k3x9q">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">商品管理</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  新增、編輯、刪除商品，設定熱銷與特價標籤。
                </p>
              </div>
            </div>
            <Button
              onClick={openCreate}
              className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增商品
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                商品列表（共 {products.length} 筆）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>尚無商品資料</p>
                  <p className="text-sm mt-1">點擊「新增商品」開始建立</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">圖片</TableHead>
                          <TableHead>名稱</TableHead>
                          <TableHead className="w-[100px]">分類</TableHead>
                          <TableHead className="w-[100px]">價格</TableHead>
                          <TableHead className="w-[80px]">熱銷</TableHead>
                          <TableHead className="w-[80px]">特價</TableHead>
                          <TableHead className="w-[80px]">庫存</TableHead>
                          <TableHead className="w-[120px] text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((p) => (
                          <TableRow key={p.id} className={!p.in_stock ? 'opacity-50' : ''}>
                            <TableCell>
                              {imageUrls[p.id] ? (
                                <img
                                  src={imageUrls[p.id]}
                                  alt={p.name}
                                  className="w-14 h-14 object-cover rounded"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-muted rounded flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {CATEGORY_OPTIONS.find((c) => c.value === p.category)?.label ||
                                  p.category}
                              </span>
                            </TableCell>
                            <TableCell>NT$ {p.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <Switch
                                checked={!!p.is_hot}
                                onCheckedChange={() => toggleFlag(p, 'is_hot')}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={!!p.is_sale}
                                onCheckedChange={() => toggleFlag(p, 'is_sale')}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={!!p.in_stock}
                                onCheckedChange={() => toggleFlag(p, 'in_stock')}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(p)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDelete(p)}
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
                  <div className="md:hidden space-y-3">
                    {products.map((p) => (
                      <Card
                        key={p.id}
                        className={`overflow-hidden ${!p.in_stock ? 'opacity-50' : ''}`}
                      >
                        <div className="flex gap-3 p-4">
                          <div className="flex-shrink-0">
                            {imageUrls[p.id] ? (
                              <img
                                src={imageUrls[p.id]}
                                alt={p.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{p.name}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              NT$ {p.price.toLocaleString()}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.is_hot && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                  熱銷
                                </span>
                              )}
                              {p.is_sale && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                  特價
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => openDelete(p)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? '編輯商品' : '新增商品'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                商品名稱 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="商品名稱"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">商品描述</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="簡短的商品描述"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  價格 (NT$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分類</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specs">規格說明</Label>
              <Input
                id="specs"
                value={form.specs}
                onChange={(e) => setForm((prev) => ({ ...prev, specs: e.target.value }))}
                placeholder="例如：尺寸、材質、顏色等"
              />
            </div>

            {/* Flags */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">熱銷商品</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_hot}
                    onCheckedChange={(c) => setForm((prev) => ({ ...prev, is_hot: c }))}
                  />
                  <span className="text-xs text-muted-foreground">
                    {form.is_hot ? '是' : '否'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">特價商品</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_sale}
                    onCheckedChange={(c) => setForm((prev) => ({ ...prev, is_sale: c }))}
                  />
                  <span className="text-xs text-muted-foreground">
                    {form.is_sale ? '是' : '否'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">有庫存</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.in_stock}
                    onCheckedChange={(c) => setForm((prev) => ({ ...prev, in_stock: c }))}
                  />
                  <span className="text-xs text-muted-foreground">
                    {form.in_stock ? '是' : '否'}
                  </span>
                </div>
              </div>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>商品圖片</Label>
              <p className="text-xs text-muted-foreground">建議尺寸：800 × 800 px（1:1 方形）</p>
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="預覽"
                    className="w-full max-h-64 object-contain rounded border bg-muted"
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
                      onClick={removeImage}
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
                      <p className="text-sm text-muted-foreground">點擊上傳商品圖片</p>
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
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="w-full sm:w-auto !bg-transparent !hover:bg-transparent"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || uploading}
              className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto"
            >
              {saving ? '儲存中...' : editing ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-4">
            確定要刪除商品「{deleting?.name}」嗎？此操作無法復原。
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={removing}
              className="w-full sm:w-auto !bg-transparent !hover:bg-transparent"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={removing}
              className="w-full sm:w-auto"
            >
              {removing ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminProducts;