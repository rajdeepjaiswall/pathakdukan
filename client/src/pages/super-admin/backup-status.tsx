import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, Database, CheckCircle2, AlertTriangle, RefreshCw, Loader2, Clock, Activity,
} from 'lucide-react';

type Health = {
  enabled: boolean;
  stats: {
    totalWrites: number;
    successfulWrites: number;
    failedWrites: number;
    pendingRetries: number;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    lastFailureMessage: string | null;
  };
  pendingFailures: number;
  oldestPendingAt: string | null;
  primaryRowCounts: Record<string, number>;
  mirrorRowCounts: Record<string, number>;
  inSync: boolean;
};

const fmtTime = (s: string | null) =>
  s
    ? new Date(s).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function BackupStatusPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery<Health>({
    queryKey: ['/api/super-admin/mirror/health'],
    refetchInterval: 30_000,
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/super-admin/mirror/retry', {});
      return res.json();
    },
    onSuccess: (res: any) => {
      toast({
        title: 'Retry finished',
        description: `Tried ${res.attempted}, recovered ${res.succeeded}, still pending ${res.stillFailing}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/mirror/health'] });
    },
    onError: (e: any) =>
      toast({
        title: 'Retry failed',
        description: e.message || 'Try again.',
        variant: 'destructive',
      }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const tables = Object.keys(data.primaryRowCounts);
  const successRate =
    data.stats.totalWrites > 0
      ? Math.round((data.stats.successfulWrites / data.stats.totalWrites) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/super-admin/dashboard')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Backup Database Status
          </h1>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {data.pendingFailures > 0 && (
              <Button
                size="sm"
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                data-testid="button-retry-failures"
              >
                {retryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Retry pending ({data.pendingFailures})
              </Button>
            )}
          </div>
        </div>

        {/* Overall Status Card */}
        <Card
          className={`border-l-4 ${
            !data.enabled
              ? 'border-l-gray-400'
              : data.inSync
              ? 'border-l-green-500'
              : 'border-l-amber-500'
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {!data.enabled ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-gray-500" />
                  Backup is disabled
                </>
              ) : data.inSync ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  In sync
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Out of sync
                </>
              )}
            </CardTitle>
            <CardDescription>
              {!data.enabled
                ? 'The mirror database is not configured.'
                : data.inSync
                ? 'Both databases match. Every change made to the live shop is being copied to the backup.'
                : 'The backup is behind the main database. Use "Retry pending" to try again, or check the failure messages below.'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Writes copied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.successfulWrites.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Since the server started</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{successRate}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {data.stats.failedWrites} failures out of {data.stats.totalWrites}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending retries</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  data.pendingFailures === 0 ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {data.pendingFailures}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.oldestPendingAt
                  ? `Oldest: ${fmtTime(data.oldestPendingAt)}`
                  : 'No backlog'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Last copied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-semibold">{fmtTime(data.stats.lastSuccessAt)}</div>
              {data.stats.lastFailureAt && (
                <p className="text-xs text-red-600 mt-1">
                  Last error: {fmtTime(data.stats.lastFailureAt)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-table comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Row count check
            </CardTitle>
            <CardDescription>
              These are sampled key tables. A green tick means the backup has the same number of
              rows as the live database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead className="text-right">Live database</TableHead>
                  <TableHead className="text-right">Backup database</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((tbl) => {
                  const p = data.primaryRowCounts[tbl] ?? 0;
                  const m = data.mirrorRowCounts[tbl] ?? 0;
                  const ok = p === m;
                  return (
                    <TableRow key={tbl}>
                      <TableCell className="font-mono text-sm">{tbl}</TableCell>
                      <TableCell className="text-right">{p.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{m.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {ok ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Match
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Diff: {Math.abs(p - m)}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {data.stats.lastFailureMessage && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="text-sm">Last error message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs text-red-700 bg-red-50 p-3 rounded">
                {data.stats.lastFailureMessage}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
