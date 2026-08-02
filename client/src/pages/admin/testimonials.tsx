import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, CheckCircle, XCircle, RotateCcw, Trash2, Star as StarIcon, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

function TestimonialRow({ item, onApprove, onReject, onRestore, onFeature, onDelete, isPending }: any) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-navy">{item.user_name}</span>
              <Badge className={statusColors[item.status] || 'bg-gray-100 text-gray-800'}>
                {item.status}
              </Badge>
              {item.featured && (
                <Badge className="bg-amber-100 text-amber-800">⭐ Featured</Badge>
              )}
            </div>
            <p className="text-xs text-amber-700 font-medium">Product: {item.product_name}</p>
            <StarDisplay rating={item.rating} />
            <p className="text-sm text-gray-700 leading-relaxed">{item.review_text}</p>
            {item.image_url && (
              <img
                src={item.image_url}
                alt="Review"
                className="h-20 w-20 object-cover rounded-lg border"
              />
            )}
            <p className="text-xs text-gray-400">
              Submitted: {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 md:flex-col md:w-36 shrink-0">
            {item.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                  onClick={() => onApprove(item.id)}
                  disabled={isPending}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 md:flex-none"
                  onClick={() => onReject(item.id)}
                  disabled={isPending}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
              </>
            )}
            {item.status === 'approved' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className={`flex-1 md:flex-none text-xs ${item.featured ? 'border-amber-500 text-amber-700' : ''}`}
                  onClick={() => onFeature(item.id)}
                  disabled={isPending}
                >
                  <StarIcon className="h-3.5 w-3.5 mr-1" />
                  {item.featured ? 'Unfeature' : 'Feature'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 md:flex-none text-xs"
                  onClick={() => onRestore(item.id)}
                  disabled={isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Unapprove
                </Button>
              </>
            )}
            {item.status === 'rejected' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 md:flex-none text-xs"
                onClick={() => onRestore(item.id)}
                disabled={isPending}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 md:flex-none text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(item.id)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminTestimonials() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      navigate('/admin/login');
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  const { data: allTestimonials = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/testimonials'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/testimonials', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const pending = allTestimonials.filter(t => t.status === 'pending');
  const approved = allTestimonials.filter(t => t.status === 'approved');
  const rejected = allTestimonials.filter(t => t.status === 'rejected');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['/api/admin/testimonials'] });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/admin/testimonials/${id}/approve`, {}),
    onSuccess: () => { invalidate(); toast({ title: 'Review approved', description: 'It will now show on the homepage.' }); },
    onError: () => toast({ title: 'Error', variant: 'destructive', description: 'Failed to approve' }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/admin/testimonials/${id}/reject`, {}),
    onSuccess: () => { invalidate(); toast({ title: 'Review rejected' }); },
    onError: () => toast({ title: 'Error', variant: 'destructive', description: 'Failed to reject' }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/admin/testimonials/${id}/restore`, {}),
    onSuccess: () => { invalidate(); toast({ title: 'Moved back to pending' }); },
    onError: () => toast({ title: 'Error', variant: 'destructive', description: 'Failed to restore' }),
  });

  const featureMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/admin/testimonials/${id}/feature`, {}),
    onSuccess: () => { invalidate(); toast({ title: 'Featured status updated' }); },
    onError: () => toast({ title: 'Error', variant: 'destructive', description: 'Failed to update' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/testimonials/${id}`, {}),
    onSuccess: () => { invalidate(); toast({ title: 'Review deleted' }); },
    onError: () => toast({ title: 'Error', variant: 'destructive', description: 'Failed to delete' }),
  });

  const mutating = approveMutation.isPending || rejectMutation.isPending || restoreMutation.isPending || featureMutation.isPending || deleteMutation.isPending;

  const rowProps = {
    onApprove: (id: number) => approveMutation.mutate(id),
    onReject: (id: number) => rejectMutation.mutate(id),
    onRestore: (id: number) => restoreMutation.mutate(id),
    onFeature: (id: number) => featureMutation.mutate(id),
    onDelete: (id: number) => deleteMutation.mutate(id),
    isPending: mutating,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy">Testimonials & Reviews</h1>
            <p className="text-gray-500 text-sm mt-1">Manage customer reviews submitted after delivery</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-navy">{pending.length}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ThumbsUp className="h-6 w-6 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-navy">{approved.length}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ThumbsDown className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-navy">{rejected.length}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pending" className="relative">
                Pending
                {pending.length > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {pending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
              ) : pending.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
                  <p className="font-medium">No pending reviews</p>
                  <p className="text-sm">All reviews have been processed</p>
                </div>
              ) : (
                pending.map(item => <TestimonialRow key={item.id} item={item} {...rowProps} />)
              )}
            </TabsContent>

            <TabsContent value="approved">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
              ) : approved.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="font-medium">No approved reviews yet</p>
                </div>
              ) : (
                approved.map(item => <TestimonialRow key={item.id} item={item} {...rowProps} />)
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
              ) : rejected.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="font-medium">No rejected reviews</p>
                </div>
              ) : (
                rejected.map(item => <TestimonialRow key={item.id} item={item} {...rowProps} />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
