import { useQuery } from '@tanstack/react-query';
import { Phone, Mail, MapPin, Download, Store } from 'lucide-react';
import { SiWhatsapp, SiFacebook, SiInstagram } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { ContactData } from '@shared/schema';

function digitsOnly(s?: string) {
  return (s || '').replace(/\D/g, '');
}

function buildVcf(data: ContactData) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (data.storeName) lines.push(`FN:${data.storeName}`);
  if (data.storeName) lines.push(`ORG:${data.storeName}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL,VOICE:${data.phone}`);
  if (data.socialLinks?.whatsapp) lines.push(`TEL;TYPE=CELL,WHATSAPP:${data.socialLinks.whatsapp}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  if (data.address) lines.push(`ADR;TYPE=WORK:;;${data.address.replace(/\n/g, ', ')};;;;`);
  lines.push(`URL:${typeof window !== 'undefined' ? window.location.origin : ''}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export default function ContactUs() {
  const { data, isLoading } = useQuery<ContactData>({
    queryKey: ['/api/contact-info'],
  });

  const c = data || {};
  const hasAnyContact = c.phone || c.email || c.address;
  const hasAnySocial =
    c.socialLinks?.whatsapp || c.socialLinks?.facebook || c.socialLinks?.instagram || c.socialLinks?.email;

  const handleSaveContact = () => {
    const vcf = buildVcf(c);
    const blob = new Blob([vcf], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(c.storeName || 'contact').replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="animate-pulse flex flex-col items-center gap-6">
            <div className="h-32 w-32 rounded-full bg-gray-200" />
            <div className="h-8 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        {/* Profile + Store Name */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative">
            {c.profileImage ? (
              <img
                src={c.profileImage}
                alt={c.storeName || 'Profile'}
                className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover border-4 border-champagne shadow-lg"
                data-testid="img-profile"
              />
            ) : (
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-champagne/20 border-4 border-champagne shadow-lg flex items-center justify-center">
                <Store className="h-16 w-16 text-champagne" />
              </div>
            )}
          </div>

          {c.storeName && (
            <h1
              className="text-3xl md:text-4xl font-bold text-navy mt-5"
              data-testid="text-store-name"
            >
              {c.storeName}
            </h1>
          )}
          {!c.storeName && !hasAnyContact && !hasAnySocial && (
            <h1 className="text-3xl md:text-4xl font-bold text-navy mt-5">Contact Us</h1>
          )}

          {/* Social row */}
          {hasAnySocial && (
            <div className="flex items-center justify-center gap-3 mt-6" data-testid="row-social">
              {c.socialLinks?.whatsapp && (
                <a
                  href={`https://wa.me/${digitsOnly(c.socialLinks.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  data-testid="link-social-whatsapp"
                  className="h-11 w-11 rounded-full bg-cream border border-champagne text-champagne hover:bg-champagne hover:text-navy transition-all duration-200 active:scale-95 flex items-center justify-center shadow-sm"
                >
                  <SiWhatsapp className="h-5 w-5" />
                </a>
              )}
              {c.socialLinks?.facebook && (
                <a
                  href={c.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  data-testid="link-social-facebook"
                  className="h-11 w-11 rounded-full bg-cream border border-champagne text-champagne hover:bg-champagne hover:text-navy transition-all duration-200 active:scale-95 flex items-center justify-center shadow-sm"
                >
                  <SiFacebook className="h-5 w-5" />
                </a>
              )}
              {c.socialLinks?.instagram && (
                <a
                  href={c.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  data-testid="link-social-instagram"
                  className="h-11 w-11 rounded-full bg-cream border border-champagne text-champagne hover:bg-champagne hover:text-navy transition-all duration-200 active:scale-95 flex items-center justify-center shadow-sm"
                >
                  <SiInstagram className="h-5 w-5" />
                </a>
              )}
              {c.socialLinks?.email && (
                <a
                  href={`mailto:${c.socialLinks.email}`}
                  aria-label="Email"
                  data-testid="link-social-email"
                  className="h-11 w-11 rounded-full bg-cream border border-champagne text-champagne hover:bg-champagne hover:text-navy transition-all duration-200 active:scale-95 flex items-center justify-center shadow-sm"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Contact details card */}
        {hasAnyContact && (
          <Card className="rounded-2xl shadow-md border-champagne/20">
            <CardContent className="p-6 md:p-8 space-y-5">
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="flex items-center gap-4 group"
                  data-testid="link-phone"
                >
                  <div className="h-11 w-11 rounded-full bg-champagne/15 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-champagne" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div>
                    <div className="text-navy font-medium group-hover:text-champagne transition-colors">
                      {c.phone}
                    </div>
                  </div>
                </a>
              )}
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="flex items-center gap-4 group"
                  data-testid="link-email"
                >
                  <div className="h-11 w-11 rounded-full bg-champagne/15 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-champagne" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
                    <div className="text-navy font-medium group-hover:text-champagne transition-colors break-all">
                      {c.email}
                    </div>
                  </div>
                </a>
              )}
              {c.address && (
                <div className="flex items-start gap-4" data-testid="row-address">
                  <div className="h-11 w-11 rounded-full bg-champagne/15 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-champagne" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Address</div>
                    <div className="text-navy whitespace-pre-wrap">{c.address}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Contact Button */}
        {(c.storeName || c.phone || c.email) && (
          <div className="text-center mt-8">
            <Button
              size="lg"
              onClick={handleSaveContact}
              className="bg-champagne hover:bg-champagne/90 text-navy gap-2 rounded-full px-8 shadow-md"
              data-testid="button-save-contact"
            >
              <Download className="h-5 w-5" />
              Save Contact
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Downloads a contact card you can add to your phonebook.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!c.storeName && !hasAnyContact && !hasAnySocial && (
          <div className="text-center text-gray-500 mt-8">
            Contact details have not been published yet.
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
