import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldCheck, MessageCircle, CheckCircle2, Building2, Sparkles, Phone, Send } from 'lucide-react';
import type { FoundationContent } from '@shared/schema';

const SCALE_OPTIONS = [
  '₹10,000 – ₹50,000',
  '₹50,000 – ₹2,00,000',
  '₹2 Lakh – ₹10 Lakh',
  '₹10 Lakh and above',
];

export default function GetdownFoundationPage() {
  const { toast } = useToast();

  const { data: foundation } = useQuery<FoundationContent>({
    queryKey: ['/api/foundation'],
  });

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [scale, setScale] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sendOtp = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/foundation/send-otp', {
        phone: phone.trim(),
        name: name.trim() || 'Friend',
      });
      return res.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      toast({ title: 'OTP sent', description: 'Check your phone for the SMS verification code.' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not send OTP', description: e.message || 'Try again.', variant: 'destructive' }),
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/foundation/verify-otp', {
        phone: phone.trim(),
        otp: otp.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      setOtpVerified(true);
      toast({ title: 'Phone verified', description: 'You can now submit your enquiry.' });
    },
    onError: (e: any) =>
      toast({ title: 'Verification failed', description: e.message || 'Try again.', variant: 'destructive' }),
  });

  const submitEnquiry = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/foundation/enquiry', {
        name: name.trim(),
        businessName: businessName.trim(),
        location: location.trim() || undefined,
        scale: scale || undefined,
        phone: phone.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: 'Enquiry submitted',
        description: "We'll reach out to you shortly.",
      });
    },
    onError: (e: any) =>
      toast({ title: 'Submission failed', description: e.message || 'Try again.', variant: 'destructive' }),
  });

  const onSendOtp = () => {
    if (!name.trim()) return toast({ title: 'Name required', variant: 'destructive' });
    if (!businessName.trim()) return toast({ title: 'Business Name required', variant: 'destructive' });
    if (phone.replace(/\D/g, '').length < 10)
      return toast({ title: 'Enter a valid phone', variant: 'destructive' });
    sendOtp.mutate();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) return toast({ title: 'Please verify your phone first', variant: 'destructive' });
    submitEnquiry.mutate();
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-cream to-emerald-50 py-16">
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.18), transparent 40%), radial-gradient(circle at 80% 60%, rgba(34,197,94,0.12), transparent 40%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {foundation?.logo ? (
            <img
              src={foundation.logo}
              alt="GetDown Foundation"
              className="h-24 w-24 mx-auto mb-4 rounded-full bg-white shadow-md object-contain p-2"
              data-testid="img-foundation-logo"
            />
          ) : (
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-emerald-500/10 border-2 border-emerald-400/40 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-emerald-500" />
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-navy mb-3" data-testid="text-foundation-title">
            GetDown Foundation
          </h1>
          <p className="text-emerald-700 font-semibold text-sm md:text-base tracking-wide uppercase">
            Helping local businesses grow online
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
        {/* About panel */}
        <section data-testid="section-foundation-about">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy">
                <Building2 className="h-5 w-5" /> About GetDown Foundation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {foundation?.description ? (
                <p className="text-gray-700 whitespace-pre-line leading-relaxed" data-testid="text-foundation-description">
                  {foundation.description}
                </p>
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  GetDown Foundation partners with shopkeepers, traders and small businesses to bring them online — with their own
                  modern website, payment system, customer database and order management.
                  Every business deserves a digital presence; we help you set one up affordably and quickly.
                </p>
              )}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                  <p className="text-emerald-700 font-bold text-lg">100+</p>
                  <p className="text-xs text-gray-600">Businesses helped</p>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                  <p className="text-emerald-700 font-bold text-lg">Pan India</p>
                  <p className="text-xs text-gray-600">Service area</p>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                  <p className="text-emerald-700 font-bold text-lg">10+ yrs</p>
                  <p className="text-xs text-gray-600">Combined experience</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enquiry form */}
        <section data-testid="section-foundation-form">
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy">
                <MessageCircle className="h-5 w-5 text-emerald-600" /> Take your business online
              </CardTitle>
              <p className="text-sm text-gray-500">
                Fill the form and verify your number on WhatsApp. We will get in touch with you.
              </p>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-10" data-testid="state-submitted">
                  <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-navy mb-2">Thank you, {name || 'Friend'}!</h3>
                  <p className="text-gray-600">
                    We have received your enquiry. Our team will contact you on WhatsApp at <strong>{phone}</strong> shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <Label>Your Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label>Business Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Sharma General Store"
                      required
                      data-testid="input-business-name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City / Town"
                        data-testid="input-location"
                      />
                    </div>
                    <div>
                      <Label>Annual Scale</Label>
                      <Select value={scale} onValueChange={setScale}>
                        <SelectTrigger data-testid="select-scale">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCALE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>WhatsApp Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtp('');
                      }}
                      placeholder="10-digit mobile number"
                      type="tel"
                      required
                      data-testid="input-phone"
                    />
                  </div>

                  {!otpVerified && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-emerald-700">
                        <SiWhatsapp className="h-4 w-4" />
                        <span>Verify your number on WhatsApp before submitting</span>
                      </div>

                      {!otpSent ? (
                        <Button
                          type="button"
                          onClick={onSendOtp}
                          disabled={sendOtp.isPending}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          data-testid="button-send-otp"
                        >
                          {sendOtp.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <SiWhatsapp className="h-4 w-4 mr-2" />
                          )}
                          Send OTP on WhatsApp
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                              data-testid="input-otp"
                            />
                            <Button
                              type="button"
                              onClick={() => verifyOtp.mutate()}
                              disabled={verifyOtp.isPending || otp.length < 4}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              data-testid="button-verify-otp"
                            >
                              {verifyOtp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                            </Button>
                          </div>
                          <button
                            type="button"
                            onClick={onSendOtp}
                            disabled={sendOtp.isPending}
                            className="text-xs text-emerald-700 hover:underline"
                            data-testid="button-resend-otp"
                          >
                            Didn't get the code? Resend
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {otpVerified && (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 flex items-center gap-2 text-emerald-700 text-sm" data-testid="state-verified">
                      <ShieldCheck className="h-5 w-5" />
                      <span>Phone verified — you can now submit your enquiry.</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!otpVerified || submitEnquiry.isPending}
                    className="w-full bg-navy hover:bg-navy/90 text-cream"
                    data-testid="button-submit-enquiry"
                  >
                    {submitEnquiry.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Submit Enquiry
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
