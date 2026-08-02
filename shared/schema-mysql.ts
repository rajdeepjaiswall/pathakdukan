import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  json,
  boolean,
  index,
  serial,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("idx_session_expire").on(table.expire),
  })
);

// User storage table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }).default("customer"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Categories table
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Products table
export const products = mysqlTable(
  "products",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: varchar("price", { length: 20 }).notNull(),
    weight: varchar("weight", { length: 50 }),
    category_id: int("category_id").references(() => categories.id),
    images: json("images").$type<string[]>(),
    videos: json("videos").$type<string[]>(),
    stock: int("stock").default(0),
    isActive: boolean("isActive").default(true),
    featured: boolean("featured").default(false),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  },
  (table) => ({
    categoryIdx: index("idx_products_category").on(table.category_id),
    featuredIdx: index("idx_products_featured").on(table.featured),
  })
);

// Addresses table
export const addresses = mysqlTable(
  "addresses",
  {
    id: int("id").primaryKey().autoincrement(),
    user_id: int("user_id").references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    addressLine1: text("addressLine1").notNull(),
    addressLine2: text("addressLine2"),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    pincode: varchar("pincode", { length: 10 }).notNull(),
    landmark: text("landmark"),
    isDefault: boolean("isDefault").default(false),
    isPhoneVerified: boolean("isPhoneVerified").default(false),
    phoneVerifiedAt: timestamp("phoneVerifiedAt"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdx: index("idx_addresses_user").on(table.user_id),
  })
);

// Cart items table
export const cartItems = mysqlTable(
  "cart_items",
  {
    id: int("id").primaryKey().autoincrement(),
    user_id: int("user_id").references(() => users.id),
    product_id: int("product_id").references(() => products.id),
    quantity: int("quantity").notNull().default(1),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdx: index("idx_cart_user").on(table.user_id),
  })
);

// Wishlist items table
export const wishlistItems = mysqlTable(
  "wishlist_items",
  {
    id: int("id").primaryKey().autoincrement(),
    user_id: int("user_id").references(() => users.id),
    product_id: int("product_id").references(() => products.id),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_wishlist_user").on(table.user_id),
  })
);

// Orders table
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").primaryKey().autoincrement(),
    user_id: int("user_id").references(() => users.id),
    orderNumber: varchar("orderNumber", { length: 255 }).unique().notNull(),
    status: varchar("status", { length: 50 }).default("pending"),
    subtotal: varchar("subtotal", { length: 20 }).notNull(),
    gstAmount: varchar("gstAmount", { length: 20 }).default("0"),
    deliveryCharge: varchar("deliveryCharge", { length: 20 }).default("0"),
    handlingCharge: varchar("handlingCharge", { length: 20 }).default("0"),
    total: varchar("total", { length: 20 }).notNull(),
    paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
    paymentStatus: varchar("paymentStatus", { length: 50 }).default("pending"),
    deliveryAddress: json("deliveryAddress").notNull(),
    notes: text("notes"),
    riderName: text("rider_name"),
    riderPhone: text("rider_phone"),
    estimatedDelivery: timestamp("estimatedDelivery"),
    deliveryDate: timestamp("deliveryDate"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdx: index("idx_orders_user").on(table.user_id),
    statusIdx: index("idx_orders_status").on(table.status),
  })
);

// Delivery + handling charges (single-row config)
// Priority model (first enabled wins): Free Threshold -> Percentage -> Fixed.
export const chargesSettings = mysqlTable("charges_settings", {
  id: int("id").primaryKey().autoincrement(),
  deliveryEnabled: boolean("delivery_enabled").default(false),
  deliveryFreeThresholdEnabled: boolean("delivery_free_threshold_enabled").default(false),
  deliveryFreeThreshold: varchar("delivery_free_threshold", { length: 20 }).default("0"),
  deliveryPercentageEnabled: boolean("delivery_percentage_enabled").default(false),
  deliveryPercentage: varchar("delivery_percentage", { length: 20 }).default("0"),
  deliveryFixedEnabled: boolean("delivery_fixed_enabled").default(false),
  deliveryFixedCharge: varchar("delivery_fixed_charge", { length: 20 }).default("0"),
  handlingEnabled: boolean("handling_enabled").default(false),
  handlingFreeThresholdEnabled: boolean("handling_free_threshold_enabled").default(false),
  handlingFreeThreshold: varchar("handling_free_threshold", { length: 20 }).default("0"),
  handlingPercentageEnabled: boolean("handling_percentage_enabled").default(false),
  handlingPercentage: varchar("handling_percentage", { length: 20 }).default("0"),
  handlingFixedEnabled: boolean("handling_fixed_enabled").default(false),
  handlingFixedCharge: varchar("handling_fixed_charge", { length: 20 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Order items table
export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").primaryKey().autoincrement(),
    order_id: int("order_id").references(() => orders.id),
    product_id: int("product_id").references(() => products.id),
    quantity: int("quantity").notNull(),
    price: varchar("price", { length: 20 }).notNull(),
    total: varchar("total", { length: 20 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    orderIdx: index("idx_order_items_order").on(table.order_id),
  })
);

// Reviews table
export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").primaryKey().autoincrement(),
    user_id: int("user_id").references(() => users.id),
    product_id: int("product_id").references(() => products.id),
    rating: int("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  },
  (table) => ({
    productIdx: index("idx_reviews_product").on(table.product_id),
  })
);

// Banners table
export const banners = mysqlTable("banners", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  link: varchar("link", { length: 500 }),
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// OTP table for phone/email verification
export const otps = mysqlTable("otps", {
  id: int("id").primaryKey().autoincrement(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull().default("verification"),
  attempts: int("attempts").default(0),
  isVerified: boolean("isVerified").default(false),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = typeof wishlistItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = typeof banners.$inferInsert;
export type Otp = typeof otps.$inferSelect;
export type InsertOtp = typeof otps.$inferInsert;
export type ChargesSettings = typeof chargesSettings.$inferSelect;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertAddressSchema = createInsertSchema(addresses);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertWishlistItemSchema = createInsertSchema(wishlistItems);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertReviewSchema = createInsertSchema(reviews);
export const insertBannerSchema = createInsertSchema(banners);
export const insertOtpSchema = createInsertSchema(otps);