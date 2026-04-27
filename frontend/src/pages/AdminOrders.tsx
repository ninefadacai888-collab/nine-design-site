import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { client } from '@/lib/api';

/**
 * Order record as stored in the backend entity.
 */
interface OrderRecord {
  id: number;
  user_id: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  shipping_address?: string | null;
  note?: string | null;
  total_amount: number;
  status?: string | null;
  payment_status?: string | null;
  shipping_method?: string | null;
  shipping_region?: string | null;
  shipping_fee?: number | null;
  subtotal_amount?: number | null;
  cvs_store_id?: string | null;
  cvs_store_name?: string | null;
  cvs_store_address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const SHIPPING_METHOD_LABEL: Record<string, string> = {
  home_tw: '🏠 宅配(台灣)',
  home_overseas: '✈️ 宅配(海外)',
  cvs_711: '🏪 7-11店取',
};

const SHIPPING_METHOD_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'cvs_711', label: '🏪 7-11 店到店' },
  { value: 'home_tw', label: '🏠 宅配(台灣)' },
  { value: 'home_overseas', label: '✈️ 宅配(海外)' },
];

const SHIPPING_REGION_LABEL: Record<string, string> = {
  taiwan: '台灣',
  hk_mo: '港澳',
  overseas: '海外',
};

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待處理' },
  { value: 'processing', label: '處理中' },
  { value: 'shipped', label: '已出貨' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'unpaid', label: '未付款' },
  { value: 'pending_verify', label: '待驗證' },
  { value: 'paid', label: '已付款' },
  { value: 'refunded', label: '已退款' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: '待處理',
  processing: '處理中',
  shipped: '已出貨',
  completed: '已完成',
  cancelled: '已取消',
};

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: '未付款',
  pending_verify: '待驗證',
  paid: '已付款',
  refunded: '已退款',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-200 text-slate-700 border-slate-300',
};

const PAYMENT_COLOR: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-800 border-red-200',
  pending_verify: 'bg-amber-100 text-amber-800 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  refunded: 'bg-slate-200 text-slate-700 border-slate-300',
};

/** Format ISO datetime as "YYYY-MM-DD HH:mm" in local time. */
const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return iso;
  }
};

/**
 * Escape a single CSV field: wraps in quotes and doubles internal quotes.
 * Adds a BOM at the file level so Excel opens UTF-8 Chinese correctly.
 */
const csvEscape = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [shippingFilter, setShippingFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Fetch with a generous limit; admin tables are typically small-to-medium scale.
      const res = await client.entities.orders.list({
        skip: 0,
        limit: 1000,
        sort: '-created_at',
      });
      // SDK responses may be shaped as { data: { items } } or { items }
      const payload: { items?: OrderRecord[] } =
        (res as { data?: { items?: OrderRecord[] } })?.data ??
        (res as { items?: OrderRecord[] }) ??
        {};
      const items: OrderRecord[] = payload.items ?? [];
      setOrders(items);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('載入訂單失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Apply search + filters
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && (o.status || '') !== statusFilter)
        return false;
      if (
        paymentFilter !== 'all' &&
        (o.payment_status || '') !== paymentFilter
      )
        return false;
      if (
        shippingFilter !== 'all' &&
        (o.shipping_method || '') !== shippingFilter
      )
        return false;
      if (dateFrom) {
        const created = o.created_at ? new Date(o.created_at) : null;
        if (!created || created < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const created = o.created_at ? new Date(o.created_at) : null;
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (!created || created > end) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [
          String(o.id),
          o.customer_name,
          o.customer_phone,
          o.customer_email,
          o.shipping_address,
          o.cvs_store_name,
          o.cvs_store_address,
          o.note,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, paymentFilter, shippingFilter, dateFrom, dateTo]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [filtered]
  );

  /** Build filename with timestamp suffix. */
  const buildFilename = (ext: string) => {
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(
      2,
      '0'
    )}${String(d.getMinutes()).padStart(2, '0')}`;
    return `orders_${stamp}.${ext}`;
  };

  const exportRows = () => {
    const headers = [
      '訂單編號',
      '建立時間',
      '客戶姓名',
      '電話',
      'Email',
      '配送方式',
      '配送地區',
      '7-11門市名稱',
      '7-11門市店號',
      '7-11門市地址',
      '收件地址',
      '商品小計',
      '運費',
      '訂單總額',
      '訂單狀態',
      '付款狀態',
      '備註',
    ];
    const rows = filtered.map((o) => {
      const isCvs = o.shipping_method === 'cvs_711';
      const methodLabel =
        SHIPPING_METHOD_LABEL[o.shipping_method || ''] ||
        o.shipping_method ||
        '';
      const regionLabel =
        SHIPPING_REGION_LABEL[o.shipping_region || ''] ||
        o.shipping_region ||
        '';
      const subtotal = o.subtotal_amount ?? (o.total_amount - (o.shipping_fee || 0));
      return [
        o.id,
        formatDateTime(o.created_at),
        o.customer_name ?? '',
        o.customer_phone ?? '',
        o.customer_email ?? '',
        methodLabel,
        regionLabel,
        isCvs ? o.cvs_store_name ?? '' : '',
        isCvs ? o.cvs_store_id ?? '' : '',
        isCvs ? o.cvs_store_address ?? '' : '',
        isCvs ? '' : o.shipping_address ?? '',
        subtotal ?? 0,
        o.shipping_fee ?? 0,
        o.total_amount ?? 0,
        STATUS_LABEL[o.status || ''] || o.status || '',
        PAYMENT_LABEL[o.payment_status || ''] || o.payment_status || '',
        o.note ?? '',
      ];
    });
    return { headers, rows };
  };

  /** Export as CSV (UTF-8 with BOM for Excel compatibility). */
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.warning('目前沒有可匯出的訂單');
      return;
    }
    const { headers, rows } = exportRows();
    const lines = [
      headers.map(csvEscape).join(','),
      ...rows.map((r) => r.map(csvEscape).join(',')),
    ];
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildFilename('csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`已匯出 ${filtered.length} 筆訂單 (CSV)`);
  };

  /**
   * Export as Excel-compatible XLS file using the SpreadsheetML 2003 XML format.
   * This avoids heavy dependencies and opens natively in Excel / Numbers / LibreOffice.
   */
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast.warning('目前沒有可匯出的訂單');
      return;
    }
    const { headers, rows } = exportRows();

    const escapeXml = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const headerCells = headers
      .map(
        (h) =>
          `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escapeXml(
            h
          )}</Data></Cell>`
      )
      .join('');

    const bodyRows = rows
      .map((row) => {
        const cells = row
          .map((val, idx) => {
            // columns: 0=id, 11=subtotal, 12=shipping_fee, 13=total_amount
            if (idx === 0 || idx === 11 || idx === 12 || idx === 13) {
              const num = Number(val);
              if (Number.isFinite(num)) {
                return `<Cell><Data ss:Type="Number">${num}</Data></Cell>`;
              }
            }
            return `<Cell><Data ss:Type="String">${escapeXml(
              val
            )}</Data></Cell>`;
          })
          .join('');
        return `<Row>${cells}</Row>`;
      })
      .join('');

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<?mso-application progid="Excel.Sheet"?>\n` +
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n` +
      ` xmlns:o="urn:schemas-microsoft-com:office:office"\n` +
      ` xmlns:x="urn:schemas-microsoft-com:office:excel"\n` +
      ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n` +
      ` xmlns:html="http://www.w3.org/TR/REC-html40">\n` +
      `<Styles>\n` +
      `<Style ss:ID="sHeader"><Font ss:Bold="1"/>` +
      `<Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/></Style>\n` +
      `</Styles>\n` +
      `<Worksheet ss:Name="Orders">\n` +
      `<Table>\n` +
      `<Row>${headerCells}</Row>\n` +
      `${bodyRows}\n` +
      `</Table>\n` +
      `</Worksheet>\n` +
      `</Workbook>`;

    const blob = new Blob([xml], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildFilename('xls');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`已匯出 ${filtered.length} 筆訂單 (Excel)`);
  };

  const updateOrderField = async (
    id: number,
    field: 'status' | 'payment_status',
    value: string
  ) => {
    try {
      await client.entities.orders.update(id, { data: { [field]: value } });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
      );
      toast.success('已更新');
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('更新失敗');
    }
  };

  return (
    <Layout>
      <section className="py-10 md:py-14 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <Link to="/sn-studio-mgmt-7k3x9q">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  返回管理中心
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">訂單管理</h1>
              <p className="text-sm text-muted-foreground mt-1">
                查看、搜尋、匯出訂單並更新訂單 / 付款狀態。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadOrders}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`}
                />
                重新整理
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={filtered.length === 0}
              >
                <FileText className="h-4 w-4 mr-1" />
                匯出 CSV
              </Button>
              <Button
                size="sm"
                onClick={handleExportExcel}
                disabled={filtered.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                匯出 Excel
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  訂單筆數（篩選後）
                </div>
                <div className="text-2xl font-bold mt-1">
                  {filtered.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">總金額</div>
                <div className="text-2xl font-bold mt-1 text-emerald-600">
                  NT${totalAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">總訂單數</div>
                <div className="text-2xl font-bold mt-1">{orders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  待處理訂單
                </div>
                <div className="text-2xl font-bold mt-1 text-amber-600">
                  {orders.filter((o) => o.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">搜尋與篩選</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="搜尋訂單編號 / 姓名 / 電話 / Email / 門市..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="訂單狀態" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        狀態：{o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={paymentFilter}
                  onValueChange={setPaymentFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="付款狀態" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        付款：{o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={shippingFilter}
                  onValueChange={setShippingFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="配送方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_METHOD_FILTER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        配送：{o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="起"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="迄"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead className="min-w-[140px]">建立時間</TableHead>
                    <TableHead>客戶</TableHead>
                    <TableHead>聯絡方式</TableHead>
                    <TableHead className="min-w-[180px]">配送資訊</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>訂單狀態</TableHead>
                    <TableHead>付款狀態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        載入中...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        {orders.length === 0
                          ? '目前尚無訂單。'
                          : '沒有符合條件的訂單。'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((o) => {
                      const isCvs = o.shipping_method === 'cvs_711';
                      const methodLabel =
                        SHIPPING_METHOD_LABEL[o.shipping_method || ''] ||
                        '—';
                      return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">
                          #{o.id}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDateTime(o.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {o.customer_name || '—'}
                          </div>
                          {!isCvs && o.shipping_address && (
                            <div className="text-xs text-muted-foreground max-w-[220px] truncate">
                              {o.shipping_address}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{o.customer_phone || ''}</div>
                          <div className="text-muted-foreground">
                            {o.customer_email || ''}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{methodLabel}</div>
                          {isCvs && o.cvs_store_name && (
                            <div className="text-muted-foreground mt-0.5 max-w-[200px] truncate">
                              {o.cvs_store_name}
                              {o.cvs_store_id && (
                                <span className="text-slate-400 ml-1">
                                  ({o.cvs_store_id})
                                </span>
                              )}
                            </div>
                          )}
                          {o.shipping_region &&
                            o.shipping_method === 'home_overseas' && (
                              <div className="text-muted-foreground mt-0.5">
                                {SHIPPING_REGION_LABEL[o.shipping_region] ||
                                  o.shipping_region}
                              </div>
                            )}
                          {(o.shipping_fee ?? 0) > 0 && (
                            <div className="text-amber-700 mt-0.5">
                              運費 NT${(o.shipping_fee || 0).toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">
                            NT${(o.total_amount || 0).toLocaleString()}
                          </div>
                          {o.subtotal_amount != null &&
                            (o.shipping_fee ?? 0) > 0 && (
                              <div className="text-xs text-muted-foreground">
                                小計 NT$
                                {(o.subtotal_amount || 0).toLocaleString()}
                              </div>
                            )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={o.status || 'pending'}
                            onValueChange={(v) =>
                              updateOrderField(o.id, 'status', v)
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue>
                                <Badge
                                  variant="outline"
                                  className={
                                    STATUS_COLOR[o.status || 'pending'] ||
                                    'bg-slate-100'
                                  }
                                >
                                  {STATUS_LABEL[o.status || 'pending'] ||
                                    o.status ||
                                    '待處理'}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.filter(
                                (s) => s.value !== 'all'
                              ).map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={o.payment_status || 'unpaid'}
                            onValueChange={(v) =>
                              updateOrderField(o.id, 'payment_status', v)
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue>
                                <Badge
                                  variant="outline"
                                  className={
                                    PAYMENT_COLOR[
                                      o.payment_status || 'unpaid'
                                    ] || 'bg-slate-100'
                                  }
                                >
                                  {PAYMENT_LABEL[
                                    o.payment_status || 'unpaid'
                                  ] ||
                                    o.payment_status ||
                                    '未付款'}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_STATUS_OPTIONS.filter(
                                (s) => s.value !== 'all'
                              ).map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Download className="h-3.5 w-3.5" />
            匯出會套用目前的搜尋與篩選條件。Excel 匯出為 .xls（相容
            Excel/Numbers/LibreOffice）；CSV 含 UTF-8 BOM 可直接在 Excel 開啟。
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminOrders;