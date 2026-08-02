import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, Loader2, Save, ArrowLeft, Info } from 'lucide-react';
import type { ChargesConfig } from '@shared/schema';

const DEFAULT_CONFIG: ChargesConfig = {
  deliveryEnabled: false,
  deliveryFreeThresholdEnabled: false,
  deliveryFreeThreshold: 0,
  deliveryPercentageEnabled: false,
  deliveryPercentage: 0,
  deliveryFixedEnabled: false,
  deliveryFixedCharge: 0,
  handlingEnabled: false,
  handlingFreeThresholdEnabled: false,
  handlingFreeThreshold: 0,
  handlingPercentageEnabled: false,
  handlingPercentage: 0,
  handlingFixedEnabled: false,
  handlingFixedCharge: 0,
};

type NumKey = {
  [K in keyof ChargesConfig]: ChargesConfig[K] extends number ? K : never;
}[keyof ChargesConfig];
type BoolKey = {
  [K in keyof ChargesConfig]: ChargesConfig[K] extends boolean ? K : never;
}[keyof ChargesConfig];

interface PrioritySectionProps {
  step: number;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  value: number;
  onValue: (v: number) => void;
  prefix?: string;
  suffix?: string;
  testIdPrefix: string;
}

function PrioritySection({
  step,
  title,
  description,
  enabled,
  onToggle,
  value,
  onValue,
  prefix,
  suffix,
  testIdPrefix,
}: PrioritySectionProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        enabled ? 'border-amber-300 bg-amber-50/60' : 'border-amber-100 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-900">
            {step}
          </div>
          <div>
            <p className="font-semibold text-navy">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          data-testid={`switch-${testIdPrefix}`}
        />
      </div>
      {enabled && (
        <div className="mt-3 pl-10">
          <div className="relative max-w-[220px]">
            {prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {prefix}
              </span>
            )}
            <Input
              type="number"
              min={0}
              step="0.01"
              value={Number.isFinite(value) ? value : 0}
              onChange={(e) => onValue(parseFloat(e.target.value) || 0)}
              className={`${prefix ? 'pl-7' : ''} ${suffix ? 'pr-9' : ''}`}
              data-testid={`input-${testIdPrefix}`}
            />
            {suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {suffix}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ChargeCardProps {
  config: ChargesConfig;
  set: <K extends keyof ChargesConfig>(key: K, value: ChargesConfig[K]) => void;
  kind: 'delivery' | 'handling';
}

function ChargeCard({ config, set, kind }: ChargeCardProps) {
  const isDelivery = kind === 'delivery';
  const label = isDelivery ? 'Delivery Charges' : 'Handling Charges';
  const Icon = isDelivery ? Truck : Package;

  const enabledKey = (isDelivery ? 'deliveryEnabled' : 'handlingEnabled') as BoolKey;
  const thresholdEnabledKey = (isDelivery
    ? 'deliveryFreeThresholdEnabled'
    : 'handlingFreeThresholdEnabled') as BoolKey;
  const thresholdKey = (isDelivery ? 'deliveryFreeThreshold' : 'handlingFreeThreshold') as NumKey;
  const pctEnabledKey = (isDelivery
    ? 'deliveryPercentageEnabled'
    : 'handlingPercentageEnabled') as BoolKey;
  const pctKey = (isDelivery ? 'deliveryPercentage' : 'handlingPercentage') as NumKey;
  const fixedEnabledKey = (isDelivery ? 'deliveryFixedEnabled' : 'handlingFixedEnabled') as BoolKey;
  const fixedKey = (isDelivery ? 'deliveryFixedCharge' : 'handlingFixedCharge') as NumKey;

  const masterOn = config[enabledKey];

  return (
    <Card className="border-amber-200 bg-[#fdfaf3]">
      <CardHeader className="border-b border-amber-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-navy">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Icon className="h-5 w-5" />
            </span>
            {label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {masterOn ? 'On' : 'Off'}
            </span>
            <Switch
              checked={masterOn}
              onCheckedChange={(v) => set(enabledKey, v)}
              data-testid={`switch-${kind}-enabled`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {!masterOn ? (
          <p className="py-4 text-center text-sm text-gray-500">
            {label} are turned off. Customers will not see this charge.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-amber-100/60 p-3 text-xs text-amber-900">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Choose how this charge is calculated: <strong>Percentage</strong> or{' '}
                <strong>Fixed</strong> — turning one on automatically turns the other off. The
                optional <strong>Free Threshold</strong> works alongside them and waives the charge
                once the cart subtotal reaches your set amount. If no method is on, the charge shows
                as FREE.
              </span>
            </div>

            <PrioritySection
              step={1}
              title="Free Above Threshold"
              description="Waive the charge once the cart subtotal reaches this amount."
              enabled={config[thresholdEnabledKey]}
              onToggle={(v) => set(thresholdEnabledKey, v)}
              value={config[thresholdKey]}
              onValue={(v) => set(thresholdKey, v)}
              prefix="₹"
              testIdPrefix={`${kind}-threshold`}
            />
            <PrioritySection
              step={2}
              title="Percentage of Subtotal"
              description="Charge a percentage of the cart subtotal."
              enabled={config[pctEnabledKey]}
              onToggle={(v) => {
                set(pctEnabledKey, v);
                if (v) set(fixedEnabledKey, false);
              }}
              value={config[pctKey]}
              onValue={(v) => set(pctKey, v)}
              suffix="%"
              testIdPrefix={`${kind}-percentage`}
            />
            <PrioritySection
              step={3}
              title="Fixed Amount"
              description="Charge a flat fixed amount on every order."
              enabled={config[fixedEnabledKey]}
              onToggle={(v) => {
                set(fixedEnabledKey, v);
                if (v) set(pctEnabledKey, false);
              }}
              value={config[fixedKey]}
              onValue={(v) => set(fixedKey, v)}
              prefix="₹"
              testIdPrefix={`${kind}-fixed`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminCharges() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<ChargesConfig>(DEFAULT_CONFIG);

  const allowed =
    !!user &&
    (user.role === 'admin' || user.role === 'super_admin' || user.role === 'sub_admin');

  const { data, isLoading } = useQuery<ChargesConfig>({
    queryKey: ['/api/admin/charges'],
    enabled: allowed,
  });

  useEffect(() => {
    if (!authLoading && !allowed) {
      setLocation('/admin/login');
    }
  }, [authLoading, allowed, setLocation]);

  useEffect(() => {
    if (!data) return;
    const merged = { ...DEFAULT_CONFIG, ...data };
    // Percentage and Fixed are mutually exclusive. If a legacy config has both
    // turned on, keep Percentage (matches the calculation priority) and clear
    // Fixed so the UI never shows a contradictory state.
    if (merged.deliveryPercentageEnabled && merged.deliveryFixedEnabled) {
      merged.deliveryFixedEnabled = false;
    }
    if (merged.handlingPercentageEnabled && merged.handlingFixedEnabled) {
      merged.handlingFixedEnabled = false;
    }
    setConfig(merged);
  }, [data]);

  const set = <K extends keyof ChargesConfig>(key: K, value: ChargesConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/charges', config);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/charges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/charges'] });
      toast({ title: 'Charges saved', description: 'Your delivery and handling settings are now live.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Could not save charges',
        description: err?.message || 'Please check the values and try again.',
        variant: 'destructive',
      });
    },
  });

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation('/admin')}
          className="mb-4 text-navy"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Delivery &amp; Handling Charges</h1>
          <p className="text-sm text-gray-500">
            Control how delivery and handling charges are applied to customer carts. Changes go live
            immediately after saving.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading charges...
          </div>
        ) : (
          <div className="space-y-6">
            <ChargeCard config={config} set={set} kind="delivery" />
            <ChargeCard config={config} set={set} kind="handling" />

            <Separator />

            <div className="flex justify-end">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-champagne text-navy hover:bg-champagne/90"
                data-testid="button-save-charges"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
