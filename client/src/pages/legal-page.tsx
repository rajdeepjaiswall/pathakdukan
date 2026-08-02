import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import MobileNav from '@/components/layout/mobile-nav';
import type { LegalPage } from '@shared/schema';

type LegalPageType = 'privacy' | 'terms' | 'shipping' | 'invoice';

interface LegalPageResponse {
  pageType: LegalPageType;
  sections: LegalPage[];
  lastUpdated: string | null;
}

interface Props {
  pageType: LegalPageType;
  pageTitle: string;
}

const formatLastUpdated = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const renderParagraphs = (text: string) => {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} className="text-gray-700 leading-relaxed whitespace-pre-line">
        {p}
      </p>
    ));
};

export default function LegalPageView({ pageType, pageTitle }: Props) {
  const { data, isLoading } = useQuery<LegalPageResponse>({
    queryKey: [`/api/legal-pages/${pageType}`],
  });

  const sections = (data?.sections || []).filter((s) => s.isActive);
  const lastUpdated = formatLastUpdated(data?.lastUpdated || null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
            data-testid="link-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
            {pageTitle}
          </h1>
          {lastUpdated && (
            <p className="text-gray-600" data-testid="text-last-updated">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          {isLoading ? (
            <div className="space-y-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : sections.length === 0 ? (
            <p className="text-gray-500 text-center py-8" data-testid="text-empty-state">
              This page is being updated. Please check back soon.
            </p>
          ) : (
            sections.map((section) => {
              const items = (section.listItems || []).filter(Boolean);
              const heading =
                section.level === 3 ? (
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{section.title}</h3>
                ) : (
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                );

              const body = (
                <>
                  {heading}
                  {section.content && (
                    <div className="space-y-3 mb-3">{renderParagraphs(section.content)}</div>
                  )}
                  {items.length > 0 && (
                    <ul
                      className={`list-disc list-inside text-gray-700 space-y-2 ${
                        section.level === 3 ? 'ml-4' : ''
                      }`}
                    >
                      {items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </>
              );

              if (section.highlight) {
                return (
                  <section key={section.id} data-testid={`section-${section.id}`}>
                    <div className="bg-orange-50 p-4 rounded-lg">{body}</div>
                  </section>
                );
              }

              if (section.level === 3) {
                return (
                  <div key={section.id} className="space-y-2" data-testid={`section-${section.id}`}>
                    {body}
                  </div>
                );
              }

              return (
                <section key={section.id} data-testid={`section-${section.id}`}>
                  {body}
                </section>
              );
            })
          )}
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Managed and created by <strong>Getdown Foundations</strong></p>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
