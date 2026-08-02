import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Plus,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Video as VideoIcon,
  Eye,
  EyeOff,
  Save,
  Upload,
  ExternalLink,
  Play,
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
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import type { AboutSection } from '@shared/schema';

const SECTION_TYPES: { value: string; label: string; description: string }[] = [
  {
    value: 'hero',
    label: 'Hero Banner',
    description:
      'Top of the page. Big title, short subtitle, one-line description, image carousel (1–3 images) and a CTA button.',
  },
  {
    value: 'founder',
    label: 'Founder / Legacy',
    description:
      'A circular portrait with the founder name, role/year and a short quote. Add one section per founder.',
  },
  {
    value: 'story',
    label: 'Story',
    description:
      'Long-form story with up to 4 photos forming a collage. Use line breaks in the description to create paragraphs.',
  },
  {
    value: 'gallery',
    label: 'Image Grid',
    description:
      'A wall of photos. The first image becomes a large feature card. Optional CTA at the bottom.',
  },
  {
    value: 'team',
    label: 'Team / Workplace',
    description:
      'Hero image + secondary image + a quote card. Subtitle format: "100+ — Master Bakers". Description supports ||| to split body and quote.',
  },
];

const sectionLabel = (t: string) =>
  SECTION_TYPES.find((s) => s.value === t)?.label || t;

const friendlyAuthError = (error: any) => {
  const msg = error?.message || '';
  if (msg.startsWith('401')) return 'Your admin session has expired. Please log in again.';
  if (msg.startsWith('403')) return 'You do not have permission to do this.';
  return msg || 'Something went wrong. Please try again.';
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

type MediaType = 'image' | 'video';
type BlockState = {
  title: string;
  subtitle: string;
  description: string;
  media: string[];
  mediaTypes: MediaType[];
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
};

const detectTypeFromUrl = (url: string): MediaType => {
  if (!url) return 'image';
  if (url.startsWith('data:video/')) return 'video';
  if (url.startsWith('data:image/')) return 'image';
  const lower = url.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(lower)) return 'video';
  return 'image';
};

const fromSection = (s: AboutSection): BlockState => {
  const media = (s.media || []).filter((m): m is string => typeof m === 'string');
  const rawTypes = (s.mediaTypes || []) as string[];
  const mediaTypes: MediaType[] = media.map((url, i) => {
    const t = rawTypes[i];
    return t === 'video' || t === 'image' ? t : detectTypeFromUrl(url);
  });
  return {
    title: s.title || '',
    subtitle: s.subtitle || '',
    description: s.description || '',
    media,
    mediaTypes,
    ctaText: s.ctaText || '',
    ctaLink: s.ctaLink || '',
    isActive: s.isActive ?? true,
  };
};

const equal = (a: BlockState, b: BlockState) =>
  a.title === b.title &&
  a.subtitle === b.subtitle &&
  a.description === b.description &&
  a.ctaText === b.ctaText &&
  a.ctaLink === b.ctaLink &&
  a.isActive === b.isActive &&
  a.media.length === b.media.length &&
  a.media.every((m, i) => m === b.media[i]) &&
  a.mediaTypes.length === b.mediaTypes.length &&
  a.mediaTypes.every((m, i) => m === b.mediaTypes[i]);

const helperFor = (type: string) => {
  switch (type) {
    case 'hero':
      return 'Tip: subtitle is the small overline text, title is the giant headline, paragraph shows ~3 lines on the page. Add background photos AND/OR videos for the carousel — images stay 3 seconds each, videos play once and then advance to the next slide automatically.';
    case 'founder':
      return 'Tip: Title = founder name. Subtitle = role/year. Description = quote (no need for quote marks). Upload one portrait photo.';
    case 'story':
      return 'Tip: Add up to 4 photos for the collage. Use blank lines in the description to separate paragraphs.';
    case 'gallery':
      return 'Tip: Add as many photos as you like. The first one becomes the large feature card; the rest fill the grid.';
    case 'team':
      return 'Tip: Subtitle format "100+ — Master Bakers". In the description use ||| to split body text from the quote card text.';
    default:
      return '';
  }
};

export default function AdminAbout() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [drafts, setDrafts] = useState<Record<number, BlockState>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<string>('hero');

  const { data: sections = [], isLoading, isError, error, refetch } = useQuery<AboutSection[]>({
    queryKey: ['/api/admin/about-sections'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const errorStatus = (() => {
    const msg = (error as any)?.message || '';
    const m = msg.match(/^(\d{3}):/);
    return m ? Number(m[1]) : null;
  })();

  const sortedSections = useMemo(
    () =>
      [...sections].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      ),
    [sections],
  );

  // Sync server data into local drafts (only for blocks with no unsaved local changes)
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      const ids = new Set(sortedSections.map((s) => s.id));
      // Drop drafts for sections that were deleted
      Object.keys(next).forEach((k) => {
        if (!ids.has(Number(k))) delete next[Number(k)];
      });
      // Add or refresh drafts for fresh data when no unsaved changes
      sortedSections.forEach((s) => {
        const server = fromSection(s);
        const existing = next[s.id];
        if (!existing || equal(existing, server)) {
          next[s.id] = server;
        }
      });
      return next;
    });
  }, [sortedSections]);

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/about-sections'] });
    queryClient.invalidateQueries({ queryKey: ['/api/about-sections'] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/about-sections', data);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Section added', description: 'A new block was added at the bottom.' });
      setAddOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Could not add section',
        description: friendlyAuthError(error),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PATCH', `/api/admin/about-sections/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (error: any) => {
      toast({
        title: 'Could not save',
        description: friendlyAuthError(error),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/about-sections/${id}`);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Section deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not delete',
        description: friendlyAuthError(error),
        variant: 'destructive',
      });
    },
  });

  const isDirty = (s: AboutSection) => {
    const d = drafts[s.id];
    if (!d) return false;
    return !equal(d, fromSection(s));
  };

  const updateDraft = (id: number, patch: Partial<BlockState>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveBlock = (s: AboutSection) => {
    const d = drafts[s.id];
    if (!d) return;
    updateMutation.mutate(
      { id: s.id, data: d },
      {
        onSuccess: () => {
          toast({ title: 'Saved', description: `"${d.title || sectionLabel(s.sectionType)}" updated.` });
        },
      },
    );
  };

  const resetBlock = (s: AboutSection) => {
    setDrafts((prev) => ({ ...prev, [s.id]: fromSection(s) }));
  };

  const toggleActive = (s: AboutSection, value: boolean) => {
    updateDraft(s.id, { isActive: value });
    updateMutation.mutate({ id: s.id, data: { isActive: value } });
  };

  const moveSection = (s: AboutSection, dir: -1 | 1) => {
    const idx = sortedSections.findIndex((x) => x.id === s.id);
    const swap = sortedSections[idx + dir];
    if (!swap) return;
    updateMutation.mutate({ id: s.id, data: { displayOrder: swap.displayOrder ?? 0 } });
    updateMutation.mutate({ id: swap.id, data: { displayOrder: s.displayOrder ?? 0 } });
  };

  const addMediaUrl = (id: number, url: string) => {
    const v = url.trim();
    if (!v) return;
    const t = detectTypeFromUrl(v);
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        media: [...(prev[id]?.media || []), v],
        mediaTypes: [...(prev[id]?.mediaTypes || []), t],
      },
    }));
  };

  const onMediaFile = async (id: number, file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      const t: MediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          media: [...(prev[id]?.media || []), dataUrl],
          mediaTypes: [...(prev[id]?.mediaTypes || []), t],
        },
      }));
    } catch {
      toast({ title: 'Could not read file', variant: 'destructive' });
    }
  };

  const setMediaType = (id: number, i: number, t: MediaType) => {
    setDrafts((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const next = [...cur.mediaTypes];
      next[i] = t;
      return { ...prev, [id]: { ...cur, mediaTypes: next } };
    });
  };

  const removeMedia = (id: number, i: number) => {
    setDrafts((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return {
        ...prev,
        [id]: {
          ...cur,
          media: cur.media.filter((_, idx) => idx !== i),
          mediaTypes: cur.mediaTypes.filter((_, idx) => idx !== i),
        },
      };
    });
  };

  const moveMedia = (id: number, i: number, dir: -1 | 1) => {
    setDrafts((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const j = i + dir;
      if (j < 0 || j >= cur.media.length) return prev;
      const nextMedia = [...cur.media];
      const nextTypes = [...cur.mediaTypes];
      [nextMedia[i], nextMedia[j]] = [nextMedia[j], nextMedia[i]];
      [nextTypes[i], nextTypes[j]] = [nextTypes[j], nextTypes[i]];
      return { ...prev, [id]: { ...cur, media: nextMedia, mediaTypes: nextTypes } };
    });
  };

  const addSection = () => {
    const nextOrder = sortedSections.length
      ? Math.max(...sortedSections.map((s) => s.displayOrder ?? 0)) + 10
      : 10;
    createMutation.mutate({
      sectionType: newType,
      title: '',
      subtitle: '',
      description: '',
      media: [],
      mediaTypes: [],
      ctaText: '',
      ctaLink: '',
      isActive: true,
      displayOrder: nextOrder,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#47160b]">About Us Editor</h1>
            <p className="text-sm text-[#534340] mt-1">
              Each block below is one section on the public About Us page. Edit text, photos and links right here — changes go live as soon as you save.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('/about-us', '_blank')}
              className="border-[#9b4518] text-[#9b4518] hover:bg-[#9b4518] hover:text-white"
              data-testid="button-preview-about"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Preview Page
            </Button>
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-[#47160b] hover:bg-[#632b1e] text-white"
              data-testid="button-add-section"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Block
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <Card className="border-dashed border-red-300 bg-red-50/40">
            <CardContent className="py-12 text-center">
              <p className="text-red-700 font-bold text-lg mb-1">
                {errorStatus === 401 || errorStatus === 403
                  ? 'Your session has expired'
                  : 'Could not load the About Us blocks'}
              </p>
              <p className="text-[#534340] text-sm mb-6 max-w-md mx-auto">
                {errorStatus === 401 || errorStatus === 403
                  ? 'Please sign in again as an admin to load and edit the blocks. Your existing blocks are safe in the database.'
                  : 'Something went wrong while loading. Please try again. If the problem continues, sign out and sign in again.'}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="border-[#47160b] text-[#47160b] hover:bg-[#47160b] hover:text-white"
                  data-testid="button-retry-load"
                >
                  Try Again
                </Button>
                {(errorStatus === 401 || errorStatus === 403) && (
                  <Button
                    onClick={() => {
                      try {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                      } catch {}
                      setLocation('/admin/login');
                    }}
                    className="bg-[#47160b] hover:bg-[#632b1e] text-white"
                    data-testid="button-relogin"
                  >
                    Sign In Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : sortedSections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <ImageIcon className="w-10 h-10 mx-auto text-[#9b4518] mb-3" />
              <p className="text-[#47160b] font-bold text-lg mb-1">No blocks yet</p>
              <p className="text-[#534340] text-sm mb-6">
                Add your first block to start building the About Us page.
              </p>
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-[#47160b] hover:bg-[#632b1e] text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Block
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedSections.map((s, idx) => {
              const d = drafts[s.id];
              if (!d) return null;
              const dirty = isDirty(s);
              return (
                <Card key={s.id} className="overflow-hidden" data-testid={`block-${s.id}`}>
                  {/* Block header */}
                  <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 bg-[#fdf8f3] border-b border-[#efe1d8]">
                    <Badge className="bg-[#9b4518] text-white hover:bg-[#9b4518]">
                      {sectionLabel(s.sectionType)}
                    </Badge>
                    <span className="text-xs text-[#86736f]">Block #{idx + 1}</span>
                    {!d.isActive && (
                      <Badge
                        variant="outline"
                        className="border-[#534340] text-[#534340] flex items-center gap-1"
                      >
                        <EyeOff className="w-3 h-3" /> Hidden
                      </Badge>
                    )}
                    {dirty && (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        Unsaved changes
                      </Badge>
                    )}

                    <div className="ml-auto flex items-center gap-1 flex-wrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveSection(s, -1)}
                        disabled={idx === 0 || updateMutation.isPending}
                        title="Move up"
                        data-testid={`button-up-${s.id}`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveSection(s, 1)}
                        disabled={idx === sortedSections.length - 1 || updateMutation.isPending}
                        title="Move down"
                        data-testid={`button-down-${s.id}`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2 px-2">
                        <Switch
                          checked={d.isActive}
                          onCheckedChange={(v) => toggleActive(s, v)}
                          aria-label="Toggle visible"
                          data-testid={`switch-active-${s.id}`}
                        />
                        {d.isActive ? (
                          <Eye className="w-4 h-4 text-[#9b4518]" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-[#86736f]" />
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete the "${d.title || sectionLabel(s.sectionType)}" block? This cannot be undone.`,
                            )
                          ) {
                            deleteMutation.mutate(s.id);
                          }
                        }}
                        title="Delete block"
                        data-testid={`button-delete-${s.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4 sm:p-6 space-y-5">
                    <p className="text-xs text-[#534340] bg-[#f8f0e8] rounded-md px-3 py-2 leading-relaxed">
                      {helperFor(s.sectionType)}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#47160b]">Heading (Title)</Label>
                        <Input
                          value={d.title}
                          onChange={(e) => updateDraft(s.id, { title: e.target.value })}
                          placeholder="The big headline shown on the page"
                          className="mt-1"
                          data-testid={`input-title-${s.id}`}
                        />
                      </div>
                      <div>
                        <Label className="text-[#47160b]">Subheading (Subtitle)</Label>
                        <Input
                          value={d.subtitle}
                          onChange={(e) => updateDraft(s.id, { subtitle: e.target.value })}
                          placeholder="Small overline text above or below the title"
                          className="mt-1"
                          data-testid={`input-subtitle-${s.id}`}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[#47160b]">Paragraph (Description)</Label>
                      <Textarea
                        value={d.description}
                        onChange={(e) => updateDraft(s.id, { description: e.target.value })}
                        placeholder="Body text. Line breaks are kept as paragraphs."
                        rows={5}
                        className="mt-1"
                        data-testid={`textarea-description-${s.id}`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <Label className="text-[#47160b]">
                          {s.sectionType === 'hero' ? 'Background Media (photos & videos)' : 'Photos / Media'}
                        </Label>
                        <span className="text-xs text-[#86736f]">
                          {(() => {
                            const imgs = d.mediaTypes.filter((t) => t === 'image').length;
                            const vids = d.mediaTypes.filter((t) => t === 'video').length;
                            const total = d.media.length;
                            if (total === 0) return 'No media yet';
                            if (s.sectionType === 'hero' && vids > 0) {
                              return `${total} item${total === 1 ? '' : 's'} (${imgs} image${imgs === 1 ? '' : 's'}, ${vids} video${vids === 1 ? '' : 's'})`;
                            }
                            return `${total} ${total === 1 ? 'item' : 'items'}`;
                          })()}
                        </span>
                      </div>

                      {d.media.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                          {d.media.map((src, i) => {
                            const t = d.mediaTypes[i] || 'image';
                            return (
                              <div
                                key={`${src}-${i}`}
                                className="relative group rounded-lg overflow-hidden border border-[#efe1d8] bg-[#efe7e1]"
                              >
                                {t === 'video' ? (
                                  <div className="relative w-full h-28">
                                    <video
                                      src={src}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                      preload="metadata"
                                      data-testid={`media-preview-${s.id}-${i}`}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                      <div className="bg-white/90 rounded-full p-2">
                                        <Play className="w-4 h-4 text-[#47160b] fill-[#47160b]" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={src}
                                    alt=""
                                    className="w-full h-28 object-cover"
                                    data-testid={`media-preview-${s.id}-${i}`}
                                  />
                                )}

                                <div className="absolute top-1 left-1 flex gap-1">
                                  <span className="bg-black/60 text-white text-[10px] font-bold rounded px-1.5 py-0.5">
                                    #{i + 1}
                                  </span>
                                  <span
                                    className={`flex items-center gap-1 text-[10px] font-bold rounded px-1.5 py-0.5 text-white ${
                                      t === 'video' ? 'bg-purple-600' : 'bg-blue-600'
                                    }`}
                                    data-testid={`media-type-badge-${s.id}-${i}`}
                                  >
                                    {t === 'video' ? (
                                      <>
                                        <VideoIcon className="w-2.5 h-2.5" />
                                        VIDEO
                                      </>
                                    ) : (
                                      <>
                                        <ImageIcon className="w-2.5 h-2.5" />
                                        IMAGE
                                      </>
                                    )}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeMedia(s.id, i)}
                                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove"
                                  data-testid={`button-remove-media-${s.id}-${i}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>

                                <div className="absolute bottom-1 left-1 right-1 flex justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => moveMedia(s.id, i, -1)}
                                      disabled={i === 0}
                                      className="bg-black/70 text-white rounded p-0.5 disabled:opacity-30"
                                      title="Move left"
                                    >
                                      <ArrowUp className="w-3 h-3 rotate-[-90deg]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveMedia(s.id, i, 1)}
                                      disabled={i === d.media.length - 1}
                                      className="bg-black/70 text-white rounded p-0.5 disabled:opacity-30"
                                      title="Move right"
                                    >
                                      <ArrowUp className="w-3 h-3 rotate-90" />
                                    </button>
                                  </div>
                                  {s.sectionType === 'hero' && (
                                    <button
                                      type="button"
                                      onClick={() => setMediaType(s.id, i, t === 'video' ? 'image' : 'video')}
                                      className="bg-black/70 text-white rounded px-1.5 py-0.5 text-[10px] font-bold"
                                      title={`Switch to ${t === 'video' ? 'IMAGE' : 'VIDEO'}`}
                                      data-testid={`button-toggle-type-${s.id}-${i}`}
                                    >
                                      → {t === 'video' ? 'IMG' : 'VID'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2">
                        <UrlAdder onAdd={(v) => addMediaUrl(s.id, v)} testId={`input-url-${s.id}`} />
                        <label
                          className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-[#d8c2bd] rounded-md cursor-pointer hover:bg-[#f5ece7] transition-colors text-sm text-[#534340] sm:whitespace-nowrap"
                          data-testid={`label-upload-${s.id}`}
                        >
                          <Upload className="w-4 h-4 text-[#9b4518]" />
                          {s.sectionType === 'hero' ? 'Upload image or video' : 'Upload from device'}
                          <input
                            type="file"
                            accept={s.sectionType === 'hero' ? 'image/*,video/*' : 'image/*'}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onMediaFile(s.id, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      {s.sectionType === 'hero' && (
                        <p className="text-[11px] text-[#86736f] mt-2 leading-relaxed">
                          Carousel rules: images stay <strong>3 seconds</strong> with fade/zoom; videos play <strong>once muted</strong> and auto-advance to the next slide; if a video fails it skips to the next item.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#47160b]">Button Text (optional)</Label>
                        <Input
                          value={d.ctaText}
                          onChange={(e) => updateDraft(s.id, { ctaText: e.target.value })}
                          placeholder="e.g. See Our Journey"
                          className="mt-1"
                          data-testid={`input-cta-text-${s.id}`}
                        />
                      </div>
                      <div>
                        <Label className="text-[#47160b]">Button Link (optional)</Label>
                        <Input
                          value={d.ctaLink}
                          onChange={(e) => updateDraft(s.id, { ctaLink: e.target.value })}
                          placeholder="e.g. /products"
                          className="mt-1"
                          data-testid={`input-cta-link-${s.id}`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#efe1d8]">
                      <Button
                        onClick={() => saveBlock(s)}
                        disabled={!dirty || updateMutation.isPending}
                        className="bg-[#47160b] hover:bg-[#632b1e] text-white"
                        data-testid={`button-save-${s.id}`}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {dirty ? 'Save Changes' : 'Saved'}
                      </Button>
                      {dirty && (
                        <Button
                          variant="outline"
                          onClick={() => resetBlock(s)}
                          data-testid={`button-discard-${s.id}`}
                        >
                          Discard
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new block dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new block</DialogTitle>
            <DialogDescription>
              Pick the type of block you want to add. You can fill in the heading, photos and text on the next screen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label>Block type</Label>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger data-testid="select-new-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{t.label}</span>
                      <span className="text-xs text-gray-500">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={addSection}
              disabled={createMutation.isPending}
              className="bg-[#47160b] hover:bg-[#632b1e] text-white"
              data-testid="button-confirm-add"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UrlAdder({ onAdd, testId }: { onAdd: (v: string) => void; testId?: string }) {
  const [v, setV] = useState('');
  return (
    <div className="flex gap-2 flex-1">
      <Input
        type="url"
        placeholder="Paste an image URL"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd(v);
            setV('');
          }
        }}
        data-testid={testId}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          onAdd(v);
          setV('');
        }}
      >
        Add URL
      </Button>
    </div>
  );
}
