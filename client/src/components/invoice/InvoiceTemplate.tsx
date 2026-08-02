import { forwardRef } from 'react';
import pathakLogo from '@assets/Screenshot_2026-04-26-21-37-03-25_96b26121e545231a3c569311a54c_1777268519558.png';

export type InvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

export type InvoiceData = {
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  deliveryCharge: number;
  handlingCharge: number;
  total: number;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl?: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const InvoiceTemplate = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  const taxableAmount = data.subtotal;
  const totalGst = data.cgst + data.sgst + data.igst;

  return (
    <div
      ref={ref}
      className="bg-white text-black mx-auto"
      style={{
        width: '794px',
        maxWidth: '100%',
        padding: '40px',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontSize: '13px',
        lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a2332', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <img
            src={data.logoUrl || pathakLogo}
            alt="logo"
            style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            crossOrigin="anonymous"
          />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a2332' }}>{data.companyName}</div>
            <div style={{ fontSize: '11px', color: '#555', maxWidth: '320px' }}>{data.companyAddress}</div>
            <div style={{ fontSize: '11px', color: '#555' }}>
              {data.companyPhone}{data.companyPhone && data.companyEmail ? ' • ' : ''}{data.companyEmail}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            background: '#1a2332',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '1px',
            borderRadius: '4px',
          }}>
            MOCK BILL
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Not a tax invoice</div>
        </div>
      </div>

      {/* Customer + Invoice meta */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', marginBottom: '4px' }}>Bill To</div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{data.customerName}</div>
          {data.customerPhone && <div style={{ fontSize: '12px', color: '#444' }}>{data.customerPhone}</div>}
          {data.customerEmail && <div style={{ fontSize: '12px', color: '#444' }}>{data.customerEmail}</div>}
          <div style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
            {data.deliveryAddress.addressLine1}
            {data.deliveryAddress.addressLine2 ? `, ${data.deliveryAddress.addressLine2}` : ''}
          </div>
          <div style={{ fontSize: '12px', color: '#444' }}>
            {data.deliveryAddress.city}, {data.deliveryAddress.state} - {data.deliveryAddress.pincode}
          </div>
          {data.deliveryAddress.landmark && (
            <div style={{ fontSize: '12px', color: '#666' }}>Landmark: {data.deliveryAddress.landmark}</div>
          )}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', marginBottom: '4px' }}>Invoice</div>
          <div style={{ fontSize: '13px' }}><span style={{ color: '#666' }}>No:</span> <strong>{data.orderNumber}</strong></div>
          <div style={{ fontSize: '13px' }}><span style={{ color: '#666' }}>Date:</span> {data.orderDate}</div>
          <div style={{ fontSize: '13px' }}><span style={{ color: '#666' }}>Payment:</span> {data.paymentMethod}</div>
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <thead>
          <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#374151' }}>#</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#374151' }}>Item</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#374151' }}>Qty</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#374151' }}>Rate</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#374151' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px', borderBottom: '1px solid #e5e7eb' }}>
                No item details available for this order.
              </td>
            </tr>
          ) : (
            data.items.map((it, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 8px', fontSize: '12px', color: '#555' }}>{idx + 1}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px' }}>{it.name}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>{it.quantity}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>₹ {fmt(it.price)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>₹ {fmt(it.total)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
            <span style={{ color: '#555' }}>Taxable Amount</span>
            <span>₹ {fmt(taxableAmount)}</span>
          </div>
          {data.cgst > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: '#555' }}>CGST (9%)</span>
              <span>₹ {fmt(data.cgst)}</span>
            </div>
          )}
          {data.sgst > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: '#555' }}>SGST (9%)</span>
              <span>₹ {fmt(data.sgst)}</span>
            </div>
          )}
          {data.igst > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: '#555' }}>IGST (18%)</span>
              <span>₹ {fmt(data.igst)}</span>
            </div>
          )}
          {totalGst > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderTop: '1px dashed #d1d5db' }}>
              <span style={{ color: '#555' }}>Total GST</span>
              <span>₹ {fmt(totalGst)}</span>
            </div>
          )}
          {data.deliveryCharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: '#555' }}>Delivery</span>
              <span>₹ {fmt(data.deliveryCharge)}</span>
            </div>
          )}
          {data.handlingCharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: '#555' }}>Handling</span>
              <span>₹ {fmt(data.handlingCharge)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 8px', marginTop: '6px', background: '#1a2332', color: '#fff', fontSize: '15px', fontWeight: 700, borderRadius: '4px' }}>
            <span>Grand Total</span>
            <span>₹ {fmt(data.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '32px', paddingTop: '14px', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#888', fontSize: '11px' }}>
        Thank you for shopping with {data.companyName}.<br />
        This is a system-generated mock bill for record purposes.
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
export default InvoiceTemplate;
