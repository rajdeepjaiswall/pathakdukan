import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  ExternalLink,
  FileText,
  ScrollText,
  Truck,
  Receipt,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import type { LegalPage } from '@shared/schema';

type PageType = 'privacy' | 'terms' | 'shipping' | 'invoice';

const PAGE_META: Record<PageType, { title: string; route: string; icon: any }> = {
  privacy: { title: 'Privacy Policy', route: '/privacy-policy', icon: FileText },
  terms: { title: 'Terms of Service', route: '/terms-of-service', icon: ScrollText },
  shipping: { title: 'Shipping Policy', route: '/shipping-policy', icon: Truck },
  invoice: { title: 'Invoice Terms', route: '/invoice-terms', icon: Receipt },
};

const friendlyAuthError = (error: any) => {
  const msg = error?.message || '';
  if (msg.startsWith('401')) return 'Your admin session has expired. Please log in again.';
  if (msg.startsWith('403')) return 'You do not have permission to do this.';
  return msg || 'Something went wrong. Please try again.';
};

type SectionDraft = {
  level: 2 | 3;
  title: string;
  content: string;
  listItems: string[];
  highlight: boolean;
  isActive: boolean;
};

const emptyDraft = (): SectionDraft => ({
  level: 2,
  title: '',
  content: '',
  listItems: [],
  highlight: false,
  isActive: true,
});

const fromSection = (s: LegalPage): SectionDraft => ({
  level: (s.level === 3 ? 3 : 2) as 2 | 3,
  title: s.title || '',
  content: s.content || '',
  listItems: (s.listItems || []).filter((i): i is string => typeof i === 'string'),
  highlight: !!s.highlight,
  isActive: s.isActive ?? true,
});

export default function AdminLegalPages() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pageType, setPageType] = useState<PageType>('privacy');
  const [editing, setEditing] = useState<LegalPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<SectionDraft>(emptyDraft());
  const [confirmDelete, setConfirmDelete] = useState<LegalPage | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
      setLocation('/admin/login');
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const { data: sections = [], isLoading } = useQuery<LegalPage[]>({
    queryKey: [`/api/admin/legal-pages/${pageType}`],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin'),
  });

  const invalidatePageCaches = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/admin/legal-pages/${pageType}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/legal-pages/${pageType}`] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest('POST', '/api/admin/legal-pages', payload);
      return res.json();
    },
    onSuccess: () => {
      invalidatePageCaches();
      
      toast({ title: 'Section added', description: 'New section saved.' });
      setCreating(false);
      setDraft(emptyDraft());
    },
    onError: (error: any) => {
      toast({ title: 'Could not add section', description: friendlyAuthError(error), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await apiRequest('PATCH', `/api/admin/legal-pages/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      invalidatePageCaches();
      
      toast({ title: 'Section updated', description: 'Your changes are saved.' });
      setEditing(null);
    },
    onError: (error: any) => {
      toast({ title: 'Could not save changes', description: friendlyAuthError(error), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/legal-pages/${id}`);
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      invalidatePageCaches();
      
      toast({ title: 'Section deleted' });
      setConfirmDelete(null);
    },
    onError: (error: any) => {
      toast({ title: 'Could not delete', description: friendlyAuthError(error), variant: 'destructive' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, displayOrder }: { id: number; displayOrder: number }) => {
      const res = await apiRequest('PATCH', `/api/admin/legal-pages/${id}`, { displayOrder });
      return res.json();
    },
    onSuccess: () => {
      invalidatePageCaches();
      
    },
    onError: (error: any) => {
      toast({ title: 'Could not reorder', description: friendlyAuthError(error), variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/legal-pages/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      invalidatePageCaches();
      
    },
    onError: (error: any) => {
      toast({ title: 'Could not update visibility', description: friendlyAuthError(error), variant: 'destructive' });
    },
  });

  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => {
      const ao = a.displayOrder ?? 0;
      const bo = b.displayOrder ?? 0;
      if (ao !== bo) return ao - bo;
      return a.id - b.id;
    });
  }, [sections]);

  const openCreate = () => {
    setDraft(emptyDraft());
    setCreating(true);
  };

  const openEdit = (section: LegalPage) => {
    setDraft(fromSection(section));
    setEditing(section);
  };

  const submitCreate = () => {
    if (!draft.title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a section title.', variant: 'destructive' });
      return;
    }
    const maxOrder = sortedSections.reduce((m, s) => Math.max(m, s.displayOrder ?? 0), 0);
    createMutation.mutate({
      pageType,
      level: draft.level,
      title: draft.title.trim(),
      content: draft.content.trim() || null,
      listItems: draft.listItems.map((i) => i.trim()).filter(Boolean),
      highlight: draft.highlight,
      isActive: draft.isActive,
      displayOrder: maxOrder + 10,
    });
  };

  const submitEdit = () => {
    if (!editing) return;
    if (!draft.title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a section title.', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({
      id: editing.id,
      payload: {
        level: draft.level,
        title: draft.title.trim(),
        content: draft.content.trim() || null,
        listItems: draft.listItems.map((i) => i.trim()).filter(Boolean),
        highlight: draft.highlight,
        isActive: draft.isActive,
      },
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = sortedSections[index];
    const swap = sortedSections[index + direction];
    if (!target || !swap) return;
    const a = target.displayOrder ?? 0;
    const b = swap.displayOrder ?? 0;
    reorderMutation.mutate({ id: target.id, displayOrder: b });
    reorderMutation.mutate({ id: swap.id, displayOrder: a });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const meta = PAGE_META[pageType];
  const Icon = meta.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AdminSidebar />
      <div className="lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-heading">
                Legal Pages
              </h1>
              <p className="text-gray-600 mt-1">
                Edit the sections of your Privacy Policy and Terms of Service.
              </p>
            </div>
            <a
              href={meta.route}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700"
              data-testid="link-preview-page"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View {meta.title}
            </a>
          </div>

          <Tabs value={pageType} onValueChange={(v) => setPageType(v as PageType)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="privacy" data-testid="tab-privacy" className="py-2">
                <FileText className="h-4 w-4 mr-2" />
                <span className="truncate">Privacy Policy</span>
              </TabsTrigger>
              <TabsTrigger value="terms" data-testid="tab-terms" className="py-2">
                <ScrollText className="h-4 w-4 mr-2" />
                <span className="truncate">Terms of Service</span>
              </TabsTrigger>
              <TabsTrigger value="shipping" data-testid="tab-shipping" className="py-2">
                <Truck className="h-4 w-4 mr-2" />
                <span className="truncate">Shipping Policy</span>
              </TabsTrigger>
              <TabsTrigger value="invoice" data-testid="tab-invoice" className="py-2">
                <Receipt className="h-4 w-4 mr-2" />
                <span className="truncate">Invoice Terms</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-gray-500 -mt-4 mb-4">
            Tip: Shipping Policy and Invoice Terms only appear in the website footer once you add at least one section here.
          </p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Icon className="h-5 w-5" />
              <span className="font-medium">{meta.title} sections</span>
              <Badge variant="secondary">{sortedSections.length}</Badge>
            </div>
            <Button onClick={openCreate} data-testid="button-add-section">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">Loading...</CardContent>
            </Card>
          ) : sortedSections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No sections yet. Click "Add Section" to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedSections.map((section, index) => (
                <Card key={section.id} data-testid={`card-section-${section.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={index === 0 || reorderMutation.isPending}
                          onClick={() => moveSection(index, -1)}
                          data-testid={`button-move-up-${section.id}`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={index === sortedSections.length - 1 || reorderMutation.isPending}
                          onClick={() => moveSection(index, 1)}
                          data-testid={`button-move-down-${section.id}`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={section.level === 3 ? 'outline' : 'default'}>
                            {section.level === 3 ? 'Subsection' : 'Section'}
                          </Badge>
                          {section.highlight && <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Highlighted</Badge>}
                          {!section.isActive && <Badge variant="destructive">Hidden</Badge>}
                        </div>
                        <h3 className="font-semibold text-gray-900 truncate" data-testid={`text-section-title-${section.id}`}>
                          {section.title}
                        </h3>
                        {section.content && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2 whitespace-pre-line">
                            {section.content}
                          </p>
                        )}
                        {(section.listItems || []).filter(Boolean).length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {(section.listItems || []).filter(Boolean).length} bullet point(s)
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: section.id, isActive: !section.isActive })
                          }
                          title={section.isActive ? 'Hide from public page' : 'Show on public page'}
                          data-testid={`button-toggle-active-${section.id}`}
                        >
                          {section.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(section)}
                          data-testid={`button-edit-${section.id}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setConfirmDelete(section)}
                          data-testid={`button-delete-${section.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog
        open={creating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{creating ? 'Add new section' : 'Edit section'}</DialogTitle>
            <DialogDescription>
              Sections appear on the {meta.title} page in order. Subsections (h3) appear nested under the previous main section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Section type</Label>
                <Select
                  value={String(draft.level)}
                  onValueChange={(v) => setDraft({ ...draft, level: (v === '3' ? 3 : 2) as 2 | 3 })}
                >
                  <SelectTrigger data-testid="select-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Main section (large heading)</SelectItem>
                    <SelectItem value="3">Subsection (smaller heading)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draft.highlight}
                    onCheckedChange={(v) => setDraft({ ...draft, highlight: v })}
                    data-testid="switch-highlight"
                  />
                  <Label>Highlight box</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draft.isActive}
                    onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                    data-testid="switch-active"
                  />
                  <Label>Visible</Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Section title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Introduction"
                data-testid="input-title"
              />
            </div>

            <div>
              <Label className="mb-1 block">Paragraph content (optional)</Label>
              <Textarea
                rows={5}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="Write the main paragraph for this section. Use a blank line between paragraphs."
                data-testid="textarea-content"
              />
              <p className="text-xs text-gray-500 mt-1">Use a blank line between paragraphs.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Bullet list (optional)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDraft({ ...draft, listItems: [...draft.listItems, ''] })}
                  data-testid="button-add-bullet"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add bullet
                </Button>
              </div>
              {draft.listItems.length === 0 ? (
                <p className="text-xs text-gray-500">No bullets yet.</p>
              ) : (
                <div className="space-y-2">
                  {draft.listItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const next = [...draft.listItems];
                          next[i] = e.target.value;
                          setDraft({ ...draft, listItems: next });
                        }}
                        placeholder={`Bullet ${i + 1}`}
                        data-testid={`input-bullet-${i}`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          const next = draft.listItems.filter((_, idx) => idx !== i);
                          setDraft({ ...draft, listItems: next });
                        }}
                        data-testid={`button-remove-bullet-${i}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={creating ? submitCreate : submitEdit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {creating ? 'Add section' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete section?</DialogTitle>
            <DialogDescription>
              This will permanently remove "{confirmDelete?.title}" from {meta.title}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
