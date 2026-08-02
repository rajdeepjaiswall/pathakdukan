import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle, Calendar, MapPin, Phone, User, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { format } from 'date-fns';

interface VerifiedCustomer {
  id: number;
  customerName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  verifiedAt: string;
  addressId: number;
}

export default function VerifiedCustomers() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6B3E2E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  const { data: verifiedCustomers = [], isLoading } = useQuery<VerifiedCustomer[]>({
    queryKey: ['/api/admin/verified-customers', selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      const response = await fetch(`/api/admin/verified-customers?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch verified customers');
      return response.json();
    },
  });

  const filteredCustomers = verifiedCustomers.filter((customer) =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customersOnSelectedDate = selectedDate
    ? filteredCustomers.filter((c) => {
        const verifiedDate = new Date(c.verifiedAt).toISOString().split('T')[0];
        return verifiedDate === selectedDate;
      })
    : filteredCustomers;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <AdminSidebar />

      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-navy mb-2">Verified Customers</h1>
              <p className="text-gray-600">Track phone verifications in chronological order</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-navy">{customersOnSelectedDate.length} Verified</span>
                </div>
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, phone, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-verified-customers"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48"
                    data-testid="filter-date"
                  />
                  {selectedDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate('')}
                      data-testid="clear-date-filter"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              {selectedDate && (
                <div className="mt-3 text-sm text-gray-600">
                  Showing {customersOnSelectedDate.length} customer(s) verified on {format(new Date(selectedDate), 'MMMM d, yyyy')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Verification Records ({customersOnSelectedDate.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : customersOnSelectedDate.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No verified customers found</p>
                  <p className="text-gray-400">
                    {selectedDate
                      ? `No verifications on ${format(new Date(selectedDate), 'MMMM d, yyyy')}`
                      : 'Verified customers will appear here'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Customer Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Phone Number</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Address</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">City</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">State</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Verified At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customersOnSelectedDate.map((customer, index) => (
                        <tr
                          key={`${customer.addressId}-${index}`}
                          className="border-b hover:bg-gray-50"
                          data-testid={`verified-customer-row-${customer.addressId}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="font-medium text-navy">{customer.customerName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{customer.phone}</span>
                              <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-start gap-2 max-w-xs">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600 truncate">
                                {customer.addressLine1}
                                {customer.addressLine2 && `, ${customer.addressLine2}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700">{customer.city}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700">{customer.state}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <div>
                                <div>{format(new Date(customer.verifiedAt), 'MMM d, yyyy')}</div>
                                <div className="text-xs text-gray-400">
                                  {format(new Date(customer.verifiedAt), 'h:mm a')}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
