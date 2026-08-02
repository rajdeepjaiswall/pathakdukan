import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Users, ShoppingCart, CreditCard, Search, Eye } from 'lucide-react';
import InvoiceDialog from '@/components/invoice/InvoiceDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { formatPrice } from '@/lib/cart';
import type { Order, User, ManualPaymentDetails } from '@shared/schema';

const HOME_STATE = 'Uttar Pradesh';

function normalizeState(s?: string | null) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitGst(order: Order) {
  const subtotal = parseFloat(order.subtotal?.toString() || '0');
  const gstAmount = parseFloat(order.gstAmount?.toString() || '0');
  const total = parseFloat(order.total?.toString() || '0');
  const deliveryState = (order.deliveryAddress as any)?.state as string | undefined;
  const isIntraState = normalizeState(deliveryState) === normalizeState(HOME_STATE);
  const cgst = isIntraState ? gstAmount / 2 : 0;
  const sgst = isIntraState ? gstAmount / 2 : 0;
  const igst = isIntraState ? 0 : gstAmount;
  return { subtotal, cgst, sgst, igst, total, deliveryState: deliveryState || '-' };
}

export default function Reports() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('orders');

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const initialStart = sevenDaysAgo.toISOString().split('T')[0];
  const initialEnd = today.toISOString().split('T')[0];

  // Filter inputs (what's in the form)
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Applied filters (what the query actually uses) — only updated when Search is clicked
  const [applied, setApplied] = useState<{ start: string; end: string; paymentMethod: string } | null>(null);

  // Invoice preview dialog
  const [invoiceOrderId, setInvoiceOrderId] = useState<number | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const openInvoice = (id: number) => { setInvoiceOrderId(id); setInvoiceOpen(true); };

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
    setLocation('/admin/login');
    return null;
  }

  const handleSearch = () => {
    setApplied({ start: startDate, end: endDate, paymentMethod: paymentFilter });
  };

  const { data: ordersData, isLoading: ordersLoading, isFetching: ordersFetching } = useQuery<Order[]>({
    queryKey: ['/api/admin/reports/orders', applied?.start, applied?.end, applied?.paymentMethod],
    queryFn: async () => {
      const methodParam = applied!.paymentMethod === 'all' ? '' : `&paymentMethod=${applied!.paymentMethod}`;
      const res = await fetch(
        `/api/admin/reports/orders?startDate=${applied!.start}&endDate=${applied!.end}${methodParam}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: activeTab === 'orders' && !!applied,
  });

  const { data: customersData, isLoading: customersLoading } = useQuery<User[]>({
    queryKey: ['/api/super-admin/reports/customers', startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/super-admin/reports/customers?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    },
    enabled: activeTab === 'customers' && user.role === 'super_admin'
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<ManualPaymentDetails[]>({
    queryKey: ['/api/super-admin/reports/payments', startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/super-admin/reports/payments?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
    enabled: activeTab === 'payments' && user.role === 'super_admin'
  });

  const orderRows = useMemo(() => (ordersData || []).map(o => ({ order: o, ...splitGst(o) })), [ordersData]);

  const totals = useMemo(() => {
    return orderRows.reduce(
      (acc, r) => ({
        subtotal: acc.subtotal + r.subtotal,
        cgst: acc.cgst + r.cgst,
        sgst: acc.sgst + r.sgst,
        igst: acc.igst + r.igst,
        total: acc.total + r.total,
      }),
      { subtotal: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
  }, [orderRows]);

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const setToday = () => {
    const d = new Date().toISOString().split('T')[0];
    setStartDate(d);
    setEndDate(d);
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const s = d.toISOString().split('T')[0];
    setStartDate(s);
    setEndDate(s);
  };

  const downloadCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h] ?? '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${startDate}_to_${endDate}.csv`;
    link.click();
  };

  const exportOrders = () => {
    if (!orderRows.length) return;
    const exportData = orderRows.map(r => ({
      'Order #': r.order.orderNumber,
      'Date': new Date(r.order.deliveryDate || r.order.orderDate!).toLocaleDateString('en-IN'),
      'State': r.deliveryState,
      'Price': r.subtotal.toFixed(2),
      'CGST': r.cgst.toFixed(2),
      'SGST': r.sgst.toFixed(2),
      'IGST': r.igst.toFixed(2),
      'Grand Total': r.total.toFixed(2),
    }));
    exportData.push({
      'Order #': 'TOTAL',
      'Date': '',
      'State': '',
      'Price': totals.subtotal.toFixed(2),
      'CGST': totals.cgst.toFixed(2),
      'SGST': totals.sgst.toFixed(2),
      'IGST': totals.igst.toFixed(2),
      'Grand Total': totals.total.toFixed(2),
    });
    downloadCSV(exportData, 'sales_report', ['Order #', 'Date', 'State', 'Price', 'CGST', 'SGST', 'IGST', 'Grand Total']);
  };

  const exportCustomers = () => {
    if (!customersData) return;
    const exportData = customersData.map(c => ({
      Name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.username,
      Email: c.email,
      Phone: c.phone || '',
      JoinedDate: new Date(c.createdAt!).toLocaleDateString()
    }));
    downloadCSV(exportData, 'customers', ['Name', 'Email', 'Phone', 'JoinedDate']);
  };

  const exportPayments = () => {
    if (!paymentsData) return;
    const exportData = paymentsData.map(p => ({
      OrderId: p.orderId,
      UTR: p.utrReference || '',
      Status: p.status,
      SubmittedAt: p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : '',
      VerifiedAt: p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : ''
    }));
    downloadCSV(exportData, 'payments', ['OrderId', 'UTR', 'Status', 'SubmittedAt', 'VerifiedAt']);
  };

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-champagne" />
          <h1 className="text-3xl font-bold text-navy">Reports & Analytics</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
              {activeTab === 'orders' && (
                <div className="min-w-[180px]">
                  <Label>Payment Type</Label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Online + COD)</SelectItem>
                      <SelectItem value="online">Online (Gateway / UPI)</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleSearch} className="bg-champagne text-navy hover:bg-champagne/90" data-testid="button-search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={setToday} data-testid="button-today">Today</Button>
                <Button variant="outline" onClick={setYesterday} data-testid="button-yesterday">Yesterday</Button>
                <Button variant="outline" onClick={() => setQuickRange(7)} data-testid="button-last-7">Last 7 Days</Button>
                <Button variant="outline" onClick={() => setQuickRange(30)} data-testid="button-last-30">Last 30 Days</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders" data-testid="tab-orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Sales (Delivered)
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="customers" data-testid="tab-customers" className="gap-2">
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="payments" data-testid="tab-payments" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Payments
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Sales Report — Money Received
                  {applied && (
                    <span className="text-sm text-gray-500 font-normal ml-2">
                      ({applied.start} → {applied.end},{' '}
                      {applied.paymentMethod === 'all' ? 'all payments' :
                        applied.paymentMethod === 'cod' ? 'cash on delivery' : 'online payments'})
                    </span>
                  )}
                </CardTitle>
                <Button onClick={exportOrders} data-testid="button-export-orders" disabled={!orderRows.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {!applied ? (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                    <p>Pick a date range and status, then click <strong>Search</strong> to view the report.</p>
                  </div>
                ) : ordersLoading || ordersFetching ? (
                  <div className="animate-pulse h-48 bg-gray-100 rounded" />
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Orders</p>
                        <p className="text-xl font-bold text-navy" data-testid="text-orders-count">{orderRows.length}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Price (Taxable)</p>
                        <p className="text-xl font-bold text-navy" data-testid="text-total-subtotal">{formatPrice(totals.subtotal)}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">CGST</p>
                        <p className="text-xl font-bold text-navy" data-testid="text-total-cgst">{formatPrice(totals.cgst)}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">SGST</p>
                        <p className="text-xl font-bold text-navy" data-testid="text-total-sgst">{formatPrice(totals.sgst)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Grand Total</p>
                        <p className="text-xl font-bold text-navy" data-testid="text-total-grand">{formatPrice(totals.total)}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>State</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">CGST</TableHead>
                            <TableHead className="text-right">SGST</TableHead>
                            <TableHead className="text-right">IGST</TableHead>
                            <TableHead className="text-right">Grand Total</TableHead>
                            <TableHead className="text-right w-[110px]">Invoice</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                No delivered orders in this date range.
                              </TableCell>
                            </TableRow>
                          ) : (
                            orderRows.map((r) => (
                              <TableRow key={r.order.id} data-testid={`row-order-${r.order.id}`}>
                                <TableCell className="font-medium">{r.order.orderNumber}</TableCell>
                                <TableCell>{new Date(r.order.deliveryDate || r.order.orderDate!).toLocaleDateString('en-IN')}</TableCell>
                                <TableCell className="text-xs">{r.deliveryState}</TableCell>
                                <TableCell className="text-right">{formatPrice(r.subtotal)}</TableCell>
                                <TableCell className="text-right">{r.cgst > 0 ? formatPrice(r.cgst) : '-'}</TableCell>
                                <TableCell className="text-right">{r.sgst > 0 ? formatPrice(r.sgst) : '-'}</TableCell>
                                <TableCell className="text-right">{r.igst > 0 ? formatPrice(r.igst) : '-'}</TableCell>
                                <TableCell className="text-right font-semibold">{formatPrice(r.total)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      title="View Invoice"
                                      onClick={() => openInvoice(r.order.id)}
                                      data-testid={`button-view-invoice-${r.order.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      title="Download Invoice"
                                      onClick={() => openInvoice(r.order.id)}
                                      data-testid={`button-download-invoice-${r.order.id}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {orderRows.length > 0 && (
                          <TableFooter>
                            <TableRow className="bg-cream font-bold">
                              <TableCell colSpan={3}>TOTAL</TableCell>
                              <TableCell className="text-right" data-testid="footer-subtotal">{formatPrice(totals.subtotal)}</TableCell>
                              <TableCell className="text-right" data-testid="footer-cgst">{formatPrice(totals.cgst)}</TableCell>
                              <TableCell className="text-right" data-testid="footer-sgst">{formatPrice(totals.sgst)}</TableCell>
                              <TableCell className="text-right" data-testid="footer-igst">{formatPrice(totals.igst)}</TableCell>
                              <TableCell className="text-right" data-testid="footer-grand-total">{formatPrice(totals.total)}</TableCell>
                              <TableCell />
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Note: CGST + SGST applied for deliveries within {HOME_STATE}. IGST applied for deliveries to other states.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="customers">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Customers Report</CardTitle>
                  <Button onClick={exportCustomers} data-testid="button-export-customers" disabled={!customersData?.length}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {customersLoading ? (
                    <div className="animate-pulse h-48 bg-gray-100 rounded" />
                  ) : (
                    <>
                      <div className="bg-purple-50 rounded-lg p-4 mb-6 inline-block">
                        <p className="text-sm text-gray-600">New Customers</p>
                        <p className="text-2xl font-bold text-navy">{customersData?.length || 0}</p>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customersData?.slice(0, 50).map((customer) => (
                            <TableRow key={customer.id}>
                              <TableCell className="font-medium">
                                {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username || '-'}
                              </TableCell>
                              <TableCell>{customer.email}</TableCell>
                              <TableCell>{customer.phone || '-'}</TableCell>
                              <TableCell>{new Date(customer.createdAt!).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="payments">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payments Report</CardTitle>
                  <Button onClick={exportPayments} data-testid="button-export-payments" disabled={!paymentsData?.length}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="animate-pulse h-48 bg-gray-100 rounded" />
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Successful</p>
                          <p className="text-2xl font-bold text-green-600">
                            {paymentsData?.filter(p => p.status === 'success').length || 0}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Pending</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {paymentsData?.filter(p => p.status === 'pending').length || 0}
                          </p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Failed</p>
                          <p className="text-2xl font-bold text-red-600">
                            {paymentsData?.filter(p => p.status === 'failed').length || 0}
                          </p>
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>UTR Reference</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Verified</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentsData?.slice(0, 50).map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">{payment.orderId}</TableCell>
                              <TableCell>{payment.utrReference || '-'}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  payment.status === 'success' ? 'bg-green-100 text-green-700' :
                                  payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {payment.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {payment.submittedAt ? new Date(payment.submittedAt).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell>
                                {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleDateString() : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <InvoiceDialog
        orderId={invoiceOrderId}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
    </div>
  );
}
