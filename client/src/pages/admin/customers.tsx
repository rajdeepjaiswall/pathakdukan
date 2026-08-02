import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Mail, Phone, Calendar, Eye, CheckCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { formatPrice } from '@/lib/cart';

export default function AdminCustomers() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Redirect if not admin
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

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/customers'],
  });

  const allCustomers = (customers || []).filter((customer: any) =>
    (customer.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone || '').includes(searchTerm)
  );

  const verifiedCustomers = allCustomers.filter((customer: any) => customer.isVerified === true);

  const filteredCustomers = activeTab === 'verified' ? verifiedCustomers : allCustomers;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Customer Management</h1>
            <p className="text-gray-600">View and manage your customers</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-champagne" />
                <span className="font-semibold text-navy">{customers.length} Total</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-600">{(customers || []).filter((c: any) => c.isVerified).length} Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2" data-testid="tab-all-customers">
              <Users className="h-4 w-4" />
              All Customers ({allCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2" data-testid="tab-verified-customers">
              <ShieldCheck className="h-4 w-4" />
              Verified ({verifiedCustomers.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeTab === 'verified' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  Verified Customers ({filteredCustomers.length})
                </>
              ) : (
                <>
                  <Users className="h-5 w-5 text-champagne" />
                  All Customers ({filteredCustomers.length})
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No customers found</p>
                <p className="text-gray-400">Customers will appear here when they register</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer: any) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-champagne rounded-full flex items-center justify-center">
                              <span className="text-navy font-semibold text-sm">
                                {(customer.username || customer.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-navy">{customer.username || customer.email || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">ID: #{customer.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={customer.isVerified ? "default" : "secondary"}
                            className={customer.isVerified ? "bg-green-100 text-green-800" : ""}
                          >
                            {customer.isVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedCustomer(customer)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Customer Details - {customer.username || customer.email || 'Unknown'}</DialogTitle>
                              </DialogHeader>
                              {selectedCustomer && (
                                <div className="space-y-6">
                                  {/* Customer Info */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-medium mb-3">Personal Information</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Username:</span>
                                          <span className="font-medium">{selectedCustomer.username || selectedCustomer.email || 'Unknown'}</span>
                                        </div>
                                        {selectedCustomer.email && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="font-medium">{selectedCustomer.email}</span>
                                          </div>
                                        )}
                                        {selectedCustomer.phone && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Phone:</span>
                                            <span className="font-medium">{selectedCustomer.phone}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Status:</span>
                                          <Badge 
                                            variant={selectedCustomer.isVerified ? "default" : "secondary"}
                                            className={selectedCustomer.isVerified ? "bg-green-100 text-green-800" : ""}
                                          >
                                            {selectedCustomer.isVerified ? 'Verified' : 'Unverified'}
                                          </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Member Since:</span>
                                          <span className="font-medium">
                                            {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-medium mb-3">Account Statistics</h4>
                                      <div className="space-y-3">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="text-2xl font-bold text-navy">{selectedCustomer.totalOrders || 0}</div>
                                          <div className="text-sm text-gray-600">Total Orders</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="text-2xl font-bold text-navy">{formatPrice(selectedCustomer.totalSpent || 0)}</div>
                                          <div className="text-sm text-gray-600">Total Spent</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Recent Activity */}
                                  <div>
                                    <h4 className="font-medium mb-3">Recent Activity</h4>
                                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                                      No recent activity
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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
  );
}
