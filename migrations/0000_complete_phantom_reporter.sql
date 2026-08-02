CREATE TABLE "about_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_type" text NOT NULL,
	"title" text,
	"subtitle" text,
	"description" text,
	"media" text[] DEFAULT '{}',
	"media_types" text[] DEFAULT '{}',
	"cta_text" text,
	"cta_link" text,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"landmark" text,
	"is_default" boolean DEFAULT false,
	"is_phone_verified" boolean DEFAULT false,
	"phone_verified_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_permissions_admin_user_id_unique" UNIQUE("admin_user_id")
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"video_url" text,
	"link_url" text,
	"link_type" text DEFAULT 'product',
	"link_id" integer,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"placement" text DEFAULT 'hero' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"product_id" integer,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"draft_data" jsonb DEFAULT '{}'::jsonb,
	"published_data" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_discount_amount" numeric(10, 2),
	"usage_limit" integer,
	"used_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "event_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"event_name" text NOT NULL,
	"event_location" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "foundation_enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"business_name" text NOT NULL,
	"location" text,
	"scale" text,
	"phone" text NOT NULL,
	"verified" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "foundation_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_draft" jsonb DEFAULT '{}'::jsonb,
	"content_published" jsonb DEFAULT '{}'::jsonb,
	"whatsapp_api_config" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "legal_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_type" text NOT NULL,
	"level" integer DEFAULT 2 NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"list_items" text[] DEFAULT '{}',
	"highlight" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manual_payment_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"qr_image_url" text,
	"upi_id" text,
	"is_active" boolean DEFAULT true,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manual_payment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"utr_reference" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp,
	"verified_by_admin_id" integer,
	"verified_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"product_id" integer,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"gst_amount" numeric(10, 2) NOT NULL,
	"delivery_charge" numeric(10, 2) DEFAULT '0.00',
	"total" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"delivery_address" jsonb NOT NULL,
	"order_date" timestamp DEFAULT now(),
	"delivery_date" timestamp,
	"notes" text,
	"rider_name" text,
	"rider_phone" text,
	"rider_image" text,
	"estimated_delivery" timestamp,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"otp" text NOT NULL,
	"type" text NOT NULL,
	"purpose" text DEFAULT 'verification' NOT NULL,
	"attempts" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_type" text NOT NULL,
	"title" text,
	"sections" jsonb DEFAULT '[]'::jsonb,
	"contact_info" jsonb,
	"is_active" boolean DEFAULT true,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_gateway_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"display_name" text NOT NULL,
	"key_id" text,
	"key_secret" text,
	"merchant_id" text,
	"is_active" boolean DEFAULT false,
	"is_test_mode" boolean DEFAULT true,
	"webhook_secret" text,
	"additional_config" jsonb DEFAULT '{}'::jsonb,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "phonepe_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"merchant_transaction_id" text NOT NULL,
	"merchant_user_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'initiated' NOT NULL,
	"payment_state" text,
	"transaction_id" text,
	"payment_instrument_type" text,
	"redirect_url" text,
	"callback_received" boolean DEFAULT false,
	"callback_data" jsonb,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "phonepe_transactions_merchant_transaction_id_unique" UNIQUE("merchant_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "popup_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"image_url" text,
	"link_url" text,
	"trigger_type" text DEFAULT 'login' NOT NULL,
	"show_once" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"weight" text,
	"category_id" integer,
	"images" jsonb DEFAULT '[]'::jsonb,
	"videos" jsonb DEFAULT '[]'::jsonb,
	"ingredients" jsonb DEFAULT '[]'::jsonb,
	"stock" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"hsn_code" text,
	"gst_rate" numeric(5, 2) DEFAULT '5.00',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"featured" boolean DEFAULT false,
	"is_trending" boolean DEFAULT false,
	"is_product_of_day" boolean DEFAULT false,
	"is_chef_special" boolean DEFAULT false,
	"is_trending_local" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"product_id" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"header_draft" jsonb DEFAULT '{}'::jsonb,
	"header_published" jsonb DEFAULT '{}'::jsonb,
	"footer_draft" jsonb DEFAULT '{}'::jsonb,
	"footer_published" jsonb DEFAULT '{}'::jsonb,
	"header_published_at" timestamp,
	"footer_published_at" timestamp,
	"online_payments_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"user_name" text NOT NULL,
	"product_name" text NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text NOT NULL,
	"image_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"featured" boolean DEFAULT false,
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text,
	"email" text,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"password" text,
	"profile_image_url" text,
	"google_id" text,
	"auth_provider" text DEFAULT 'local',
	"role" text DEFAULT 'customer' NOT NULL,
	"admin_id" text,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"profile_completed" boolean DEFAULT false,
	"address_line_1" text,
	"address_line_2" text,
	"area" text,
	"city" text,
	"state" text,
	"pin_code" text,
	"latitude" text,
	"longitude" text,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deletion_reason" text,
	"recovery_deadline" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_admin_id_unique" UNIQUE("admin_id")
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"product_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_payment_config" ADD CONSTRAINT "manual_payment_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_payment_details" ADD CONSTRAINT "manual_payment_details_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_payment_details" ADD CONSTRAINT "manual_payment_details_verified_by_admin_id_users_id_fk" FOREIGN KEY ("verified_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_content" ADD CONSTRAINT "page_content_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_gateway_config" ADD CONSTRAINT "payment_gateway_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phonepe_transactions" ADD CONSTRAINT "phonepe_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popup_banners" ADD CONSTRAINT "popup_banners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;