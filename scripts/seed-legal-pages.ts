import { db } from '../server/db';
import { legalPages } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

type Seed = {
  pageType: 'privacy' | 'terms';
  level: 2 | 3;
  title: string;
  content?: string;
  listItems?: string[];
  highlight?: boolean;
};

const PRIVACY: Seed[] = [
  {
    pageType: 'privacy',
    level: 2,
    title: 'Introduction',
    content:
      'Pathak Bhandar ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.',
  },
  { pageType: 'privacy', level: 2, title: 'Information We Collect' },
  {
    pageType: 'privacy',
    level: 3,
    title: 'Personal Information',
    listItems: [
      'Name and contact information (email, phone number, address)',
      'Account credentials and authentication data',
      'Order history and purchase preferences',
      'Payment information (processed securely through third-party providers)',
    ],
  },
  {
    pageType: 'privacy',
    level: 3,
    title: 'Automatically Collected Information',
    listItems: [
      'Device information and browser type',
      'IP address and location data',
      'Website usage patterns and preferences',
      'Cookies and similar tracking technologies',
    ],
  },
  {
    pageType: 'privacy',
    level: 2,
    title: 'How We Use Your Information',
    listItems: [
      'Process and fulfill your orders',
      'Communicate with you about your purchases and account',
      'Provide customer support and respond to inquiries',
      'Improve our website and services',
      'Send promotional materials (with your consent)',
      'Comply with legal obligations and prevent fraud',
    ],
  },
  {
    pageType: 'privacy',
    level: 2,
    title: 'Information Sharing and Disclosure',
    content:
      'We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:',
    listItems: [
      'With service providers who assist in our operations',
      'When required by law or to protect our rights',
      'In connection with a business transfer or merger',
      'With your explicit consent',
    ],
  },
  {
    pageType: 'privacy',
    level: 2,
    title: 'Data Security',
    content:
      'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.',
  },
  {
    pageType: 'privacy',
    level: 2,
    title: 'Your Rights',
    content: 'You have the right to:',
    listItems: [
      'Access and review your personal information',
      'Request corrections to inaccurate data',
      'Request deletion of your personal information',
      'Opt-out of marketing communications',
      'Data portability where technically feasible',
    ],
  },
  {
    pageType: 'privacy',
    level: 2,
    title: 'Cookies and Tracking',
    content:
      'We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can control cookie settings through your browser preferences.',
  },
  {
    pageType: 'privacy',
    level: 2,
    title: 'Third-Party Services',
    content:
      'Our website may contain links to third-party websites or integrate with third-party services (such as Google OAuth for authentication). We are not responsible for the privacy practices of these external services.',
  },
  {
    pageType: 'privacy',
    level: 2,
    title: 'Updates to This Policy',
    content:
      'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date.',
  },
  {
    pageType: 'privacy',
    level: 2,
    title: 'Contact Information',
    highlight: true,
    content:
      'If you have any questions about this Privacy Policy or our data practices, please contact us:\n\nSupport Email: contact@getdownaf.info\nGeneral Contact: getdownaf@gmail.com',
  },
];

const TERMS: Seed[] = [
  {
    pageType: 'terms',
    level: 2,
    title: '1. Agreement to Terms',
    content:
      "By accessing and using Pathak Bhandar's website and services, you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service constitute a legally binding agreement between you and Pathak Bhandar.",
  },
  {
    pageType: 'terms',
    level: 2,
    title: '2. Use License',
    content:
      'Permission is granted to temporarily access and use our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:\n\nThis license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.',
    listItems: [
      'Modify or copy the materials',
      'Use the materials for commercial purposes or public display',
      'Attempt to reverse engineer any software contained on our website',
      'Remove any copyright or proprietary notations from the materials',
    ],
  },
  { pageType: 'terms', level: 2, title: '3. User Accounts' },
  {
    pageType: 'terms',
    level: 3,
    title: 'Account Registration',
    listItems: [
      'You must provide accurate and complete information when creating an account',
      'You are responsible for maintaining the security of your account credentials',
      'You must notify us immediately of any unauthorized use of your account',
      'One person may not maintain multiple accounts',
    ],
  },
  {
    pageType: 'terms',
    level: 3,
    title: 'Account Termination',
    content:
      'We reserve the right to terminate accounts that violate these terms, engage in fraudulent activities, or pose a security risk to our platform or other users.',
  },
  { pageType: 'terms', level: 2, title: '4. Products and Services' },
  {
    pageType: 'terms',
    level: 3,
    title: 'Product Information',
    listItems: [
      'We strive to provide accurate product descriptions, images, and pricing',
      'Colors and appearance may vary slightly from images displayed',
      'We reserve the right to modify product offerings and prices without notice',
      'All products are subject to availability',
    ],
  },
  {
    pageType: 'terms',
    level: 3,
    title: 'Food Safety and Quality',
    listItems: [
      'All products are prepared following food safety standards',
      'Freshness and quality are guaranteed at the time of preparation',
      'Customers with allergies should inform us before placing orders',
      'We are not responsible for products once they leave our premises',
    ],
  },
  { pageType: 'terms', level: 2, title: '5. Orders and Payment' },
  {
    pageType: 'terms',
    level: 3,
    title: 'Order Process',
    listItems: [
      'All orders are subject to acceptance and availability',
      'We reserve the right to refuse or cancel orders for any reason',
      'Order confirmations will be sent via email',
      'Custom orders may require additional time and deposit',
    ],
  },
  {
    pageType: 'terms',
    level: 3,
    title: 'Payment Terms',
    listItems: [
      'Payment is required at the time of order placement',
      'We accept various payment methods as displayed on our website',
      'All prices include applicable taxes unless otherwise stated',
      'Payment processing is handled by secure third-party providers',
    ],
  },
  { pageType: 'terms', level: 2, title: '6. Delivery and Pickup' },
  {
    pageType: 'terms',
    level: 3,
    title: 'Delivery Services',
    listItems: [
      'Delivery times are estimates and may vary due to traffic or weather',
      'Delivery charges apply as per our current rate schedule',
      'Customers must be available to receive orders at the specified time',
      'Delivery areas are limited to our service zones',
    ],
  },
  {
    pageType: 'terms',
    level: 3,
    title: 'Pickup Orders',
    listItems: [
      'Orders must be collected within the specified timeframe',
      'Valid ID and order confirmation may be required for pickup',
      'Uncollected orders may be subject to disposal after 24 hours',
    ],
  },
  { pageType: 'terms', level: 2, title: '7. Returns and Refunds' },
  {
    pageType: 'terms',
    level: 3,
    title: 'Return Policy',
    content:
      'Due to the perishable nature of our products, returns are generally not accepted. However, we will address quality concerns on a case-by-case basis.',
  },
  {
    pageType: 'terms',
    level: 3,
    title: 'Refund Conditions',
    listItems: [
      'Refunds may be provided for cancelled orders before preparation begins',
      'Quality issues must be reported within 2 hours of delivery/pickup',
      'Photographic evidence may be required for quality claims',
      'Refunds will be processed using the original payment method',
    ],
  },
  {
    pageType: 'terms',
    level: 2,
    title: '8. User Conduct',
    content: 'You agree not to:',
    listItems: [
      'Use our service for any unlawful purpose or to solicit unlawful acts',
      'Violate any international, federal, provincial, or local laws or regulations',
      'Transmit or procure sending of advertising or promotional material without consent',
      'Impersonate or attempt to impersonate the company, employees, or other users',
      'Use our service in any manner that could damage or overburden our servers',
    ],
  },
  {
    pageType: 'terms',
    level: 2,
    title: '9. Privacy and Data Protection',
    content:
      'Your privacy is important to us. Please review our Privacy Policy, which governs your visit to our website and explains how we collect, safeguard, and disclose information that results from your use of our service.',
  },
  {
    pageType: 'terms',
    level: 2,
    title: '10. Disclaimer',
    content:
      "The materials on Pathak Bhandar's website are provided on an 'as is' basis. Pathak Bhandar makes no warranties, expressed or implied, and hereby disclaims all other warranties including, without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.",
  },
  {
    pageType: 'terms',
    level: 2,
    title: '11. Limitations of Liability',
    content:
      'In no event shall Pathak Bhandar or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use our materials, even if we or our authorized representative has been notified of the possibility of such damage.',
  },
  {
    pageType: 'terms',
    level: 2,
    title: '12. Governing Law',
    content:
      'These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Prayagraj, Uttar Pradesh.',
  },
  {
    pageType: 'terms',
    level: 2,
    title: '13. Changes to Terms',
    content:
      'We reserve the right to revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the current version of these terms of service.',
  },
  {
    pageType: 'terms',
    level: 2,
    title: '14. Contact Information',
    highlight: true,
    content:
      'If you have any questions about these Terms of Service, please contact us:\n\nSupport Email: contact@getdownaf.info\nGeneral Contact: getdownaf@gmail.com',
  },
];

async function seedPage(pageType: 'privacy' | 'terms', items: Seed[]) {
  const existing = await db.select().from(legalPages).where(eq(legalPages.pageType, pageType));
  if (existing.length > 0) {
    console.log(`[skip] ${pageType}: already has ${existing.length} sections`);
    return;
  }
  let order = 10;
  for (const it of items) {
    await db.insert(legalPages).values({
      pageType: it.pageType,
      level: it.level,
      title: it.title,
      content: it.content || null,
      listItems: it.listItems || [],
      highlight: !!it.highlight,
      isActive: true,
      displayOrder: order,
    });
    order += 10;
  }
  console.log(`[ok] ${pageType}: inserted ${items.length} sections`);
}

async function run() {
  await seedPage('privacy', PRIVACY);
  await seedPage('terms', TERMS);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
