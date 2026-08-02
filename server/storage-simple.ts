import { type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct, type Address, type InsertAddress, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type CartItem, type InsertCartItem, type WishlistItem, type InsertWishlistItem, type Review, type InsertReview, type Banner, type InsertBanner } from "@shared/schema";

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

  // Product methods
  getProducts(filters?: { categoryId?: number; featured?: boolean; search?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: number, stock: number): Promise<Product>;

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

class MemStorage implements IStorage {
  private users: (User & { password?: string })[] = [
    { id: 1, username: 'pathakji', password: 'bhandar123', role: 'admin', createdAt: new Date() },
    { id: 2, username: 'rajdeep', password: 'web123', role: 'super_admin', createdAt: new Date() },
  ];
  
  private categories: Category[] = [
    { id: 1, name: 'Biscuits', description: 'Traditional and modern biscuits', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', isActive: true, createdAt: new Date() },
    { id: 2, name: 'Snacks', description: 'Crispy and delicious snack items', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', isActive: true, createdAt: new Date() },
    { id: 3, name: 'Cookies', description: 'Fresh baked cookies and treats', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', isActive: true, createdAt: new Date() },
    { id: 4, name: 'Pastries', description: 'Soft and sweet pastry delights', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', isActive: true, createdAt: new Date() },
    { id: 5, name: 'Cake', description: 'Special occasion cakes', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', isActive: true, createdAt: new Date() },
    { id: 6, name: 'Rolls', description: 'Fresh bread rolls and buns', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', isActive: true, createdAt: new Date() },
  ];
  
  private products: Product[] = [
    { id: 1, name: 'Rasgulla', price: '120', description: 'Soft spongy cottage cheese balls in sugar syrup', category_id: 1, weight: '500g', images: [], gstRate: '5', stock: 50, featured: true, isActive: true, tags: ['sweet', 'traditional'], createdAt: new Date() },
    { id: 2, name: 'Gulab Jamun', price: '150', description: 'Deep fried milk solids in aromatic syrup', category_id: 1, weight: '500g', images: [], gstRate: '5', stock: 40, featured: true, isActive: true, tags: ['sweet', 'popular'], createdAt: new Date() },
    { id: 3, name: 'Samosa', price: '40', description: 'Crispy triangular pastry with spiced potato filling', category_id: 2, weight: '4 pieces', images: [], gstRate: '5', stock: 30, featured: true, isActive: true, tags: ['snack', 'fried'], createdAt: new Date() },
    { id: 4, name: 'Kachori', price: '35', description: 'Flaky pastry filled with spiced lentils', category_id: 2, weight: '4 pieces', images: [], gstRate: '5', stock: 25, featured: false, isActive: true, tags: ['snack', 'spicy'], createdAt: new Date() },
    { id: 5, name: 'Mysore Pak', price: '200', description: 'Rich gram flour sweet with ghee', category_id: 1, weight: '250g', images: [], gstRate: '5', stock: 20, featured: true, isActive: true, tags: ['sweet', 'premium'], createdAt: new Date() },
  ];
  
  private cartItemsData: CartItem[] = [];
  private wishlistItemsData: WishlistItem[] = [];
  private addressesData: Address[] = [];
  private ordersData: Order[] = [];
  private orderItemsData: OrderItem[] = [];
  private reviewsData: Review[] = [];
  private bannersData: Banner[] = [
    {
      id: 1,
      title: "Premium Bakery Banner 1",
      description: null,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80",
      videoUrl: null,
      linkUrl: "/products",
      linkType: "category",
      linkId: 1,
      isActive: true,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      title: "Traditional Sweets Banner",
      description: null,
      imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      videoUrl: null,
      linkUrl: "/products?category=1",
      linkType: "category",
      linkId: 1,
      isActive: true,
      displayOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      title: "Fresh Baked Goods",
      description: null,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      videoUrl: null,
      linkUrl: "/products?category=2",
      linkType: "category",
      linkId: 2,
      isActive: true,
      displayOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 4,
      title: "Special Offers",
      description: null,
      imageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      videoUrl: null,
      linkUrl: "/products?featured=true",
      linkType: "category",
      linkId: null,
      isActive: true,
      displayOrder: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 5,
      title: "Premium Collection",
      description: null,
      imageUrl: "https://images.unsplash.com/photo-1557925923-cd4648e211a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      videoUrl: null,
      linkUrl: "/products",
      linkType: "category",
      linkId: null,
      isActive: true,
      displayOrder: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  async getUser(id: number): Promise<User | undefined> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return this.users.find(u => u.phone === phone);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = { ...user, id: this.users.length + 1, createdAt: new Date() };
    this.users.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    this.users[index] = { ...this.users[index], ...user };
    const { password, ...userWithoutPassword } = this.users[index];
    return userWithoutPassword;
  }

  async getCustomers(): Promise<User[]> {
    return this.users.filter(u => u.role === 'customer').map(({ password, ...user }) => user);
  }

  async getCategories(): Promise<Category[]> {
    return this.categories.filter(c => c.isActive);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.find(c => c.id === id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory = { ...category, id: this.categories.length + 1, createdAt: new Date() };
    this.categories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    this.categories[index] = { ...this.categories[index], ...category };
    return this.categories[index];
  }

  async getProducts(filters?: { categoryId?: number; featured?: boolean; search?: string }): Promise<Product[]> {
    let result = this.products.filter(p => p.isActive);
    
    if (filters?.categoryId) {
      result = result.filter(p => p.category_id === filters.categoryId);
    }
    if (filters?.featured) {
      result = result.filter(p => p.featured);
    }
    if (filters?.search) {
      result = result.filter(p => p.name.toLowerCase().includes(filters.search!.toLowerCase()));
    }
    
    return result;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.find(p => p.id === id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct = { ...product, id: this.products.length + 1, createdAt: new Date() };
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    this.products[index] = { ...this.products[index], ...product };
    return this.products[index];
  }

  async updateProductStock(id: number, stock: number): Promise<Product> {
    return this.updateProduct(id, { stock });
  }

  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    return this.cartItemsData
      .filter(item => item.user_id === userId)
      .map(item => ({
        ...item,
        product: this.products.find(p => p.id === item.product_id)!
      }));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const existingItem = this.cartItemsData.find(
      item => item.user_id === cartItem.user_id && item.product_id === cartItem.product_id
    );
    
    if (existingItem) {
      existingItem.quantity += cartItem.quantity;
      return existingItem;
    }
    
    const newItem = { ...cartItem, id: this.cartItemsData.length + 1, createdAt: new Date() };
    this.cartItemsData.push(newItem);
    return newItem;
  }

  async updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem> {
    const index = this.cartItemsData.findIndex(item => item.id === id && item.user_id === userId);
    if (index === -1) throw new Error('Cart item not found');
    this.cartItemsData[index].quantity = quantity;
    return this.cartItemsData[index];
  }

  async removeFromCart(id: number, userId: number): Promise<void> {
    const index = this.cartItemsData.findIndex(item => item.id === id && item.user_id === userId);
    if (index !== -1) {
      this.cartItemsData.splice(index, 1);
    }
  }

  async clearCart(userId: number): Promise<void> {
    this.cartItemsData = this.cartItemsData.filter(item => item.user_id !== userId);
  }

  async getAddresses(userId: number): Promise<Address[]> {
    return this.addressesData.filter(addr => addr.user_id === userId);
  }

  async getAddress(id: number): Promise<Address | undefined> {
    return this.addressesData.find(addr => addr.id === id);
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const newAddress = { ...address, id: this.addressesData.length + 1, createdAt: new Date() };
    this.addressesData.push(newAddress);
    return newAddress;
  }

  async updateAddress(id: number, address: Partial<InsertAddress>): Promise<Address> {
    const index = this.addressesData.findIndex(addr => addr.id === id);
    if (index === -1) throw new Error('Address not found');
    this.addressesData[index] = { ...this.addressesData[index], ...address };
    return this.addressesData[index];
  }

  async getOrders(userId: number): Promise<Order[]> {
    return this.ordersData.filter(order => order.user_id === userId);
  }

  async getOrder(id: number, userId: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const order = this.ordersData.find(o => o.id === id && o.user_id === userId);
    if (!order) return undefined;
    
    const orderItems = this.orderItemsData
      .filter(item => item.order_id === id)
      .map(item => ({
        ...item,
        product: this.products.find(p => p.id === item.product_id)!
      }));
    
    return { ...order, orderItems };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder = { ...order, id: this.ordersData.length + 1, createdAt: new Date() };
    this.ordersData.push(newOrder);
    return newOrder;
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const newOrderItem = { ...orderItem, id: this.orderItemsData.length + 1 };
    this.orderItemsData.push(newOrderItem);
    return newOrderItem;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const index = this.ordersData.findIndex(order => order.id === id);
    if (index === -1) throw new Error('Order not found');
    this.ordersData[index].status = status;
    return this.ordersData[index];
  }

  async getAllOrders(status?: string): Promise<Order[]> {
    return status ? this.ordersData.filter(order => order.status === status) : this.ordersData;
  }

  async getProductReviews(productId: number): Promise<(Review & { user: Pick<User, 'username'> })[]> {
    return this.reviewsData
      .filter(review => review.product_id === productId)
      .map(review => ({
        ...review,
        user: { username: this.users.find(u => u.id === review.user_id)?.username || 'Anonymous' }
      }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const newReview = { ...review, id: this.reviewsData.length + 1, createdAt: new Date() };
    this.reviewsData.push(newReview);
    return newReview;
  }

  async getAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Order[];
    topProducts: (Product & { orderCount: number })[];
  }> {
    return {
      totalOrders: this.ordersData.length,
      totalRevenue: this.ordersData.reduce((sum, order) => sum + parseFloat(order.total), 0),
      totalCustomers: this.users.filter(u => u.role === 'customer').length,
      totalProducts: this.products.length,
      recentOrders: this.ordersData.slice(-10),
      topProducts: this.products.map(p => ({ ...p, orderCount: 0 }))
    };
  }

  // Banner methods
  async getBanners(activeOnly = false): Promise<Banner[]> {
    let banners = this.bannersData;
    if (activeOnly) {
      banners = banners.filter(banner => banner.isActive);
    }
    return banners.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getBanner(id: number): Promise<Banner | undefined> {
    return this.bannersData.find(banner => banner.id === id);
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const id = Math.max(0, ...this.bannersData.map(b => b.id)) + 1;
    const banner: Banner = {
      id,
      ...insertBanner,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bannersData.push(banner);
    return banner;
  }

  async updateBanner(id: number, updateBanner: Partial<InsertBanner>): Promise<Banner> {
    const index = this.bannersData.findIndex(banner => banner.id === id);
    if (index === -1) {
      throw new Error('Banner not found');
    }
    
    this.bannersData[index] = {
      ...this.bannersData[index],
      ...updateBanner,
      updatedAt: new Date(),
    };
    
    return this.bannersData[index];
  }

  async deleteBanner(id: number): Promise<void> {
    const index = this.bannersData.findIndex(banner => banner.id === id);
    if (index === -1) {
      throw new Error('Banner not found');
    }
    this.bannersData.splice(index, 1);
  }

  // Wishlist methods
  async getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    const wishlistItems = this.wishlistItemsData.filter(item => item.user_id === userId);
    return wishlistItems.map(item => {
      const product = this.products.find(p => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product not found for wishlist item ${item.id}`);
      }
      return { ...item, product };
    });
  }

  async addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    // Check if item already exists in wishlist
    const existing = this.wishlistItemsData.find(
      item => item.user_id === wishlistItem.user_id && item.product_id === wishlistItem.product_id
    );
    if (existing) {
      throw new Error('Product already in wishlist');
    }

    const id = Math.max(0, ...this.wishlistItemsData.map(item => item.id)) + 1;
    const newItem: WishlistItem = {
      id,
      ...wishlistItem,
      createdAt: new Date(),
    };
    this.wishlistItemsData.push(newItem);
    return newItem;
  }

  async removeFromWishlist(productId: number, userId: number): Promise<void> {
    const index = this.wishlistItemsData.findIndex(
      item => item.product_id === productId && item.user_id === userId
    );
    if (index === -1) {
      throw new Error('Product not found in wishlist');
    }
    this.wishlistItemsData.splice(index, 1);
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    return this.wishlistItemsData.some(
      item => item.user_id === userId && item.product_id === productId
    );
  }
}

export const storage = new MemStorage();