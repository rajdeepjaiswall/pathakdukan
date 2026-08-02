import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { ADMIN_FEATURE_KEYS, type AdminFeatureKey } from '@shared/schema';

interface MePermissions {
  adminId: string | null;
  role: 'admin' | 'sub_admin' | 'super_admin';
  isActive: boolean;
  permissions: Record<string, boolean>;
  features: readonly string[];
}

const DEFAULT_ALL_ON: Record<string, boolean> = ADMIN_FEATURE_KEYS.reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {} as Record<string, boolean>);

/**
 * Live admin-permissions hook.
 * - Super admin: always returns all-on (no network call needed).
 * - Admin / Sub admin: fetches /api/admin/me/permissions and refetches every 30s
 *   so toggle changes from the super admin propagate near-real-time.
 */
export function useAdminPermissions() {
  const { user, isAuthenticated } = useAuth();
  const isAdminRole = !!user && ['admin', 'sub_admin', 'super_admin'].includes(user.role);

  const query = useQuery<MePermissions>({
    queryKey: ['/api/admin/me/permissions'],
    enabled: isAuthenticated && isAdminRole && user?.role !== 'super_admin',
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  if (!isAdminRole) {
    return {
      isLoading: false,
      isSuperAdmin: false,
      permissions: {} as Record<string, boolean>,
      can: () => false,
    };
  }

  if (user?.role === 'super_admin') {
    return {
      isLoading: false,
      isSuperAdmin: true,
      permissions: DEFAULT_ALL_ON,
      can: (_k: AdminFeatureKey | string) => true,
    };
  }

  const perms = { ...DEFAULT_ALL_ON, ...(query.data?.permissions || {}) };
  return {
    isLoading: query.isLoading,
    isSuperAdmin: false,
    permissions: perms,
    can: (key: AdminFeatureKey | string) => perms[key] !== false,
  };
}
