import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Trash2, RotateCcw, Search, Loader2, ShieldAlert, CalendarClock, Inbox,
} from 'lucide-react';

type DeletedUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  deletedAt: string | null;
  recoveryDeadline: string | null;
  deletionReason: string | null;
  daysLeft: number;
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function DeletedAccounts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [confirmRecover, setConfirmRecover] = useState<DeletedUser | null>(null);

  const { data: users = [], isLoading } = useQuery<DeletedUser[]>({
    queryKey: ['/api/admin/deleted-users'],
  });

  const recoverMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/users/${id}/recover`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Account recovered', description: 'The user can log in again now.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deleted-users'] });
      setConfirmRecover(null);
    },
    onError: (e: any) =>
      toast({ title: 'Recovery failed', description: e.message || 'Try again.', variant: 'destructive' }),
  });

  const purgeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/deleted-users/purge', {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: 'Cleanup complete', description: `Removed ${data.purged ?? 0} expired account(s).` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deleted-users'] });
    },
    onError: (e: any) =>
      toast({ title: 'Cleanup failed', description: e.message || 'Try again.', variant: 'destructive' }),
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) => {
        const hay = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${u.phone || ''} ${u.username || ''}`.toLowerCase();
        return hay.includes(q);
      })
    : users;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation('/super-admin')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-navy flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-600" /> Deleted Accounts
            </h1>
            <p className="text-sm text-gray-600">
              Customers who have requested account deletion. They can be recovered within 30 days.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => purgeMutation.mutate()}
            disabled={purgeMutation.isPending}
            data-testid="button-purge-now"
          >
            {purgeMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CalendarClock className="w-4 h-4 mr-2" />
            )}
            Run cleanup
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending recovery ({filtered.length})</span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search name, email, phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-deleted"
                />
              </div>
            </CardTitle>
            <CardDescription>
              Each entry will be permanently removed automatically after its 30-day recovery window expires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No deleted accounts</p>
                <p className="text-sm">When users delete their accounts, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone / Email</TableHead>
                      <TableHead>Deleted on</TableHead>
                      <TableHead>Recovery deadline</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => {
                      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || `User #${u.id}`;
                      return (
                        <TableRow key={u.id} data-testid={`row-deleted-${u.id}`}>
                          <TableCell>
                            <div className="font-medium text-navy">{fullName}</div>
                            <div className="text-xs text-gray-500">{u.role}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{u.phone || '—'}</div>
                            <div className="text-xs text-gray-500">{u.email || '—'}</div>
                          </TableCell>
                          <TableCell className="text-sm">{fmtDate(u.deletedAt)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{fmtDate(u.recoveryDeadline)}</div>
                            <Badge
                              variant={u.daysLeft <= 3 ? 'destructive' : 'secondary'}
                              className="mt-1 text-[10px]"
                            >
                              {u.daysLeft} day{u.daysLeft === 1 ? '' : 's'} left
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm text-gray-700 truncate" title={u.deletionReason || ''}>
                              {u.deletionReason || <span className="text-gray-400 italic">No reason given</span>}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setConfirmRecover(u)}
                              disabled={recoverMutation.isPending}
                              data-testid={`button-recover-${u.id}`}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Recover Account
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recovery confirmation dialog */}
      <Dialog open={!!confirmRecover} onOpenChange={(o) => !o && setConfirmRecover(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600" /> Recover this account?
            </DialogTitle>
            <DialogDescription>
              {confirmRecover && (
                <>
                  This will restore login access for{' '}
                  <strong>
                    {`${confirmRecover.firstName || ''} ${confirmRecover.lastName || ''}`.trim() ||
                      confirmRecover.username ||
                      `User #${confirmRecover.id}`}
                  </strong>
                  {confirmRecover.phone ? ` (${confirmRecover.phone})` : ''}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmRecover(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmRecover && recoverMutation.mutate(confirmRecover.id)}
              disabled={recoverMutation.isPending}
              data-testid="button-confirm-recover"
            >
              {recoverMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Recover Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
