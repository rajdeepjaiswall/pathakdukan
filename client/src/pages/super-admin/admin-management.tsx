import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Shield, Plus, Key, Trash2, Eye, Pencil, Power, Copy, Check,
  Crown, UserCog, MessageCircle, Mail, AlertTriangle, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { ADMIN_FEATURE_KEYS, ADMIN_FEATURE_LABELS, type AdminFeatureKey } from '@shared/schema';

interface AdminUser {
  id: number;
  username: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: 'admin' | 'sub_admin' | 'super_admin';
  adminId?: string | null;
  isActive?: boolean;
  isVerified?: boolean | null;
  createdAt?: string;
  adminPermissions?: Record<string, boolean>;
}

interface CreatedCredentials {
  adminId: string;
  username: string;
  password: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  sub_admin: { label: 'Sub Admin', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      data-testid="button-copy"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}

export default function AdminManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [permsOpen, setPermsOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [newCreds, setNewCreds] = useState<CreatedCredentials | null>(null);
  const [newAdminForm, setNewAdminForm] = useState({
    username: '', email: '', phone: '', firstName: '', lastName: '', role: 'admin' as 'admin' | 'sub_admin',
  });
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: 'admin' as 'admin' | 'sub_admin',
  });
  const [draftPerms, setDraftPerms] = useState<Record<string, boolean>>({});

  // Hard-redirect non-super-admins
  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  const { data: admins, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/super-admin/admins'],
  });

  const sortedAdmins = useMemo(() => {
    if (!admins) return [];
    return [...admins].sort((a, b) => {
      // Super admin first
      if (a.role === 'super_admin' && b.role !== 'super_admin') return -1;
      if (b.role === 'super_admin' && a.role !== 'super_admin') return 1;
      return a.username.localeCompare(b.username);
    });
  }, [admins]);

  // ---- Mutations ----
  const createMutation = useMutation({
    mutationFn: async (data: typeof newAdminForm) => {
      const res = await apiRequest('POST', '/api/super-admin/admins', data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      setCreateOpen(false);
      setNewAdminForm({ username: '', email: '', phone: '', firstName: '', lastName: '', role: 'admin' });
      setNewCreds(data.credentials);
      setCredentialsOpen(true);
      toast({
        title: 'Admin created',
        description: data.whatsappSent
          ? 'Credentials shown below and sent via WhatsApp.'
          : 'Credentials are shown below — copy them now.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Could not create admin', description: cleanErr(error), variant: 'destructive' });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editForm }) => {
      const res = await apiRequest('PUT', `/api/super-admin/admins/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      setEditOpen(false);
      toast({ title: 'Admin updated' });
    },
    onError: (error: any) => toast({ title: 'Update failed', description: cleanErr(error), variant: 'destructive' }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/super-admin/admins/${id}/status`, { isActive });
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      toast({ title: vars.isActive ? 'Admin enabled' : 'Admin disabled' });
    },
    onError: (error: any) => toast({ title: 'Status change failed', description: cleanErr(error), variant: 'destructive' }),
  });

  const permsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: number; permissions: Record<string, boolean> }) => {
      const res = await apiRequest('PATCH', `/api/super-admin/admins/${id}/permissions`, { permissions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      setPermsOpen(false);
      toast({ title: 'Permissions saved', description: 'Changes apply on the admin\'s next request.' });
    },
    onError: (error: any) => toast({ title: 'Save failed', description: cleanErr(error), variant: 'destructive' }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/super-admin/admins/${id}/reset-password`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      setConfirmReset(null);
      setNewCreds(data.credentials);
      setCredentialsOpen(true);
      toast({
        title: 'Password reset',
        description: data.whatsappSent ? 'New password sent via WhatsApp.' : 'Show the new password to the admin now.',
      });
    },
    onError: (error: any) => toast({ title: 'Reset failed', description: cleanErr(error), variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/super-admin/admins/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      setConfirmDelete(null);
      toast({ title: 'Admin deleted' });
    },
    onError: (error: any) => toast({ title: 'Delete failed', description: cleanErr(error), variant: 'destructive' }),
  });

  // ---- Handlers ----
  const openPermissions = (admin: AdminUser) => {
    if (admin.role === 'super_admin') {
      toast({ title: 'Super Admin', description: 'Super Admin always has all permissions.' });
      return;
    }
    setSelected(admin);
    const base: Record<string, boolean> = {};
    ADMIN_FEATURE_KEYS.forEach((k) => {
      base[k] = admin.adminPermissions?.[k] !== false;
    });
    setDraftPerms(base);
    setPermsOpen(true);
  };

  const openEdit = (admin: AdminUser) => {
    setSelected(admin);
    setEditForm({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      email: admin.email || '',
      phone: admin.phone || '',
      role: (admin.role === 'sub_admin' ? 'sub_admin' : 'admin'),
    });
    setEditOpen(true);
  };

  const sendCredentialsViaWhatsApp = (phone?: string | null) => {
    if (!newCreds) return;
    const text = `Welcome to Pathak Bhandar Admin Panel\n\nAdmin ID: ${newCreds.adminId}\nUsername: ${newCreds.username}\nTemporary Password: ${newCreds.password}\n\nLogin: https://pathakbhandar.in/admin/login`;
    const url = phone
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const sendCredentialsViaEmail = (email?: string | null) => {
    if (!newCreds) return;
    const subject = 'Your Pathak Bhandar Admin Account';
    const body = `Welcome to Pathak Bhandar Admin Panel\n\nAdmin ID: ${newCreds.adminId}\nUsername: ${newCreds.username}\nTemporary Password: ${newCreds.password}\n\nLogin: https://pathakbhandar.in/admin/login`;
    window.location.href = `mailto:${email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // ---- Render ----
  return (
    <div className="min-h-screen bg-cream/40">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display text-navy flex items-center gap-3">
              <Shield className="w-8 h-8 text-champagne" />
              Admin Management
            </h1>
            <p className="text-slate-600 mt-2">
              Create, edit, disable and manage permissions for every admin and sub-admin.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-navy hover:bg-navy/90 text-white"
            data-testid="button-add-admin"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-navy" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedAdmins.map((admin) => {
              const isSelf = admin.id === user.id;
              const isSuperAdmin = admin.role === 'super_admin';
              const roleMeta = ROLE_LABELS[admin.role] || ROLE_LABELS.admin;
              const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.username;

              return (
                <Card
                  key={admin.id}
                  className={`relative overflow-hidden border-2 ${
                    admin.isActive === false ? 'border-red-200 bg-red-50/30' : 'border-stone-200 bg-white'
                  }`}
                  data-testid={`card-admin-${admin.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                          isSuperAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-navy to-navy/70'
                        }`}>
                          {isSuperAdmin ? <Crown className="w-6 h-6" /> : <UserCog className="w-6 h-6" />}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{fullName}</CardTitle>
                          <p className="text-xs text-slate-500 truncate">@{admin.username}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={roleMeta.color + ' shrink-0'}>
                        {roleMeta.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">Admin ID</p>
                        <p className="font-mono font-semibold text-navy" data-testid={`text-admin-id-${admin.id}`}>
                          {admin.adminId || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Status</p>
                        <p className={`font-semibold ${admin.isActive === false ? 'text-red-600' : 'text-emerald-600'}`}>
                          {admin.isActive === false ? 'Disabled' : 'Active'}
                        </p>
                      </div>
                      {admin.email && (
                        <div className="col-span-2 truncate">
                          <p className="text-slate-500">Email</p>
                          <p className="truncate">{admin.email}</p>
                        </div>
                      )}
                      {admin.phone && (
                        <div className="col-span-2">
                          <p className="text-slate-500">Phone</p>
                          <p>{admin.phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPermissions(admin)}
                        disabled={isSuperAdmin}
                        title="View / change permissions"
                        data-testid={`button-permissions-${admin.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Permissions
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(admin)}
                        disabled={isSuperAdmin && !isSelf}
                        data-testid={`button-edit-${admin.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmReset(admin)}
                        disabled={isSuperAdmin && !isSelf}
                        data-testid={`button-reset-${admin.id}`}
                      >
                        <Key className="w-4 h-4 mr-1" />
                        Reset
                      </Button>

                      {!isSuperAdmin && (
                        <Button
                          size="sm"
                          variant={admin.isActive === false ? 'default' : 'outline'}
                          onClick={() => toggleActiveMutation.mutate({ id: admin.id, isActive: !(admin.isActive !== false) })}
                          disabled={isSelf || toggleActiveMutation.isPending}
                          className={admin.isActive === false ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                          data-testid={`button-toggle-${admin.id}`}
                        >
                          <Power className="w-4 h-4 mr-1" />
                          {admin.isActive === false ? 'Enable' : 'Disable'}
                        </Button>
                      )}

                      {!isSuperAdmin && !isSelf && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDelete(admin)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-${admin.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ============== Create Admin Dialog ============== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>
              An Admin ID and a secure password will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fn">First Name</Label>
                <Input
                  id="fn"
                  value={newAdminForm.firstName}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, firstName: e.target.value })}
                  data-testid="input-firstname"
                />
              </div>
              <div>
                <Label htmlFor="ln">Last Name</Label>
                <Input
                  id="ln"
                  value={newAdminForm.lastName}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, lastName: e.target.value })}
                  data-testid="input-lastname"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="un">Username *</Label>
              <Input
                id="un"
                value={newAdminForm.username}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                data-testid="input-username"
              />
            </div>
            <div>
              <Label htmlFor="em">Email *</Label>
              <Input
                id="em"
                type="email"
                value={newAdminForm.email}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="ph">Phone (for WhatsApp credentials)</Label>
              <Input
                id="ph"
                value={newAdminForm.phone}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                placeholder="+91XXXXXXXXXX"
                data-testid="input-phone"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={newAdminForm.role}
                onValueChange={(v) => setNewAdminForm({ ...newAdminForm, role: v as any })}
              >
                <SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">All features are enabled by default; restrict in Permissions later.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(newAdminForm)}
              disabled={!newAdminForm.username || !newAdminForm.email || createMutation.isPending}
              className="bg-navy hover:bg-navy/90 text-white"
              data-testid="button-create-submit"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============== Credentials Dialog ============== */}
      <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Save These Credentials Now
            </DialogTitle>
            <DialogDescription>
              The password is shown only once. Copy it or send it via WhatsApp/Email immediately.
            </DialogDescription>
          </DialogHeader>
          {newCreds && (
            <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <CredentialRow label="Admin ID" value={newCreds.adminId} />
              <CredentialRow label="Username" value={newCreds.username} />
              <CredentialRow label="Password" value={newCreds.password} mono />
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => sendCredentialsViaWhatsApp(selected?.phone)}
              data-testid="button-send-whatsapp"
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Send via WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => sendCredentialsViaEmail(selected?.email)}
              data-testid="button-send-email"
            >
              <Mail className="w-4 h-4 mr-2" /> Send via Email
            </Button>
            <Button
              onClick={() => { setCredentialsOpen(false); setNewCreds(null); }}
              className="bg-navy hover:bg-navy/90 text-white"
              data-testid="button-credentials-done"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============== Permissions Dialog ============== */}
      <Dialog open={permsOpen} onOpenChange={setPermsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-champagne" />
              Permissions — {selected?.adminId} ({selected?.username})
            </DialogTitle>
            <DialogDescription>
              Toggle each feature on/off. Disabled features are hidden from the admin and blocked on the server.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between gap-2 py-2 border-y border-stone-200">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const all: Record<string, boolean> = {};
                ADMIN_FEATURE_KEYS.forEach((k) => (all[k] = true));
                setDraftPerms(all);
              }}
            >
              Enable all
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const none: Record<string, boolean> = {};
                ADMIN_FEATURE_KEYS.forEach((k) => (none[k] = false));
                setDraftPerms(none);
              }}
            >
              Disable all
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
            {ADMIN_FEATURE_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white hover:bg-cream/40"
                data-testid={`row-perm-${key}`}
              >
                <div>
                  <p className="font-medium text-navy">{ADMIN_FEATURE_LABELS[key as AdminFeatureKey]}</p>
                  <p className="text-xs text-slate-500 font-mono">{key}</p>
                </div>
                <Switch
                  checked={!!draftPerms[key]}
                  onCheckedChange={(v) => setDraftPerms({ ...draftPerms, [key]: !!v })}
                  data-testid={`switch-perm-${key}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermsOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selected && permsMutation.mutate({ id: selected.id, permissions: draftPerms })}
              disabled={permsMutation.isPending}
              className="bg-navy hover:bg-navy/90 text-white"
              data-testid="button-save-permissions"
            >
              {permsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============== Edit Admin Dialog ============== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin — {selected?.adminId}</DialogTitle>
            <DialogDescription>Admin ID is permanent and cannot be changed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} data-testid="input-edit-firstname" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} data-testid="input-edit-lastname" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} data-testid="input-edit-email" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} data-testid="input-edit-phone" />
            </div>
            {selected?.role !== 'super_admin' && (
              <div>
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as any })}>
                  <SelectTrigger data-testid="select-edit-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sub_admin">Sub Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selected && editMutation.mutate({ id: selected.id, data: editForm })}
              disabled={editMutation.isPending}
              className="bg-navy hover:bg-navy/90 text-white"
              data-testid="button-save-edit"
            >
              {editMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============== Reset confirm ============== */}
      <AlertDialog open={!!confirmReset} onOpenChange={(o) => !o && setConfirmReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password?</AlertDialogTitle>
            <AlertDialogDescription>
              A new secure password will be generated for <strong>{confirmReset?.username}</strong>. They will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmReset && resetPasswordMutation.mutate(confirmReset.id)}
              className="bg-navy hover:bg-navy/90 text-white"
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============== Delete confirm ============== */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{confirmDelete?.username}</strong> ({confirmDelete?.adminId}) and their permissions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CredentialRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-600 font-medium mb-1">{label}</p>
      <div className="flex gap-2 items-center">
        <code className={`flex-1 bg-white border border-amber-200 rounded px-3 py-2 ${mono ? 'font-mono' : ''} text-sm break-all`}>
          {value}
        </code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function cleanErr(error: any): string {
  const msg = error?.message || 'Something went wrong';
  // Strip "400: {"message":"..."}" prefix if present
  const match = msg.match(/^\d{3}:\s*(.*)$/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return parsed.message || match[1];
    } catch { return match[1]; }
  }
  return msg;
}
