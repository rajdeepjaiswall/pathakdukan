import { 
  users, categories, products, addresses, orders, orderItems, cartItems, wishlistItems, reviews, banners,
  type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct,
  type Address, type InsertAddress, type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem, type WishlistItem, type InsertWishlistItem, type Review, type InsertReview,
  type Banner, type InsertBanner
} from "@shared/schema-mysql";
import { db } from "./db-cpanel";
import { eq, and, like, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getCustomers(): Promise<User[]>;

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

  // Cart methods
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem>;
  removeFromCart(id: number, userId: number): Promise<void>;
  clearCart(userId: number): Promise<void>;

  // Wishlist methods
  getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(id: number, userId: number): Promise<void>;
  isInWishlist(userId: number, productId: number): Promise<boolean>;

  // Address methods
  getAddresses(userId: number): Promise<Address[]>;
  getAddress(id: number): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: number, address: Partial<InsertAddress>): Promise<Address>;
  deleteAddress(id: number): Promise<void>;

  // Order methods
  getOrders(userId: number): Promise<Order[]>;
  getOrder(id: number, userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  getAllOrders(status?: string): Promise<Order[]>;

  // Review methods
  getProductReviews(productId: number): Promise<(Review & { user: Pick<User, 'username'> })[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Analytics methods
  getAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Order[];
    topProducts: (Product & { orderCount: number })[];
  }>;

  // Banner methods
  getBanners(activeOnly?: boolean): Promise<Banner[]>;
  getBanner(id: number): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner>;
  deleteBanner(id: number): Promise<void>;
}

class MySQLStorage implements IStorage {
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user);
    return this.getUser(Number(result[0].insertId)) as Promise<User>;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    await db.update(users).set(user).where(eq(users.id, id));
    return this.getUser(id) as Promise<User>;
  }

  async getCustomers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, 'customer'));
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category);
    return this.getCategory(Number(result[0].insertId)) as Promise<Category>;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    await db.update(categories).set(category).where(eq(categories.id, id));
    return this.getCategory(id) as Promise<Category>;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getProducts(filters?: { categoryId?: number; featured?: boolean; search?: string }): Promise<Product[]> {
    let query = db.select().from(products).where(eq(products.isActive, true));
    
    if (filters?.categoryId) {
      query = query.where(eq(products.categoryId, filters.categoryId));
    }
    
    if (filters?.featured) {
      query = query.where(eq(products.featured, true));
    }
    
    if (filters?.search) {
      query = query.where(like(products.name, `%${filters.search}%`));
    }
    
    return query.orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product);
    return this.getProduct(Number(result[0].insertId)) as Promise<Product>;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    await db.update(products).set(product).where(eq(products.id, id));
    return this.getProduct(id) as Promise<Product>;
  }

  async updateProductStock(id: number, stock: number): Promise<Product> {
    await db.update(products).set({ stock }).where(eq(products.id, id));
    return this.getProduct(id) as Promise<Product>;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const items = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: products
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
    
    return items.map(item => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      product: item.product!
    }));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const result = await db.insert(cartItems).values(cartItem);
    const newItem = await db.select().from(cartItems).where(eq(cartItems.id, Number(result[0].insertId)));
    return newItem[0];
  }

  async updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem> {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
    const result = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return result[0];
  }

  async removeFromCart(id: number, userId: number): Promise<void> {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    const items = await db
      .select({
        id: wishlistItems.id,
        userId: wishlistItems.userId,
        productId: wishlistItems.productId,
        createdAt: wishlistItems.createdAt,
        product: products
      })
      .from(wishlistItems)
      .leftJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId));
    
    return items.map(item => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      createdAt: item.createdAt,
      product: item.product!
    }));
  }

  async addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    const result = await db.insert(wishlistItems).values(wishlistItem);
    const newItem = await db.select().from(wishlistItems).where(eq(wishlistItems.id, Number(result[0].insertId)));
    return newItem[0];
  }

  async removeFromWishlist(id: number, userId: number): Promise<void> {
    await db.delete(wishlistItems).where(and(eq(wishlistItems.productId, id), eq(wishlistItems.userId, userId)));
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const result = await db.select().from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
    return result.length > 0;
  }

  async getAddresses(userId: number): Promise<Address[]> {
    return db.select().from(addresses).where(eq(addresses.userId, userId));
  }

  async getAddress(id: number): Promise<Address | undefined> {
    const result = await db.select().from(addresses).where(eq(addresses.id, id));
    return result[0];
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const result = await db.insert(addresses).values(address);
    return this.getAddress(Number(result[0].insertId)) as Promise<Address>;
  }

  async updateAddress(id: number, address: Partial<InsertAddress>): Promise<Address> {
    await db.update(addresses).set(address).where(eq(addresses.id, id));
    return this.getAddress(id) as Promise<Address>;
  }

  async deleteAddress(id: number): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }

  async getOrders(userId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number, userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const orderResult = await db.select().from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)));
    
    if (!orderResult[0]) return undefined;
    
    const orderItemsResult = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        product: products
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));
    
    return {
      ...orderResult[0],
      orderItems: orderItemsResult.map(item => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: item.product!
      }))
    };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order);
    const newOrder = await db.select().from(orders).where(eq(orders.id, Number(result[0].insertId)));
    return newOrder[0];
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(orderItem);
    const newItem = await db.select().from(orderItems).where(eq(orderItems.id, Number(result[0].insertId)));
    return newItem[0];
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getAllOrders(status?: string): Promise<Order[]> {
    let query = db.select().from(orders);
    if (status) {
      query = query.where(eq(orders.status, status));
    }
    return query.orderBy(desc(orders.createdAt));
  }

  async getProductReviews(productId: number): Promise<(Review & { user: Pick<User, 'username'> })[]> {
    const reviewsResult = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        productId: reviews.productId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        user: {
          username: users.username
        }
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
    
    return reviewsResult.map(review => ({
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user!
    }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review);
    const newReview = await db.select().from(reviews).where(eq(reviews.id, Number(result[0].insertId)));
    return newReview[0];
  }

  async getAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Order[];
    topProducts: (Product & { orderCount: number })[];
  }> {
    const [ordersCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [customersCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'customer'));
    const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    
    const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);
    
    const topProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        weight: products.weight,
        categoryId: products.categoryId,
        images: products.images,
        videos: products.videos,
        stock: products.stock,
        isActive: products.isActive,
        featured: products.featured,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        orderCount: sql<number>`count(${orderItems.id})`
      })
      .from(products)
      .leftJoin(orderItems, eq(products.id, orderItems.productId))
      .groupBy(products.id)
      .orderBy(desc(sql`count(${orderItems.id})`))
      .limit(5);
    
    // Calculate total revenue
    const revenueResult = await db.select({ 
      total: sql<number>`sum(cast(${orders.total} as decimal(10,2)))` 
    }).from(orders);
    
    return {
      totalOrders: ordersCount.count,
      totalRevenue: revenueResult[0]?.total || 0,
      totalCustomers: customersCount.count,
      totalProducts: productsCount.count,
      recentOrders,
      topProducts
    };
  }

  async getBanners(activeOnly = false): Promise<Banner[]> {
    let query = db.select().from(banners);
    if (activeOnly) {
      query = query.where(eq(banners.isActive, true));
    }
    return query.orderBy(asc(banners.order));
  }

  async getBanner(id: number): Promise<Banner | undefined> {
    const result = await db.select().from(banners).where(eq(banners.id, id));
    return result[0];
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const result = await db.insert(banners).values(banner);
    return this.getBanner(Number(result[0].insertId)) as Promise<Banner>;
  }

  async updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner> {
    await db.update(banners).set(banner).where(eq(banners.id, id));
    return this.getBanner(id) as Promise<Banner>;
  }

  async deleteBanner(id: number): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }
}

export const storage = new MySQLStorage();