import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Users, Edit, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';

interface Shopkeeper {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  totalRevenue?: number;
  totalOrders?: number;
}

export default function ShopkeeperManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShopkeeper, setNewShopkeeper] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
  });

  // Fetch shopkeepers
  const { data: shopkeepers, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Add shopkeeper mutation
  const addShopkeeperMutation = useMutation({
    mutationFn: async (shopkeeperData: any) => {
      return apiRequest('POST', '/api/admin/users', {
        ...shopkeeperData,
        role: 'admin'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowAddForm(false);
      setNewShopkeeper({ username: '', password: '', email: '', phone: '' });
      toast({
        title: "Shopkeeper Added",
        description: "New shopkeeper account has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shopkeeper account.",
        variant: "destructive",
      });
    }
  });

  const handleAddShopkeeper = () => {
    if (!newShopkeeper.username || !newShopkeeper.password) {
      toast({
        title: "Missing Information",
        description: "Username and password are required.",
        variant: "destructive",
      });
      return;
    }
    addShopkeeperMutation.mutate(newShopkeeper);
  };

  const mockShopkeepers: Shopkeeper[] = [
    {
      id: 1,
      username: 'pathakji',
      email: 'pathak@bhandar.com',
      phone: '+91 98765 43210',
      role: 'admin',
      isActive: true,
      createdAt: '2024-01-15',
      totalRevenue: 45000,
      totalOrders: 120
    },
    {
      id: 2,
      username: 'sharma_admin',
      email: 'sharma@bhandar.com',
      phone: '+91 87654 32109',
      role: 'admin',
      isActive: true,
      createdAt: '2024-02-01',
      totalRevenue: 32000,
      totalOrders: 85
    }
  ];

  const displayShopkeepers = shopkeepers?.data || mockShopkeepers;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/super-admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-navy">Shopkeeper Management</h1>
              <p className="text-gray-600">Add and manage shopkeeper accounts for your bakery</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Shopkeeper
          </Button>
        </div>

        {/* Add Shopkeeper Form */}
        {showAddForm && (
          <Card className="mb-8 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Shopkeeper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newShopkeeper.username}
                    onChange={(e) => setNewShopkeeper(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newShopkeeper.password}
                    onChange={(e) => setNewShopkeeper(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newShopkeeper.email}
                    onChange={(e) => setNewShopkeeper(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newShopkeeper.phone}
                    onChange={(e) => setNewShopkeeper(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleAddShopkeeper}
                  disabled={addShopkeeperMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {addShopkeeperMutation.isPending ? 'Creating...' : 'Create Shopkeeper'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shopkeepers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayShopkeepers.map((shopkeeper: Shopkeeper) => (
            <Card key={shopkeeper.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{shopkeeper.username}</CardTitle>
                  <Badge variant={shopkeeper.isActive ? "default" : "secondary"}>
                    {shopkeeper.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Email:</span>
                    <span className="text-gray-600">{shopkeeper.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Phone:</span>
                    <span className="text-gray-600">{shopkeeper.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Role:</span>
                    <Badge variant="outline">{shopkeeper.role}</Badge>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <h4 className="font-medium text-sm">Performance</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-600">Revenue</div>
                      <div className="font-semibold text-green-600">
                        ₹{shopkeeper.totalRevenue?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Orders</div>
                      <div className="font-semibold text-blue-600">
                        {shopkeeper.totalOrders || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Shopkeeper Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-navy">{displayShopkeepers.length}</div>
                <div className="text-sm text-gray-600">Total Shopkeepers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {displayShopkeepers.filter(s => s.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Active Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ₹{displayShopkeepers.reduce((sum, s) => sum + (s.totalRevenue || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Combined Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {displayShopkeepers.reduce((sum, s) => sum + (s.totalOrders || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}