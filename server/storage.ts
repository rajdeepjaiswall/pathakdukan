import { 
  users, categories, products, addresses, orders, orderItems, cartItems, wishlistItems, coupons, reviews, testimonials, banners, otps,
  manualPaymentConfig, manualPaymentDetails, paymentGatewayConfig, pageContent, popupBanners, phonePeTransactions,
  type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct,
  type Address, type InsertAddress, type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem, type WishlistItem, type InsertWishlistItem, type Coupon, type InsertCoupon, type Review, type InsertReview,
  type Banner, type InsertBanner, type Otp, type InsertOtp,
  type ManualPaymentConfig, type InsertManualPaymentConfig, type ManualPaymentDetails, type InsertManualPaymentDetails,
  type PaymentGatewayConfig, type InsertPaymentGatewayConfig,
  type PageContent, type InsertPageContent, type PopupBanner, type InsertPopupBanner,
  contactSettings, type ContactSettings, type ContactData,
  chargesSettings, type ChargesSettings, type ChargesConfig,
  siteSettings, type SiteSettings, type HeaderConfig, type FooterConfig,
  foundationSettings, type FoundationSettings, type FoundationContent, type WhatsappApiConfig,
  foundationEnquiries, type FoundationEnquiry, type InsertFoundationEnquiry,
  aboutSections, type AboutSection, type InsertAboutSection,
  legalPages, type LegalPage, type InsertLegalPage,
  adminPermissions, type AdminPermissionsMap, defaultPermissionsAllOn,
  type PhonePeTransaction, type InsertPhonePeTransaction
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, like, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGoogleUser(user: any): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  updateUserGoogleId(id: number, googleId: string): Promise<User>;
  getCustomers(): Promise<User[]>;

  // Address methods
  clearDefaultAddresses(userId: number): Promise<void>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Product methods
  getProducts(filters?: { categoryId?: number; featured?: boolean; search?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: number, stock: number): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getTrendingProducts(limit?: number): Promise<Product[]>;
  getProductOfDay(): Promise<Product | undefined>;
  getChefSpecialProducts(limit?: number): Promise<Product[]>;
  getTrendingLocalProducts(limit?: number): Promise<Product[]>;
  getNewArrivals(limit?: number): Promise<Product[]>;

  // Cart methods
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem>;
  removeFromCart(id: number, userId: number): Promise<void>;
  clearCart(userId: number): Promise<void>;

  // Wishlist methods
  getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(productId: number, userId: number): Promise<void>;
  isInWishlist(userId: number, productId: number): Promise<boolean>;

  // Address methods
  getAddresses(userId: number): Promise<Address[]>;
  getAddress(id: number): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: number, address: Partial<InsertAddress>): Promise<Address>;
  deleteAddress(id: number): Promise<void>;

  // Order methods
  getOrders(userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: number, userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  updateOrderRider(id: number, riderName: string, riderPhone: string): Promise<Order>;
  getAllOrders(status?: string): Promise<Order[]>;

  // Review methods
  getProductReviews(productId: number): Promise<(Review & { user: Pick<User, 'username'> })[]>;
  createReview(review: InsertReview): Promise<Review>;
  getUserOrderReviews(userId: number): Promise<{ orderId: number; productId: number; rating: number; status: string }[]>;

  // Analytics methods
  getAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    ordersReceivedToday: number;
    ordersDeliveredToday: number;
    ordersCancelledToday: number;
    recentOrders: Order[];
    topProducts: (Product & { orderCount: number })[];
  }>;

  // Banner methods
  getBanners(activeOnly?: boolean): Promise<Banner[]>;
  getBanner(id: number): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner>;
  deleteBanner(id: number): Promise<void>;

  // OTP methods
  createOtp(otp: InsertOtp): Promise<Otp>;
  getOtp(identifier: string, type: string): Promise<Otp | undefined>;
  verifyOtp(identifier: string, otpCode: string, type: string): Promise<boolean>;
  deleteOtp(identifier: string, type: string): Promise<void>;
  incrementOtpAttempts(identifier: string, type: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;

  // Manual Payment Config methods
  getManualPaymentConfig(): Promise<ManualPaymentConfig | undefined>;
  upsertManualPaymentConfig(config: InsertManualPaymentConfig): Promise<ManualPaymentConfig>;

  // Manual Payment Details methods
  createManualPaymentDetails(details: InsertManualPaymentDetails): Promise<ManualPaymentDetails>;
  getManualPaymentDetailsByOrderId(orderId: number): Promise<ManualPaymentDetails | undefined>;
  updateManualPaymentDetails(id: number, updates: Partial<ManualPaymentDetails>): Promise<ManualPaymentDetails>;
  submitUTR(orderId: number, utrReference: string): Promise<ManualPaymentDetails>;
  verifyPayment(detailsId: number, adminId: number, status: 'success' | 'failed', rejectionReason?: string): Promise<ManualPaymentDetails>;
  getPendingPayments(): Promise<(ManualPaymentDetails & { order: Order; user: User })[]>;

  // Payment Gateway Config methods
  getPaymentGatewayConfigs(): Promise<PaymentGatewayConfig[]>;
  getPaymentGatewayConfig(provider: string): Promise<PaymentGatewayConfig | undefined>;
  getActivePaymentGateway(): Promise<PaymentGatewayConfig | undefined>;
  upsertPaymentGatewayConfig(config: InsertPaymentGatewayConfig): Promise<PaymentGatewayConfig>;

  // Page Content methods
  getPageContent(pageType: string): Promise<PageContent | undefined>;
  upsertPageContent(content: InsertPageContent): Promise<PageContent>;

  // Contact Settings (single-row, draft + published)
  getContactSettings(): Promise<ContactSettings | undefined>;
  saveContactDraft(data: ContactData): Promise<ContactSettings>;
  publishContactSettings(): Promise<ContactSettings>;

  getChargesConfig(): Promise<ChargesConfig>;
  saveChargesConfig(config: ChargesConfig): Promise<ChargesConfig>;

  // Site Settings (Header + Footer, draft + published)
  getSiteSettings(): Promise<SiteSettings | undefined>;
  saveHeaderDraft(data: HeaderConfig): Promise<SiteSettings>;
  saveFooterDraft(data: FooterConfig): Promise<SiteSettings>;
  publishHeader(): Promise<SiteSettings>;
  publishFooter(): Promise<SiteSettings>;
  getOnlinePaymentStatus(): Promise<boolean>;
  setOnlinePaymentStatus(enabled: boolean): Promise<boolean>;
  getMaintenanceModeStatus(): Promise<boolean>;
  setMaintenanceModeStatus(enabled: boolean): Promise<boolean>;

  // Foundation Settings (super-admin only)
  getFoundationSettings(): Promise<FoundationSettings | undefined>;
  saveFoundationDraft(data: FoundationContent): Promise<FoundationSettings>;
  publishFoundation(): Promise<FoundationSettings>;
  saveWhatsappApiConfig(data: WhatsappApiConfig): Promise<FoundationSettings>;

  // Foundation Enquiries
  createFoundationEnquiry(data: InsertFoundationEnquiry): Promise<FoundationEnquiry>;
  listFoundationEnquiries(search?: string): Promise<FoundationEnquiry[]>;

  // Shop Settings
  getShopSettings(): Promise<any>;
  updateShopSettings(data: { isOpen?: boolean; manualOverride?: boolean; schedule?: any[] }): Promise<any>;

  // Popup Banner methods
  getPopupBanners(activeOnly?: boolean): Promise<PopupBanner[]>;
  getPopupBanner(id: number): Promise<PopupBanner | undefined>;
  createPopupBanner(banner: InsertPopupBanner): Promise<PopupBanner>;
  updatePopupBanner(id: number, banner: Partial<InsertPopupBanner>): Promise<PopupBanner>;
  deletePopupBanner(id: number): Promise<void>;

  getAboutSections(activeOnly?: boolean): Promise<AboutSection[]>;
  getAboutSection(id: number): Promise<AboutSection | undefined>;
  createAboutSection(section: InsertAboutSection): Promise<AboutSection>;
  updateAboutSection(id: number, section: Partial<InsertAboutSection>): Promise<AboutSection>;
  deleteAboutSection(id: number): Promise<void>;

  // Legal Pages methods (privacy + terms)
  getLegalPageSections(pageType: string, activeOnly?: boolean): Promise<LegalPage[]>;
  getLegalPageSection(id: number): Promise<LegalPage | undefined>;
  createLegalPageSection(section: InsertLegalPage): Promise<LegalPage>;
  updateLegalPageSection(id: number, section: Partial<InsertLegalPage>): Promise<LegalPage>;
  deleteLegalPageSection(id: number): Promise<void>;

  // Admin management methods
  getAdminUsers(): Promise<User[]>;
  getAdminUserById(id: number): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User>;
  setUserActive(id: number, isActive: boolean): Promise<User>;
  generateUniqueAdminId(): Promise<string>;

  // Account soft-delete methods (30-day recovery window)
  softDeleteUser(id: number, reason: string | null, recoveryDays?: number): Promise<User>;
  recoverUser(id: number): Promise<User>;
  getDeletedUsers(): Promise<User[]>;
  purgeExpiredDeletedUsers(): Promise<number>;
  getAdminPermissions(adminUserId: number): Promise<AdminPermissionsMap>;
  upsertAdminPermissions(adminUserId: number, permissions: AdminPermissionsMap): Promise<AdminPermissionsMap>;
  deleteAdminUser(id: number): Promise<void>;

  // Reports methods
  getOrdersReport(startDate: Date, endDate: Date): Promise<Order[]>;
  getCustomersReport(startDate: Date, endDate: Date): Promise<User[]>;
  getPaymentsReport(startDate: Date, endDate: Date): Promise<ManualPaymentDetails[]>;

  // PhonePe Transaction methods
  createPhonePeTransaction(transaction: InsertPhonePeTransaction): Promise<PhonePeTransaction>;
  getPhonePeTransactionByMerchantId(merchantTransactionId: string): Promise<PhonePeTransaction | undefined>;
  getPhonePeTransactionByOrderId(orderId: number): Promise<PhonePeTransaction | undefined>;
  updatePhonePeTransaction(id: number, updates: Partial<PhonePeTransaction>): Promise<PhonePeTransaction>;
  updatePhonePeTransactionByMerchantId(merchantTransactionId: string, updates: Partial<PhonePeTransaction>): Promise<PhonePeTransaction>;

  // Verified customers methods (for admin tracking)
  getVerifiedCustomers(): Promise<{
    id: number;
    customerName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    pincode: string;
    verifiedAt: Date | null;
    addressId: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUserGoogleId(userId: number, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createGoogleUser(googleUserData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(googleUserData)
      .returning();
    return user;
  }

  async updateUserGoogleId(id: number, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId, authProvider: 'google' })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCustomers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'customer'));
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, updateCategory: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updateCategory)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product methods
  async getProducts(filters?: { categoryId?: number; featured?: boolean; search?: string }): Promise<Product[]> {
    let query = db.select().from(products).where(eq(products.isActive, true));

    if (filters?.categoryId) {
      query = query.where(eq(products.category_id, filters.categoryId));
    }

    if (filters?.featured) {
      query = query.where(eq(products.featured, true));
    }

    if (filters?.search) {
      query = query.where(like(products.name, `%${filters.search}%`));
    }

    return await query.orderBy(desc(products.featured), asc(products.name));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set(updateProduct)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProductStock(id: number, stock: number): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ stock })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getTrendingProducts(limit: number = 8): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.isTrending, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  async getProductOfDay(): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.isProductOfDay, true)))
      .orderBy(desc(products.createdAt))
      .limit(1);
    return product || undefined;
  }

  async getChefSpecialProducts(limit: number = 6): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.isChefSpecial, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  async getTrendingLocalProducts(limit: number = 100): Promise<Product[]> {
    const query = db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.isTrendingLocal, true)))
      .orderBy(desc(products.createdAt));
    if (limit < 100) return await query.limit(limit);
    return await query;
  }

  async getNewArrivals(limit: number = 10): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  // Cart methods
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        user_id: cartItems.user_id,
        product_id: cartItems.product_id,
        quantity: cartItems.quantity,
        selectedWeight: cartItems.selectedWeight,
        variantPrice: cartItems.variantPrice,
        createdAt: cartItems.createdAt,
        product: products
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.product_id, products.id))
      .where(eq(cartItems.user_id, userId));
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if same product + same weight variant already exists in cart
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.user_id, insertCartItem.user_id),
        eq(cartItems.product_id, insertCartItem.product_id)
      ));

    // Match on selectedWeight so different weights become separate cart rows
    const existingItem = existing.find(item => {
      const sameWeight = (item.selectedWeight ?? null) === (insertCartItem.selectedWeight ?? null);
      return sameWeight;
    });

    if (existingItem) {
      // Update quantity for the matching row
      const [cartItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + insertCartItem.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return cartItem;
    }

    const [cartItem] = await db
      .insert(cartItems)
      .values(insertCartItem)
      .returning();
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem> {
    const [cartItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, id), eq(cartItems.user_id, userId)))
      .returning();
    return cartItem;
  }

  async removeFromCart(id: number, userId: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.user_id, userId)));
  }

  async clearCart(userId: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.user_id, userId));
  }

  // Wishlist methods
  async getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    return await db
      .select({
        id: wishlistItems.id,
        user_id: wishlistItems.user_id,
        product_id: wishlistItems.product_id,
        createdAt: wishlistItems.createdAt,
        product: products
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.product_id, products.id))
      .where(eq(wishlistItems.user_id, userId));
  }

  async addToWishlist(insertWishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    // Check if item already exists in wishlist
    const [existingItem] = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.user_id, insertWishlistItem.user_id),
        eq(wishlistItems.product_id, insertWishlistItem.product_id)
      ));

    if (existingItem) {
      throw new Error('Product already in wishlist');
    }

    const [wishlistItem] = await db
      .insert(wishlistItems)
      .values(insertWishlistItem)
      .returning();
    return wishlistItem;
  }

  async removeFromWishlist(productId: number, userId: number): Promise<void> {
    await db
      .delete(wishlistItems)
      .where(and(
        eq(wishlistItems.product_id, productId), 
        eq(wishlistItems.user_id, userId)
      ));
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.user_id, userId),
        eq(wishlistItems.product_id, productId)
      ));
    return !!item;
  }

  // Address methods
  async getAddresses(userId: number): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  }

  async getAddress(id: number): Promise<Address | undefined> {
    const [address] = await db.select().from(addresses).where(eq(addresses.id, id));
    return address || undefined;
  }

  async createAddress(insertAddress: InsertAddress): Promise<Address> {
    // If this is default address, unset other defaults
    if (insertAddress.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, insertAddress.userId));
    }

    const [address] = await db
      .insert(addresses)
      .values(insertAddress)
      .returning();
    return address;
  }

  async updateAddress(id: number, updateAddress: Partial<InsertAddress>): Promise<Address> {
    // If this is default address, unset other defaults
    if (updateAddress.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, updateAddress.userId!));
    }

    const [address] = await db
      .update(addresses)
      .set(updateAddress)
      .where(eq(addresses.id, id))
      .returning();
    return address;
  }

  async deleteAddress(id: number): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }

  async clearDefaultAddresses(userId: number): Promise<void> {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, userId));
  }

  // Order methods
  async getOrders(userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.orderDate));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            order_id: orderItems.order_id,
            product_id: orderItems.product_id,
            quantity: orderItems.quantity,
            price: orderItems.price,
            total: orderItems.total,
            selectedWeight: orderItems.selectedWeight,
            product: products
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.product_id, products.id))
          .where(eq(orderItems.order_id, order.id));

        return { ...order, orderItems: items };
      })
    );

    return ordersWithItems;
  }

  async getOrder(id: number, userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.user_id, userId)));

    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        order_id: orderItems.order_id,
        product_id: orderItems.product_id,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        selectedWeight: orderItems.selectedWeight,
        product: products
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.product_id, products.id))
      .where(eq(orderItems.order_id, id));

    return { ...order, orderItems: items };
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(insertOrderItem)
      .returning();
    return orderItem;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderRider(id: number, riderName: string, riderPhone: string, riderImage?: string): Promise<Order> {
    const updateData: any = { riderName, riderPhone };
    if (riderImage) {
      updateData.riderImage = riderImage;
    }
    
    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderDeliveryTime(id: number, estimatedDelivery: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ estimatedDelivery: new Date(estimatedDelivery) })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(status?: string): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (status) {
      query = query.where(eq(orders.status, status));
    }

    return await query.orderBy(desc(orders.orderDate));
  }

  // Review methods
  async getProductReviews(productId: number): Promise<(Review & { user: Pick<User, 'username'> })[]> {
    return await db
      .select({
        id: reviews.id,
        user_id: reviews.user_id,
        product_id: reviews.product_id,
        rating: reviews.rating,
        comment: reviews.comment,
        isApproved: reviews.isApproved,
        createdAt: reviews.createdAt,
        user: {
          username: users.username
        }
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.user_id, users.id))
      .where(and(eq(reviews.product_id, productId), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async getUserOrderReviews(userId: number): Promise<{ orderId: number; productId: number; rating: number; status: string }[]> {
    const result = await db
      .select({
        orderId: testimonials.orderId,
        productId: testimonials.productId,
        rating: testimonials.rating,
        status: testimonials.status,
      })
      .from(testimonials)
      .where(eq(testimonials.userId, userId));
    return result;
  }

  // Analytics methods
  async getAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    ordersReceivedToday: number;
    ordersDeliveredToday: number;
    ordersCancelledToday: number;
    recentOrders: Order[];
    topProducts: (Product & { orderCount: number })[];
  }> {
    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)::float`
      })
      .from(orders);

    const [customerStats] = await db
      .select({
        totalCustomers: sql<number>`count(*)::int`
      })
      .from(users)
      .where(eq(users.role, 'customer'));

    const [productStats] = await db
      .select({
        totalProducts: sql<number>`count(*)::int`
      })
      .from(products)
      .where(eq(products.isActive, true));

    // Today's order statistics
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [todayStats] = await db
      .select({
        ordersReceivedToday: sql<number>`count(*)::int`
      })
      .from(orders)
      .where(sql`${orders.orderDate} >= ${startOfDay} AND ${orders.orderDate} < ${endOfDay}`);

    const [deliveredTodayStats] = await db
      .select({
        ordersDeliveredToday: sql<number>`count(*)::int`
      })
      .from(orders)
      .where(sql`${orders.orderDate} >= ${startOfDay} AND ${orders.orderDate} < ${endOfDay} AND ${orders.status} = 'delivered'`);

    const [cancelledTodayStats] = await db
      .select({
        ordersCancelledToday: sql<number>`count(*)::int`
      })
      .from(orders)
      .where(sql`${orders.orderDate} >= ${startOfDay} AND ${orders.orderDate} < ${endOfDay} AND ${orders.status} = 'cancelled'`);

    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.orderDate))
      .limit(10);

    const topProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        weight: products.weight,
        category_id: products.category_id,
        images: products.images,
        stock: products.stock,
        isActive: products.isActive,
        hsnCode: products.hsnCode,
        gstRate: products.gstRate,
        tags: products.tags,
        featured: products.featured,
        createdAt: products.createdAt,
        orderCount: sql<number>`count(${orderItems.id})::int`
      })
      .from(products)
      .leftJoin(orderItems, eq(products.id, orderItems.product_id))
      .groupBy(products.id)
      .orderBy(desc(sql`count(${orderItems.id})`))
      .limit(5);

    return {
      totalOrders: orderStats?.totalOrders || 0,
      totalRevenue: orderStats?.totalRevenue || 0,
      totalCustomers: customerStats?.totalCustomers || 0,
      totalProducts: productStats?.totalProducts || 0,
      ordersReceivedToday: todayStats?.ordersReceivedToday || 0,
      ordersDeliveredToday: deliveredTodayStats?.ordersDeliveredToday || 0,
      ordersCancelledToday: cancelledTodayStats?.ordersCancelledToday || 0,
      recentOrders,
      topProducts
    };
  }

  // Banner methods
  async getBanners(activeOnly = false): Promise<Banner[]> {
    let query = db.select().from(banners);
    
    if (activeOnly) {
      query = query.where(eq(banners.isActive, true));
    }
    
    return await query.orderBy(asc(banners.displayOrder), desc(banners.createdAt));
  }

  async getBanner(id: number): Promise<Banner | undefined> {
    const [banner] = await db.select().from(banners).where(eq(banners.id, id));
    return banner || undefined;
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const [banner] = await db
      .insert(banners)
      .values(insertBanner)
      .returning();
    return banner;
  }

  async updateBanner(id: number, updateBanner: Partial<InsertBanner>): Promise<Banner> {
    const [banner] = await db
      .update(banners)
      .set({ ...updateBanner, updatedAt: new Date() })
      .where(eq(banners.id, id))
      .returning();
    return banner;
  }

  async deleteBanner(id: number): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }

  // OTP methods
  async createOtp(insertOtp: InsertOtp): Promise<Otp> {
    // Clean up any existing OTP for this identifier and type
    await this.deleteOtp(insertOtp.identifier, insertOtp.type);
    
    const [otp] = await db
      .insert(otps)
      .values(insertOtp)
      .returning();
    return otp;
  }

  async getOtp(identifier: string, type: string): Promise<Otp | undefined> {
    const [otp] = await db
      .select()
      .from(otps)
      .where(and(
        eq(otps.identifier, identifier),
        eq(otps.type, type),
        eq(otps.isVerified, false)
      ))
      .orderBy(desc(otps.createdAt))
      .limit(1);
    return otp || undefined;
  }

  async verifyOtp(identifier: string, otpCode: string, type: string): Promise<boolean> {
    const otp = await this.getOtp(identifier, type);
    
    if (!otp) {
      return false;
    }

    // Check if OTP is expired
    if (new Date() > new Date(otp.expiresAt)) {
      await this.deleteOtp(identifier, type);
      return false;
    }

    // Check if too many attempts
    if (otp.attempts >= 3) {
      await this.deleteOtp(identifier, type);
      return false;
    }

    // Check OTP code
    if (otp.otp === otpCode) {
      await db
        .update(otps)
        .set({ isVerified: true })
        .where(eq(otps.id, otp.id));
      return true;
    } else {
      await this.incrementOtpAttempts(identifier, type);
      return false;
    }
  }

  async deleteOtp(identifier: string, type: string): Promise<void> {
    await db
      .delete(otps)
      .where(and(
        eq(otps.identifier, identifier),
        eq(otps.type, type)
      ));
  }

  async incrementOtpAttempts(identifier: string, type: string): Promise<void> {
    await db
      .update(otps)
      .set({ 
        attempts: sql`${otps.attempts} + 1`
      })
      .where(and(
        eq(otps.identifier, identifier),
        eq(otps.type, type)
      ));
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db
      .delete(otps)
      .where(sql`${otps.expiresAt} < NOW()`);
  }

  async getPreviouslyOrderedProducts(userId: number): Promise<number[]> {
    const result = await db
      .select({ productId: orderItems.product_id })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.order_id))
      .where(eq(orders.user_id, userId))
      .groupBy(orderItems.product_id);
    
    return result.map(item => item.productId);
  }

  // Manual Payment Config methods
  async getManualPaymentConfig(): Promise<ManualPaymentConfig | undefined> {
    const [config] = await db.select().from(manualPaymentConfig).limit(1);
    return config || undefined;
  }

  async upsertManualPaymentConfig(config: InsertManualPaymentConfig): Promise<ManualPaymentConfig> {
    const existing = await this.getManualPaymentConfig();
    if (existing) {
      const [updated] = await db
        .update(manualPaymentConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(manualPaymentConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(manualPaymentConfig)
        .values(config)
        .returning();
      return created;
    }
  }

  // Manual Payment Details methods
  async createManualPaymentDetails(details: InsertManualPaymentDetails): Promise<ManualPaymentDetails> {
    const [created] = await db
      .insert(manualPaymentDetails)
      .values(details)
      .returning();
    return created;
  }

  async getManualPaymentDetailsByOrderId(orderId: number): Promise<ManualPaymentDetails | undefined> {
    const [details] = await db
      .select()
      .from(manualPaymentDetails)
      .where(eq(manualPaymentDetails.orderId, orderId));
    return details || undefined;
  }

  async updateManualPaymentDetails(id: number, updates: Partial<ManualPaymentDetails>): Promise<ManualPaymentDetails> {
    const [updated] = await db
      .update(manualPaymentDetails)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(manualPaymentDetails.id, id))
      .returning();
    return updated;
  }

  async submitUTR(orderId: number, utrReference: string): Promise<ManualPaymentDetails> {
    const details = await this.getManualPaymentDetailsByOrderId(orderId);
    if (!details) {
      throw new Error('Payment details not found for this order');
    }
    const [updated] = await db
      .update(manualPaymentDetails)
      .set({ 
        utrReference, 
        submittedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(manualPaymentDetails.id, details.id))
      .returning();
    return updated;
  }

  async verifyPayment(detailsId: number, adminId: number, status: 'success' | 'failed', rejectionReason?: string): Promise<ManualPaymentDetails> {
    const [updated] = await db
      .update(manualPaymentDetails)
      .set({ 
        status,
        verifiedByAdminId: adminId,
        verifiedAt: new Date(),
        rejectionReason: status === 'failed' ? rejectionReason : null,
        updatedAt: new Date()
      })
      .where(eq(manualPaymentDetails.id, detailsId))
      .returning();
    
    // Update the order status based on payment verification
    if (updated) {
      const orderStatus = status === 'success' ? 'pending' : 'payment_failed';
      await db
        .update(orders)
        .set({ status: orderStatus })
        .where(eq(orders.id, updated.orderId));
    }
    
    return updated;
  }

  async getPendingPayments(): Promise<(ManualPaymentDetails & { order: Order; user: User })[]> {
    const results = await db
      .select({
        paymentDetails: manualPaymentDetails,
        order: orders,
        user: users
      })
      .from(manualPaymentDetails)
      .innerJoin(orders, eq(orders.id, manualPaymentDetails.orderId))
      .innerJoin(users, eq(users.id, orders.user_id))
      .where(eq(manualPaymentDetails.status, 'pending'))
      .orderBy(desc(manualPaymentDetails.createdAt));
    
    return results.map(r => ({
      ...r.paymentDetails,
      order: r.order,
      user: r.user
    }));
  }

  // Payment Gateway Config methods
  async getPaymentGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
    return db.select().from(paymentGatewayConfig).orderBy(desc(paymentGatewayConfig.createdAt));
  }

  async getPaymentGatewayConfig(provider: string): Promise<PaymentGatewayConfig | undefined> {
    const [config] = await db
      .select()
      .from(paymentGatewayConfig)
      .where(eq(paymentGatewayConfig.provider, provider));
    return config || undefined;
  }

  async getActivePaymentGateway(): Promise<PaymentGatewayConfig | undefined> {
    const [config] = await db
      .select()
      .from(paymentGatewayConfig)
      .where(eq(paymentGatewayConfig.isActive, true));
    return config || undefined;
  }

  async upsertPaymentGatewayConfig(config: InsertPaymentGatewayConfig): Promise<PaymentGatewayConfig> {
    // If activating this gateway, deactivate all others first
    if (config.isActive) {
      await db
        .update(paymentGatewayConfig)
        .set({ isActive: false, updatedAt: new Date() });
    }

    const existing = await this.getPaymentGatewayConfig(config.provider);
    if (existing) {
      const [updated] = await db
        .update(paymentGatewayConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(paymentGatewayConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(paymentGatewayConfig)
        .values(config)
        .returning();
      return created;
    }
  }

  // Page Content methods
  async getPageContent(pageType: string): Promise<PageContent | undefined> {
    const [content] = await db
      .select()
      .from(pageContent)
      .where(eq(pageContent.pageType, pageType));
    return content || undefined;
  }

  async upsertPageContent(content: InsertPageContent): Promise<PageContent> {
    const existing = await this.getPageContent(content.pageType);
    if (existing) {
      const [updated] = await db
        .update(pageContent)
        .set({ ...content, updatedAt: new Date() })
        .where(eq(pageContent.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(pageContent)
        .values(content)
        .returning();
      return created;
    }
  }

  // Contact Settings methods
  async getContactSettings(): Promise<ContactSettings | undefined> {
    const [row] = await db.select().from(contactSettings).limit(1);
    return row || undefined;
  }

  async saveContactDraft(data: ContactData): Promise<ContactSettings> {
    const existing = await this.getContactSettings();
    if (existing) {
      const [updated] = await db
        .update(contactSettings)
        .set({ draftData: data, updatedAt: new Date() })
        .where(eq(contactSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(contactSettings)
      .values({ draftData: data, publishedData: {} })
      .returning();
    return created;
  }

  async publishContactSettings(): Promise<ContactSettings> {
    const existing = await this.getContactSettings();
    if (!existing) {
      throw new Error("No contact settings to publish — save a draft first.");
    }
    const [updated] = await db
      .update(contactSettings)
      .set({
        publishedData: existing.draftData || {},
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contactSettings.id, existing.id))
      .returning();
    return updated;
  }

  // ============== Charges Settings (Delivery + Handling) ==============
  // Normalize a DB row (decimals stored as strings) into the numeric/boolean config
  // used by the API + frontend. Returns all-off defaults when no row exists yet.
  private normalizeCharges(row?: ChargesSettings): ChargesConfig {
    return {
      deliveryEnabled: row?.deliveryEnabled ?? false,
      deliveryFreeThresholdEnabled: row?.deliveryFreeThresholdEnabled ?? false,
      deliveryFreeThreshold: Number(row?.deliveryFreeThreshold ?? 0),
      deliveryPercentageEnabled: row?.deliveryPercentageEnabled ?? false,
      deliveryPercentage: Number(row?.deliveryPercentage ?? 0),
      deliveryFixedEnabled: row?.deliveryFixedEnabled ?? false,
      deliveryFixedCharge: Number(row?.deliveryFixedCharge ?? 0),
      handlingEnabled: row?.handlingEnabled ?? false,
      handlingFreeThresholdEnabled: row?.handlingFreeThresholdEnabled ?? false,
      handlingFreeThreshold: Number(row?.handlingFreeThreshold ?? 0),
      handlingPercentageEnabled: row?.handlingPercentageEnabled ?? false,
      handlingPercentage: Number(row?.handlingPercentage ?? 0),
      handlingFixedEnabled: row?.handlingFixedEnabled ?? false,
      handlingFixedCharge: Number(row?.handlingFixedCharge ?? 0),
    };
  }

  async getChargesConfig(): Promise<ChargesConfig> {
    const [row] = await db.select().from(chargesSettings).limit(1);
    return this.normalizeCharges(row);
  }

  async saveChargesConfig(config: ChargesConfig): Promise<ChargesConfig> {
    // Decimal columns take string values in Drizzle.
    const values = {
      deliveryEnabled: config.deliveryEnabled,
      deliveryFreeThresholdEnabled: config.deliveryFreeThresholdEnabled,
      deliveryFreeThreshold: config.deliveryFreeThreshold.toString(),
      deliveryPercentageEnabled: config.deliveryPercentageEnabled,
      deliveryPercentage: config.deliveryPercentage.toString(),
      deliveryFixedEnabled: config.deliveryFixedEnabled,
      deliveryFixedCharge: config.deliveryFixedCharge.toString(),
      handlingEnabled: config.handlingEnabled,
      handlingFreeThresholdEnabled: config.handlingFreeThresholdEnabled,
      handlingFreeThreshold: config.handlingFreeThreshold.toString(),
      handlingPercentageEnabled: config.handlingPercentageEnabled,
      handlingPercentage: config.handlingPercentage.toString(),
      handlingFixedEnabled: config.handlingFixedEnabled,
      handlingFixedCharge: config.handlingFixedCharge.toString(),
      updatedAt: new Date(),
    };
    const [existing] = await db.select().from(chargesSettings).limit(1);
    if (existing) {
      const [updated] = await db
        .update(chargesSettings)
        .set(values)
        .where(eq(chargesSettings.id, existing.id))
        .returning();
      return this.normalizeCharges(updated);
    }
    const [created] = await db.insert(chargesSettings).values(values).returning();
    return this.normalizeCharges(created);
  }

  // ============== Site Settings ==============
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const [row] = await db.select().from(siteSettings).limit(1);
    return row || undefined;
  }
  private async ensureSiteSettings(): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    if (existing) return existing;
    const [created] = await db.insert(siteSettings).values({}).returning();
    return created;
  }
  async saveHeaderDraft(data: HeaderConfig): Promise<SiteSettings> {
    const row = await this.ensureSiteSettings();
    const [updated] = await db
      .update(siteSettings)
      .set({ headerDraft: data, updatedAt: new Date() })
      .where(eq(siteSettings.id, row.id))
      .returning();
    return updated;
  }
  async saveFooterDraft(data: FooterConfig): Promise<SiteSettings> {
    const row = await this.ensureSiteSettings();
    const [updated] = await db
      .update(siteSettings)
      .set({ footerDraft: data, updatedAt: new Date() })
      .where(eq(siteSettings.id, row.id))
      .returning();
    return updated;
  }
  async publishHeader(): Promise<SiteSettings> {
    const row = await this.ensureSiteSettings();
    const [updated] = await db
      .update(siteSettings)
      .set({
        headerPublished: row.headerDraft || {},
        headerPublishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, row.id))
      .returning();
    return updated;
  }
  async publishFooter(): Promise<SiteSettings> {
    const row = await this.ensureSiteSettings();
    const [updated] = await db
      .update(siteSettings)
      .set({
        footerPublished: row.footerDraft || {},
        footerPublishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, row.id))
      .returning();
    return updated;
  }

  async getOnlinePaymentStatus(): Promise<boolean> {
    const row = await this.getSiteSettings();
    if (!row) return true;
    return row.onlinePaymentsEnabled ?? true;
  }

  async setOnlinePaymentStatus(enabled: boolean): Promise<boolean> {
    const row = await this.ensureSiteSettings();
    await db
      .update(siteSettings)
      .set({ onlinePaymentsEnabled: enabled, updatedAt: new Date() })
      .where(eq(siteSettings.id, row.id));
    return enabled;
  }

  async getMaintenanceModeStatus(): Promise<boolean> {
    const row = await this.getSiteSettings();
    if (!row) return false;
    return row.maintenanceModeEnabled ?? false;
  }

  async setMaintenanceModeStatus(enabled: boolean): Promise<boolean> {
    const row = await this.ensureSiteSettings();
    await db
      .update(siteSettings)
      .set({ maintenanceModeEnabled: enabled, updatedAt: new Date() })
      .where(eq(siteSettings.id, row.id));
    return enabled;
  }

  // ============== Foundation Settings ==============
  async getFoundationSettings(): Promise<FoundationSettings | undefined> {
    const [row] = await db.select().from(foundationSettings).limit(1);
    return row || undefined;
  }
  private async ensureFoundationSettings(): Promise<FoundationSettings> {
    const existing = await this.getFoundationSettings();
    if (existing) return existing;
    const [created] = await db.insert(foundationSettings).values({}).returning();
    return created;
  }
  async saveFoundationDraft(data: FoundationContent): Promise<FoundationSettings> {
    const row = await this.ensureFoundationSettings();
    const [updated] = await db
      .update(foundationSettings)
      .set({ contentDraft: data, updatedAt: new Date() })
      .where(eq(foundationSettings.id, row.id))
      .returning();
    return updated;
  }
  async publishFoundation(): Promise<FoundationSettings> {
    const row = await this.ensureFoundationSettings();
    const [updated] = await db
      .update(foundationSettings)
      .set({
        contentPublished: row.contentDraft || {},
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(foundationSettings.id, row.id))
      .returning();
    return updated;
  }
  async saveWhatsappApiConfig(data: WhatsappApiConfig): Promise<FoundationSettings> {
    const row = await this.ensureFoundationSettings();
    const [updated] = await db
      .update(foundationSettings)
      .set({ whatsappApiConfig: data, updatedAt: new Date() })
      .where(eq(foundationSettings.id, row.id))
      .returning();
    return updated;
  }

  // ============== Foundation Enquiries ==============
  async createFoundationEnquiry(data: InsertFoundationEnquiry): Promise<FoundationEnquiry> {
    const [created] = await db
      .insert(foundationEnquiries)
      .values({ ...data, verified: true })
      .returning();
    return created;
  }
  async listFoundationEnquiries(search?: string): Promise<FoundationEnquiry[]> {
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      return db
        .select()
        .from(foundationEnquiries)
        .where(
          sql`${foundationEnquiries.name} ILIKE ${pattern} OR ${foundationEnquiries.phone} ILIKE ${pattern} OR ${foundationEnquiries.businessName} ILIKE ${pattern}`
        )
        .orderBy(desc(foundationEnquiries.createdAt));
    }
    return db
      .select()
      .from(foundationEnquiries)
      .orderBy(desc(foundationEnquiries.createdAt));
  }

  // Popup Banner methods
  async getPopupBanners(activeOnly: boolean = false): Promise<PopupBanner[]> {
    if (activeOnly) {
      const now = new Date();
      return db
        .select()
        .from(popupBanners)
        .where(eq(popupBanners.isActive, true))
        .orderBy(desc(popupBanners.createdAt));
    }
    return db.select().from(popupBanners).orderBy(desc(popupBanners.createdAt));
  }

  async getPopupBanner(id: number): Promise<PopupBanner | undefined> {
    const [banner] = await db
      .select()
      .from(popupBanners)
      .where(eq(popupBanners.id, id));
    return banner || undefined;
  }

  async createPopupBanner(banner: InsertPopupBanner): Promise<PopupBanner> {
    const [created] = await db
      .insert(popupBanners)
      .values(banner)
      .returning();
    return created;
  }

  async updatePopupBanner(id: number, banner: Partial<InsertPopupBanner>): Promise<PopupBanner> {
    const [updated] = await db
      .update(popupBanners)
      .set({ ...banner, updatedAt: new Date() })
      .where(eq(popupBanners.id, id))
      .returning();
    return updated;
  }

  async deletePopupBanner(id: number): Promise<void> {
    await db.delete(popupBanners).where(eq(popupBanners.id, id));
  }

  // About Section methods
  async getAboutSections(activeOnly: boolean = false): Promise<AboutSection[]> {
    if (activeOnly) {
      return db
        .select()
        .from(aboutSections)
        .where(eq(aboutSections.isActive, true))
        .orderBy(asc(aboutSections.displayOrder), asc(aboutSections.id));
    }
    return db
      .select()
      .from(aboutSections)
      .orderBy(asc(aboutSections.displayOrder), asc(aboutSections.id));
  }

  async getAboutSection(id: number): Promise<AboutSection | undefined> {
    const [section] = await db
      .select()
      .from(aboutSections)
      .where(eq(aboutSections.id, id));
    return section || undefined;
  }

  async createAboutSection(section: InsertAboutSection): Promise<AboutSection> {
    const [created] = await db
      .insert(aboutSections)
      .values(section)
      .returning();
    return created;
  }

  async updateAboutSection(id: number, section: Partial<InsertAboutSection>): Promise<AboutSection> {
    const [updated] = await db
      .update(aboutSections)
      .set(section)
      .where(eq(aboutSections.id, id))
      .returning();
    return updated;
  }

  async deleteAboutSection(id: number): Promise<void> {
    await db.delete(aboutSections).where(eq(aboutSections.id, id));
  }

  // Legal Pages methods (privacy + terms)
  async getLegalPageSections(pageType: string, activeOnly: boolean = false): Promise<LegalPage[]> {
    const conditions = activeOnly
      ? and(eq(legalPages.pageType, pageType), eq(legalPages.isActive, true))
      : eq(legalPages.pageType, pageType);
    return db
      .select()
      .from(legalPages)
      .where(conditions)
      .orderBy(asc(legalPages.displayOrder), asc(legalPages.id));
  }

  async getLegalPageSection(id: number): Promise<LegalPage | undefined> {
    const [section] = await db
      .select()
      .from(legalPages)
      .where(eq(legalPages.id, id));
    return section || undefined;
  }

  async createLegalPageSection(section: InsertLegalPage): Promise<LegalPage> {
    const [created] = await db
      .insert(legalPages)
      .values(section)
      .returning();
    return created;
  }

  async updateLegalPageSection(id: number, section: Partial<InsertLegalPage>): Promise<LegalPage> {
    const [updated] = await db
      .update(legalPages)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(legalPages.id, id))
      .returning();
    return updated;
  }

  async deleteLegalPageSection(id: number): Promise<void> {
    await db.delete(legalPages).where(eq(legalPages.id, id));
  }

  // Admin management methods
  async getAdminUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(sql`${users.role} IN ('admin', 'super_admin', 'sub_admin')`)
      .orderBy(desc(users.createdAt));
  }

  async getAdminUserById(id: number): Promise<User | undefined> {
    const [u] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), sql`${users.role} IN ('admin', 'super_admin', 'sub_admin')`));
    return u;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async setUserActive(id: number, isActive: boolean): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // ===== Account soft-delete (30-day recovery) =====
  async softDeleteUser(id: number, reason: string | null, recoveryDays: number = 30): Promise<User> {
    const now = new Date();
    const deadline = new Date(now.getTime() + recoveryDays * 24 * 60 * 60 * 1000);
    const [updated] = await db
      .update(users)
      .set({
        isDeleted: true,
        deletedAt: now,
        deletionReason: reason || null,
        recoveryDeadline: deadline,
        updatedAt: now,
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async recoverUser(id: number): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        isDeleted: false,
        deletedAt: null,
        deletionReason: null,
        recoveryDeadline: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getDeletedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isDeleted, true))
      .orderBy(desc(users.deletedAt));
  }

  async purgeExpiredDeletedUsers(): Promise<number> {
    const now = new Date();
    const expired = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.isDeleted, true), sql`${users.recoveryDeadline} < ${now}`));
    let count = 0;
    for (const row of expired) {
      try {
        await db.delete(users).where(eq(users.id, row.id));
        count++;
      } catch (e) {
        // Skip users with foreign-key dependencies (orders, addresses) — keep the row but anonymize
        await db
          .update(users)
          .set({
            username: `deleted_user_${row.id}`,
            email: null,
            phone: null,
            password: null,
            firstName: 'Deleted',
            lastName: 'User',
            googleId: null,
            profileImageUrl: null,
            addressLine1: null,
            addressLine2: null,
            area: null,
            city: null,
            state: null,
            pinCode: null,
            latitude: null,
            longitude: null,
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, row.id));
        count++;
      }
    }
    return count;
  }

  async generateUniqueAdminId(): Promise<string> {
    for (let i = 0; i < 12; i++) {
      const id = 'ADM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await db.select().from(users).where(eq(users.adminId, id)).limit(1);
      if (existing.length === 0) return id;
    }
    return 'ADM-' + Date.now().toString(36).toUpperCase();
  }

  async getAdminPermissions(adminUserId: number): Promise<AdminPermissionsMap> {
    const [row] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.adminUserId, adminUserId));
    if (!row) {
      // Default: every feature ON for admins, persist on first read
      const def = defaultPermissionsAllOn();
      try {
        await db.insert(adminPermissions).values({ adminUserId, permissions: def });
      } catch {}
      return def;
    }
    return { ...defaultPermissionsAllOn(), ...(row.permissions || {}) };
  }

  async upsertAdminPermissions(adminUserId: number, permissions: AdminPermissionsMap): Promise<AdminPermissionsMap> {
    const existing = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.adminUserId, adminUserId));
    if (existing.length === 0) {
      await db.insert(adminPermissions).values({ adminUserId, permissions });
    } else {
      await db
        .update(adminPermissions)
        .set({ permissions, updatedAt: new Date() })
        .where(eq(adminPermissions.adminUserId, adminUserId));
    }
    return permissions;
  }

  async deleteAdminUser(id: number): Promise<void> {
    await db.delete(adminPermissions).where(eq(adminPermissions.adminUserId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  // Reports methods
  async getOrdersReport(startDate: Date, endDate: Date, paymentMethod?: string): Promise<Order[]> {
    // Money actually received: gateway/UPI/card/wallet marked 'paid'
    // OR cash-on-delivery marked 'confirmed' (collected on delivery).
    const conditions = [
      sql`${orders.orderDate} >= ${startDate}`,
      sql`${orders.orderDate} <= ${endDate}`,
      sql`(
        (${orders.paymentMethod} = 'cod' AND ${orders.paymentStatus} = 'confirmed')
        OR (${orders.paymentMethod} <> 'cod' AND ${orders.paymentStatus} = 'paid')
      )`,
    ];
    if (paymentMethod === 'cod') {
      conditions.push(eq(orders.paymentMethod, 'cod'));
    } else if (paymentMethod === 'online') {
      conditions.push(sql`${orders.paymentMethod} <> 'cod'`);
    }
    return db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.orderDate));
  }

  async getCustomersReport(startDate: Date, endDate: Date): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(
        eq(users.role, 'customer'),
        sql`${users.createdAt} >= ${startDate}`,
        sql`${users.createdAt} <= ${endDate}`
      ))
      .orderBy(desc(users.createdAt));
  }

  async getPaymentsReport(startDate: Date, endDate: Date): Promise<ManualPaymentDetails[]> {
    return db
      .select()
      .from(manualPaymentDetails)
      .where(and(
        sql`${manualPaymentDetails.createdAt} >= ${startDate}`,
        sql`${manualPaymentDetails.createdAt} <= ${endDate}`
      ))
      .orderBy(desc(manualPaymentDetails.createdAt));
  }

  // PhonePe Transaction methods
  async createPhonePeTransaction(transaction: InsertPhonePeTransaction): Promise<PhonePeTransaction> {
    const [created] = await db
      .insert(phonePeTransactions)
      .values(transaction)
      .returning();
    return created;
  }

  async getPhonePeTransactionByMerchantId(merchantTransactionId: string): Promise<PhonePeTransaction | undefined> {
    const [txn] = await db
      .select()
      .from(phonePeTransactions)
      .where(eq(phonePeTransactions.merchantTransactionId, merchantTransactionId));
    return txn || undefined;
  }

  async getPhonePeTransactionByOrderId(orderId: number): Promise<PhonePeTransaction | undefined> {
    const [txn] = await db
      .select()
      .from(phonePeTransactions)
      .where(eq(phonePeTransactions.orderId, orderId));
    return txn || undefined;
  }

  async updatePhonePeTransaction(id: number, updates: Partial<PhonePeTransaction>): Promise<PhonePeTransaction> {
    const [updated] = await db
      .update(phonePeTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(phonePeTransactions.id, id))
      .returning();
    return updated;
  }

  async updatePhonePeTransactionByMerchantId(merchantTransactionId: string, updates: Partial<PhonePeTransaction>): Promise<PhonePeTransaction> {
    const [updated] = await db
      .update(phonePeTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(phonePeTransactions.merchantTransactionId, merchantTransactionId))
      .returning();
    return updated;
  }

  // Verified customers methods - returns verified phone numbers with address details
  // Note: OTP values are intentionally NOT returned for security reasons
  async getVerifiedCustomers(): Promise<{
    id: number;
    customerName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    pincode: string;
    verifiedAt: Date | null;
    addressId: number;
  }[]> {
    // Get all verified OTPs (without the OTP value for security)
    const verifiedRecords = await db
      .select({
        otpId: otps.id,
        phone: otps.identifier,
        verifiedAt: otps.createdAt,
      })
      .from(otps)
      .where(eq(otps.isVerified, true))
      .orderBy(desc(otps.createdAt));

    const results = [];
    
    for (const record of verifiedRecords) {
      // Find addresses with this phone number
      const addressRecords = await db
        .select()
        .from(addresses)
        .where(eq(addresses.phone, record.phone))
        .limit(1);
      
      if (addressRecords.length > 0) {
        const addr = addressRecords[0];
        results.push({
          id: record.otpId,
          customerName: addr.name,
          phone: record.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          verifiedAt: record.verifiedAt,
          addressId: addr.id,
        });
      } else {
        // No address found, still show the verification record
        results.push({
          id: record.otpId,
          customerName: 'Unknown',
          phone: record.phone,
          addressLine1: 'N/A',
          addressLine2: null,
          city: 'N/A',
          state: 'N/A',
          pincode: 'N/A',
          verifiedAt: record.verifiedAt,
          addressId: 0,
        });
      }
    }
    
    return results;
  }

  async getShopSettings(): Promise<any> {
    const result = await pool.query('SELECT * FROM shop_settings LIMIT 1');
    return result.rows[0] || null;
  }

  async updateShopSettings(data: { isOpen?: boolean; manualOverride?: boolean; schedule?: any[] }): Promise<any> {
    const existing = await this.getShopSettings();
    if (!existing) {
      const result = await pool.query(
        `INSERT INTO shop_settings (is_open, manual_override, schedule, updated_at)
         VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [data.isOpen ?? true, data.manualOverride ?? false, JSON.stringify(data.schedule ?? [])]
      );
      return result.rows[0];
    }
    const result = await pool.query(
      `UPDATE shop_settings SET
         is_open = $1,
         manual_override = $2,
         schedule = $3,
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [
        data.isOpen !== undefined ? data.isOpen : existing.is_open,
        data.manualOverride !== undefined ? data.manualOverride : existing.manual_override,
        JSON.stringify(data.schedule !== undefined ? data.schedule : existing.schedule),
        existing.id,
      ]
    );
    return result.rows[0];
  }
}

export const storage = new DatabaseStorage();
