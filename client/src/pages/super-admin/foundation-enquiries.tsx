import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Phone, MapPin, Building2, Download } from 'lucide-react';
import type { FoundationEnquiry } from '@shared/schema';

export default function SuperAdminFoundationEnquiries() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  const { data: enquiries = [], isLoading } = useQuery<FoundationEnquiry[]>({
    queryKey: ['/api/super-admin/foundation/enquiries', search],
    queryFn: async () => {
      const url = search.trim()
        ? `/api/super-admin/foundation/enquiries?search=${encodeURIComponent(search.trim())}`
        : '/api/super-admin/foundation/enquiries';
      const res = await apiRequest('GET', url);
      return res.json();
    },
  });

  const exportCsv = () => {
    const header = ['Name', 'Business Name', 'Location', 'Scale', 'Phone', 'Verified', 'Date'];
    const rows = enquiries.map((e) => [
      e.name,
      e.businessName,
      e.location || '',
      e.scale || '',
      e.phone,
      e.verified ? 'Yes' : 'No',
      e.createdAt ? new Date(e.createdAt as any).toLocaleString('en-IN') : '',
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? '').replace(/"/g, '""');
            return `"${s}"`;
          })
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foundation-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/super-admin/dashboard')} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-navy flex-1">Foundation Enquiries</h1>
          <Button variant="outline" onClick={exportCsv} disabled={enquiries.length === 0} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone or business name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {isLoading ? 'Loading…' : `${enquiries.length} enquir${enquiries.length === 1 ? 'y' : 'ies'} found`}
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : enquiries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              No enquiries yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {enquiries.map((e) => (
              <Card key={e.id} data-testid={`card-enquiry-${e.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                    <span className="font-semibold text-navy">{e.name}</span>
                    <div className="flex items-center gap-2">
                      {e.verified && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Verified</Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {e.createdAt ? new Date(e.createdAt as any).toLocaleString('en-IN') : ''}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-0">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span><strong>Business:</strong> {e.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${e.phone}`} className="hover:underline">{e.phone}</a>
                  </div>
                  {e.location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{e.location}</span>
                    </div>
                  )}
                  {e.scale && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-gray-400">Scale:</span>
                      <span>{e.scale}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
