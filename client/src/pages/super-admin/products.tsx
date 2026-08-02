import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Package, Edit, Trash2, Star, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  category_id: number;
  weight: string;
  stock: number;
  featured: boolean;
  isActive: boolean;
  discount?: number;
  originalPrice?: string;
  gstRate: string;
}

export default function ProductManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category_id: 1,
    weight: '',
    stock: 0,
    featured: false,
    gstRate: '5',
    discount: 0,
  });

  // Fetch products and categories
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      // Don't send images/videos as base64 to avoid 413 payload too large errors
      const { images, videos, ...submitData } = productData;
      return apiRequest('POST', '/api/products', submitData);
    },
    onSuccess: () => {
      invalidateAllProductQueries();
      setShowAddForm(false);
      resetForm();
      toast({
        title: "Product Added",
        description: "New product has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product.",
        variant: "destructive",
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: any) => {
      // Don't send images/videos as base64 to avoid 413 payload too large errors
      const { images, videos, ...submitData } = productData;
      return apiRequest('PUT', `/api/products/${id}`, submitData);
    },
    onSuccess: () => {
      invalidateAllProductQueries();
      setEditingProduct(null);
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product.",
        variant: "destructive",
      });
    }
  });

  const invalidateAllProductQueries = () => {
    queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0] as string).startsWith('/api/products'),
    });
  };

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('DELETE', `/api/products/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      invalidateAllProductQueries();
      setDeletingProduct(null);
      toast({
        title: 'Product deleted',
        description: 'Product has been permanently removed from the store.',
      });
    },
    onError: (error: any) => {
      setDeletingProduct(null);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setNewProduct({
      name: '',
      price: '',
      description: '',
      category_id: 1,
      weight: '',
      stock: 0,
      featured: false,
      gstRate: '5',
      discount: 0,
    });
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast({
        title: "Missing Information",
        description: "Product name and price are required.",
        variant: "destructive",
      });
      return;
    }
    addProductMutation.mutate(newProduct);
  };

  const handleUpdateProduct = () => {
    if (editingProduct) {
      updateProductMutation.mutate(editingProduct);
    }
  };

  const calculateDiscountedPrice = (price: string, discount: number) => {
    const originalPrice = parseFloat(price);
    return (originalPrice * (1 - discount / 100)).toFixed(0);
  };

  const displayProducts = products || [];
  const displayCategories = categories || [];

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              <h1 className="text-3xl font-bold text-navy">Product Manager</h1>
              <p className="text-gray-600">Manage products, pricing, and discounts for your bakery</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Add/Edit Product Form */}
        {(showAddForm || editingProduct) && (
          <Card className="mb-8 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={editingProduct ? editingProduct.name : newProduct.name}
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, name: e.target.value });
                      } else {
                        setNewProduct(prev => ({ ...prev, name: e.target.value }));
                      }
                    }}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editingProduct ? editingProduct.price : newProduct.price}
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, price: e.target.value });
                      } else {
                        setNewProduct(prev => ({ ...prev, price: e.target.value }));
                      }
                    }}
                    placeholder="Enter price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={editingProduct ? editingProduct.discount || 0 : newProduct.discount}
                    onChange={(e) => {
                      const discount = parseInt(e.target.value) || 0;
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, discount });
                      } else {
                        setNewProduct(prev => ({ ...prev, discount }));
                      }
                    }}
                    placeholder="Enter discount percentage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight/Quantity</Label>
                  <Input
                    id="weight"
                    value={editingProduct ? editingProduct.weight : newProduct.weight}
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, weight: e.target.value });
                      } else {
                        setNewProduct(prev => ({ ...prev, weight: e.target.value }));
                      }
                    }}
                    placeholder="e.g., 500g, 1kg, 4 pieces"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editingProduct ? editingProduct.stock : newProduct.stock}
                    onChange={(e) => {
                      const stock = parseInt(e.target.value) || 0;
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, stock });
                      } else {
                        setNewProduct(prev => ({ ...prev, stock }));
                      }
                    }}
                    placeholder="Enter stock quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstRate">GST Rate (%)</Label>
                  <Select
                    value={editingProduct ? editingProduct.gstRate : newProduct.gstRate}
                    onValueChange={(value) => {
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, gstRate: value });
                      } else {
                        setNewProduct(prev => ({ ...prev, gstRate: value }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GST rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% - Essential items</SelectItem>
                      <SelectItem value="5">5% - Basic food items</SelectItem>
                      <SelectItem value="12">12% - Processed foods</SelectItem>
                      <SelectItem value="18">18% - Luxury items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingProduct ? editingProduct.description : newProduct.description}
                  onChange={(e) => {
                    if (editingProduct) {
                      setEditingProduct({ ...editingProduct, description: e.target.value });
                    } else {
                      setNewProduct(prev => ({ ...prev, description: e.target.value }));
                    }
                  }}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              {/* Price Preview */}
              {((editingProduct && editingProduct.discount) || newProduct.discount > 0) && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Price Preview</h4>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Original Price:</span>
                      <span className="ml-2 line-through text-red-500">
                        ₹{editingProduct ? editingProduct.price : newProduct.price}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Discounted Price:</span>
                      <span className="ml-2 text-lg font-bold text-green-600">
                        ₹{calculateDiscountedPrice(
                          editingProduct ? editingProduct.price : newProduct.price,
                          editingProduct ? editingProduct.discount || 0 : newProduct.discount
                        )}
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {editingProduct ? editingProduct.discount : newProduct.discount}% OFF
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  disabled={addProductMutation.isPending || updateProductMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product: Product) => (
            <Card key={product.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="flex gap-1">
                    {product.featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      {product.discount && product.discount > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="line-through text-red-500 text-sm">₹{product.price}</span>
                          <span className="text-lg font-bold text-green-600">
                            ₹{calculateDiscountedPrice(product.price, product.discount)}
                          </span>
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {product.discount}% OFF
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-navy">₹{product.price}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Weight:</span>
                      <span className="ml-1 font-medium">{product.weight}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Stock:</span>
                      <span className={`ml-1 font-medium ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeletingProduct(product)}
                    disabled={deleteProductMutation.isPending}
                  >
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
              <Package className="h-5 w-5" />
              Product Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-navy">{displayProducts.length}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {displayProducts.filter((p: Product) => p.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Active Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {displayProducts.filter((p: Product) => p.featured).length}
                </div>
                <div className="text-sm text-gray-600">Featured Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {displayProducts.filter((p: Product) => p.stock < 10).length}
                </div>
                <div className="text-sm text-gray-600">Low Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {displayProducts.filter((p: Product) => p.discount && p.discount > 0).length}
                </div>
                <div className="text-sm text-gray-600">On Discount</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingProduct?.name}</strong>? It will be removed from all carts, wishlists, and the store permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProductMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct.id)}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? 'Deleting...' : 'Yes, delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}