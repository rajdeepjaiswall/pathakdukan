import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X, Upload, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
}

export default function AdminCategories() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });

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

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return await apiRequest('POST', '/api/admin/categories', categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsCreating(false);
      setNewCategory({
        name: '',
        description: '',
        imageUrl: ''
      });
      toast({
        title: "Category created",
        description: "The new category has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...categoryData }: any) => {
      return await apiRequest('PATCH', `/api/admin/categories/${id}`, categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      toast({
        title: "Category updated",
        description: "The category has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (file: File, isNew = false) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      if (isNew) {
        setNewCategory(prev => ({ ...prev, imageUrl }));
      } else if (editingCategory) {
        setEditingCategory(prev => prev ? { ...prev, imageUrl } : null);
      }
      toast({
        title: "Image uploaded",
        description: "Category image has been uploaded successfully",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCategory = () => {
    if (!newCategory.name.trim() || !newCategory.description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the name and description",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate(newCategory);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate(editingCategory);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Category Management</h1>
            <p className="text-gray-600">Manage product categories and their images</p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-champagne text-navy hover:bg-champagne/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Create Category Form */}
        {isCreating && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-name">Category Name</Label>
                  <Input
                    id="new-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Cakes, Pastries, Cookies"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Category description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Category Image</Label>
                <div className="mt-2">
                  {newCategory.imageUrl ? (
                    <div className="relative">
                      <img
                        src={newCategory.imageUrl}
                        alt="Category preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-white"
                        onClick={() => setNewCategory(prev => ({ ...prev, imageUrl: '' }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="new-image-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-champagne">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload category image</span>
                      </div>
                      <Input
                        id="new-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, true);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateCategory}
                  disabled={createCategoryMutation.isPending}
                  className="bg-champagne text-navy hover:bg-champagne/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: Category) => (
            <Card key={category.id} className="overflow-hidden">
              {editingCategory?.id === category.id ? (
                // Edit mode
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor={`name-${category.id}`}>Category Name</Label>
                    <Input
                      id={`name-${category.id}`}
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`desc-${category.id}`}>Description</Label>
                    <Textarea
                      id={`desc-${category.id}`}
                      value={editingCategory.description}
                      onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Category Image</Label>
                    <div className="mt-2">
                      {editingCategory.imageUrl ? (
                        <div className="relative">
                          <img
                            src={editingCategory.imageUrl}
                            alt="Category"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 bg-white"
                            onClick={() => setEditingCategory(prev => prev ? { ...prev, imageUrl: '' } : null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label htmlFor={`image-${category.id}`} className="cursor-pointer">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-champagne">
                            <Upload className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                            <span className="text-xs text-gray-600">Upload image</span>
                          </div>
                          <Input
                            id={`image-${category.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, false);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUpdateCategory}
                      disabled={updateCategoryMutation.isPending}
                      size="sm"
                      className="bg-champagne text-navy hover:bg-champagne/80"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingCategory(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              ) : (
                // View mode
                <>
                  <div className="aspect-video relative bg-gray-100">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-navy mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3">{category.description}</p>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
          
          {categories.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No categories yet</h3>
                  <p className="text-gray-400 mb-4">Create your first category to organize your products</p>
                  <Button 
                    onClick={() => setIsCreating(true)}
                    className="bg-champagne text-navy hover:bg-champagne/80"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}