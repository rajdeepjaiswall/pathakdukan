import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, FileText, Image as ImageIcon, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import InvoiceTemplate, { InvoiceData } from './InvoiceTemplate';

const HOME_STATE = 'Uttar Pradesh';
function normalizeState(s?: string | null) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

type Props = {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ContactPublic = {
  storeName?: string;
  phone?: string;
  email?: string;
  address?: string;
  profileImage?: string;
};

function buildInvoiceData(order: any, contact: ContactPublic | undefined): InvoiceData {
  const subtotal = parseFloat(order.subtotal?.toString() || '0');
  const gstAmount = parseFloat(order.gstAmount?.toString() || '0');
  const deliveryCharge = parseFloat(order.deliveryCharge?.toString() || '0');
  const handlingCharge = parseFloat(order.handlingCharge?.toString() || '0');
  const total = parseFloat(order.total?.toString() || '0');
  const deliveryState = order.deliveryAddress?.state as string | undefined;
  const isIntra = normalizeState(deliveryState) === normalizeState(HOME_STATE);

  const customer = order.customer || {};
  const addr = order.deliveryAddress || {};
  const customerName = (addr.name as string) ||
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
    'Customer';

  return {
    orderNumber: order.orderNumber,
    orderDate: new Date(order.deliveryDate || order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    paymentMethod: (order.paymentMethod || '').toString().toUpperCase(),
    customerName,
    customerPhone: addr.phone || customer.phone || '',
    customerEmail: customer.email || '',
    deliveryAddress: {
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2,
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      landmark: addr.landmark,
    },
    items: (order.orderItems || []).map((it: any) => ({
      name: it.product?.name || 'Item',
      quantity: it.quantity,
      price: parseFloat(it.price?.toString() || '0'),
      total: parseFloat(it.total?.toString() || '0'),
    })),
    subtotal,
    cgst: isIntra ? gstAmount / 2 : 0,
    sgst: isIntra ? gstAmount / 2 : 0,
    igst: isIntra ? 0 : gstAmount,
    deliveryCharge,
    handlingCharge,
    total,
    companyName: contact?.storeName || 'Pathak Bhandar',
    companyAddress: contact?.address || 'Mathura, Uttar Pradesh, India',
    companyPhone: contact?.phone || '',
    companyEmail: contact?.email || '',
    logoUrl: contact?.profileImage,
  };
}

export default function InvoiceDialog({ orderId, open, onOpenChange }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'pdf' | 'png' | null>(null);

  const { data: orderData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/orders', orderId, 'details'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${orderId}/details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to load order');
      return res.json();
    },
    enabled: open && orderId != null,
    staleTime: 60_000,
  });

  // Optional contact settings (admin endpoint — we are admin since this dialog is on admin reports)
  const { data: contactData } = useQuery<{ draftData?: ContactPublic; publishedData?: ContactPublic }>({
    queryKey: ['/api/admin/contact-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/contact-settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) return {};
      return res.json();
    },
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const contact: ContactPublic | undefined =
    (contactData?.publishedData && Object.keys(contactData.publishedData).length ? contactData.publishedData : contactData?.draftData) || undefined;

  const data = orderData ? buildInvoiceData(orderData, contact) : null;

  // Reset busy when closed
  useEffect(() => { if (!open) setBusy(null); }, [open]);

  const captureCanvas = async () => {
    const node = invoiceRef.current;
    if (!node) throw new Error('Invoice not ready');
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    return canvas;
  };

  const downloadPng = async () => {
    if (!data) return;
    setBusy('png');
    try {
      const canvas = await captureCanvas();
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `invoice_${data.orderNumber}.png`;
      link.click();
    } catch (e) {
      console.error('PNG export failed', e);
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    if (!data) return;
    setBusy('pdf');
    try {
      const canvas = await captureCanvas();
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const imgW = pageWidth - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/png');

      if (imgH <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
      } else {
        // Slice the long image across multiple pages
        const pageCanvasH = (canvas.width * (pageHeight - margin * 2)) / imgW;
        let y = 0;
        let pageNum = 0;
        while (y < canvas.height) {
          const sliceH = Math.min(pageCanvasH, canvas.height - y);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext('2d');
          if (!ctx) break;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          const sliceImg = sliceCanvas.toDataURL('image/png');
          if (pageNum > 0) pdf.addPage();
          const sliceImgH = (sliceH * imgW) / canvas.width;
          pdf.addImage(sliceImg, 'PNG', margin, margin, imgW, sliceImgH);
          y += sliceH;
          pageNum++;
        }
      }
      pdf.save(`invoice_${data.orderNumber}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[900px] w-[95vw] h-[92vh] p-0 overflow-hidden bg-gray-100 backdrop-blur-md"
        data-testid="dialog-invoice-preview"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-navy" />
            <span className="font-semibold text-navy">Invoice Preview</span>
            {data && <span className="text-xs text-gray-500">— {data.orderNumber}</span>}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-champagne text-navy hover:bg-champagne/90 gap-1"
                  disabled={!data || !!busy}
                  data-testid="button-invoice-download"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadPdf} data-testid="menu-download-pdf">
                  <FileText className="h-4 w-4 mr-2" /> Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPng} data-testid="menu-download-png">
                  <ImageIcon className="h-4 w-4 mr-2" /> Download as Image (PNG)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-testid="button-invoice-close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable preview area */}
        <div className="overflow-auto h-[calc(92vh-56px)] p-4 sm:p-6 bg-gray-200/70">
          {isLoading || !data ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading invoice…
            </div>
          ) : (
            <div className="shadow-lg" style={{ width: 'fit-content', margin: '0 auto' }}>
              <InvoiceTemplate ref={invoiceRef} data={data} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
