# Design Guidelines: Pathak Bhandar Premium Bakery E-commerce

## Design Approach

**Reference-Based**: Drawing inspiration from premium food e-commerce (Goldbelly, Milk Bar) combined with Shopify's product browsing patterns and Airbnb's card-based layouts. Focus on appetizing visual presentation while maintaining e-commerce functionality and trustworthiness for premium bakery positioning.

## Typography System

**Font Families:**
- Primary: Playfair Display (serif) - for headings, product names, premium feel
- Secondary: Inter (sans-serif) - body text, UI elements, clean readability
- Accent: DM Sans (sans-serif) - buttons, labels, metadata

**Hierarchy:**
- Hero Headlines: text-5xl md:text-7xl, font-bold
- Section Headers: text-3xl md:text-4xl, font-semibold
- Product Titles: text-xl md:text-2xl, font-medium
- Body Text: text-base, font-normal
- Small Print/Labels: text-sm, font-medium
- Button Text: text-base, font-semibold, uppercase tracking

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, and 16 consistently
- Component padding: p-6 to p-8
- Section spacing: py-16 md:py-24
- Card gaps: gap-6 md:gap-8
- Container: max-w-7xl mx-auto px-4 md:px-6

**Grid Strategy:**
- Product grids: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Category showcases: grid-cols-1 md:grid-cols-2
- Feature sections: grid-cols-1 md:grid-cols-3

## Core Components

### Navigation
**Header:** Sticky top navigation with logo left, category links center, cart/account icons right. Include search bar with rounded-full input. Add trust badge ("Trusted since [year]" or delivery info) subtly in top bar.

### Hero Section
Full-width hero with high-quality bakery hero image (warm, inviting bakery interior or beautifully arranged products). Overlay with subtle dark gradient (bottom-to-top). Hero content positioned left-aligned with max-w-2xl container:
- Large headline emphasizing premium quality
- Descriptive tagline
- Dual CTA buttons (primary: "Shop Now", secondary: "View Menu") with backdrop-blur-md bg-white/20 treatment for buttons over image

### Product Display System
**Product Cards:** Rounded-2xl with shadow-lg, hover:shadow-xl transition. Structure:
- Image: aspect-square, rounded-t-2xl, object-cover
- Content padding: p-6
- Product name (Playfair Display)
- Short description: text-sm, line-clamp-2
- Price: text-2xl, font-bold
- Add to Cart button: rounded-full, w-full
- Trust indicators: small badges (Fresh Today, Bestseller) positioned top-right on image

**Category Sections:** Large cards with background images, overlay gradient, category name overlaid. Use 2-column grid on desktop, stack on mobile.

### WhatsApp OTP Verification System

**Checkout Flow Integration:**
Create multi-step visual progress indicator at checkout top (Steps: Cart → Details → Verification → Payment)

**Phone Input Component:**
- Label: "WhatsApp Number for Order Updates"
- Input: rounded-lg, p-4, with country code selector dropdown
- Helper text: "We'll send OTP and delivery updates"
- Send OTP button: rounded-lg, adjacent to input

**OTP Verification Modal:**
Full-screen overlay with backdrop-blur-sm. Center card (max-w-md):
- WhatsApp icon (green, large) centered at top
- Heading: "Verify Your Number"
- Subtext showing masked number
- 6-digit OTP input: Individual boxes (w-12 h-12, rounded-lg, text-center, text-2xl)
- Resend timer countdown
- Verify button: w-full, rounded-full
- Edit number link below

**Verification Badges:**
Post-verification, show verified badge with checkmark icon next to phone number throughout checkout. Green accent, rounded-full pill badge with "WhatsApp Verified" text.

**Trust Elements:**
- Add security icons (shield, lock) near OTP input
- "Secure Verification" label above OTP boxes
- "Your number is safe with us" microcopy

### Additional E-commerce Components

**Cart Drawer:** Slide-in from right, full-height, with:
- Item list with thumbnails
- Quantity adjusters (rounded-full buttons)
- Subtotal breakdown
- Checkout button (sticky bottom)

**Footer:** Multi-column layout:
- About/Story column
- Quick Links (Shop, Categories)
- Contact info with WhatsApp business number
- Social media icons
- Newsletter signup (rounded-full input + button)
- Payment method icons row
- Trust badges (Secure Checkout, Fresh Guarantee)

### Features Section
3-column grid showcasing: "Fresh Daily", "Premium Ingredients", "Custom Orders". Each with icon, headline, and description. Icons use line-style for sophistication.

### Testimonials
Masonry-style grid of customer review cards with:
- Customer photo (rounded-full, small)
- 5-star rating display
- Quote text
- Customer name and location
- Verified purchase badge

## Images Strategy

**Hero Image:** Full-width, professional bakery photograph - either interior shot with warm lighting and displayed products, or artfully arranged signature items. Image should be high-resolution, appetizing, conveying premium quality.

**Product Images:** Professional product photography on clean white/light backgrounds. Consistent lighting and styling. Square aspect ratio. Show products from flattering angles.

**Category Headers:** Lifestyle images showing product categories in context (cakes on celebration table, breads in rustic basket, etc.).

**About Section:** Bakery interior, baker at work, or ingredient close-ups for authenticity.

## Interaction Patterns

- Smooth transitions: transition-all duration-300
- Card hover: scale-105 transform
- Button loading states during OTP send/verify
- Success animations after verification (checkmark bounce)
- Cart count badge animation when items added
- Minimal scroll animations (fade-in-up for sections)

## Trust & Premium Elements

- Include certifications/awards if available
- "Freshness Guarantee" messaging
- Delivery time estimates prominently
- Secure payment icons in footer
- Customer service WhatsApp quick link (floating button bottom-right, rounded-full with WhatsApp icon)