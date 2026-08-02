#!/usr/bin/env node

/**
 * Pathak Bhandar cPanel Setup Script
 * Run this script after uploading files to automate the setup process
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🍪 Pathak Bhandar E-Commerce Platform - cPanel Setup');
  console.log('=====================================================\n');

  try {
    // Collect database configuration
    console.log('📋 Database Configuration:');
    const dbConfig = {
      host: await question('Database Host (default: localhost): ') || 'localhost',
      port: await question('Database Port (default: 5432): ') || '5432',
      database: await question('Database Name: '),
      username: await question('Database Username: '),
      password: await question('Database Password: ')
    };

    if (!dbConfig.database || !dbConfig.username || !dbConfig.password) {
      throw new Error('Database configuration is incomplete!');
    }

    // Generate secrets
    console.log('\n🔐 Generating Security Keys...');
    const jwtSecret = generateRandomString(64);
    const sessionSecret = generateRandomString(64);

    // Create DATABASE_URL
    const databaseUrl = `postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

    // Create environment configuration
    const envConfig = {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
      PGHOST: dbConfig.host,
      PGPORT: dbConfig.port,
      PGUSER: dbConfig.username,
      PGPASSWORD: dbConfig.password,
      PGDATABASE: dbConfig.database,
      JWT_SECRET: jwtSecret,
      SESSION_SECRET: sessionSecret
    };

    // Write .env file
    console.log('\n📄 Creating environment configuration...');
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created successfully');

    // Create .htaccess file
    console.log('\n🌐 Creating .htaccess configuration...');
    const htaccessContent = `RewriteEngine On

# Handle Node.js application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /app.js [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Cache static assets
<FilesMatch "\\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive on
    ExpiresDefault "access plus 1 month"
    Header set Cache-Control "public, max-age=2592000"
</FilesMatch>

# Compress text files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Prevent access to sensitive files
<FilesMatch "\\.(env|log|sql|md)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Protect Node.js files
<FilesMatch "\\.ts$">
    Order allow,deny
    Deny from all
</FilesMatch>`;

    fs.writeFileSync('.htaccess', htaccessContent);
    console.log('✅ .htaccess file created successfully');

    // Create production package.json script updates
    console.log('\n📦 Updating package.json for production...');
    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Update scripts for production
      packageJson.scripts = {
        ...packageJson.scripts,
        "start": "node app.js",
        "build": "vite build",
        "postinstall": "npm run build"
      };

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ package.json updated for production');
    }

    // Create database initialization script
    console.log('\n🗄️  Creating database initialization script...');
    const dbInitScript = generateDatabaseScript();
    fs.writeFileSync('init-database.sql', dbInitScript);
    console.log('✅ Database initialization script created');

    // Create startup verification script
    console.log('\n🔍 Creating startup verification script...');
    const verifyScript = `#!/usr/bin/env node
/**
 * Verify application setup and connectivity
 */

const { Pool } = require('pg');
const fs = require('fs');

async function verifySetup() {
  console.log('🔍 Verifying Pathak Bhandar setup...\\n');

  // Check environment file
  if (!fs.existsSync('.env')) {
    console.error('❌ .env file not found');
    return false;
  }
  console.log('✅ Environment configuration found');

  // Load environment variables
  require('dotenv').config();

  // Check required environment variables
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(\`❌ Missing required environment variable: \${varName}\`);
      return false;
    }
  }
  console.log('✅ All required environment variables present');

  // Test database connection
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }

  // Check if main application files exist
  const requiredFiles = ['app.js', 'server/index.ts', 'package.json'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(\`❌ Required file missing: \${file}\`);
      return false;
    }
  }
  console.log('✅ All required application files present');

  console.log('\\n🎉 Setup verification complete! Application is ready to start.');
  return true;
}

verifySetup().catch(console.error);`;

    fs.writeFileSync('verify-setup.js', verifyScript);
    console.log('✅ Verification script created');

    // Display summary and next steps
    console.log('\n🎉 Setup Complete!');
    console.log('==================\n');
    console.log('Files created:');
    console.log('• .env - Environment configuration');
    console.log('• .htaccess - Web server configuration');
    console.log('• init-database.sql - Database schema');
    console.log('• verify-setup.js - Setup verification');
    console.log('\nNext Steps:');
    console.log('1. Run the database initialization script in your PostgreSQL database');
    console.log('2. Install dependencies: npm install');
    console.log('3. Verify setup: node verify-setup.js');
    console.log('4. Start the application through cPanel Node.js interface');
    console.log('\nEnvironment Variables for cPanel:');
    console.log('Copy these to your Node.js app environment variables section:');
    console.log('─'.repeat(60));
    Object.entries(envConfig).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateDatabaseScript() {
  return `-- Pathak Bhandar E-Commerce Database Schema
-- Run this script in your PostgreSQL database

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS wishlist_items CASCADE;
-- DROP TABLE IF EXISTS cart_items CASCADE;
-- DROP TABLE IF EXISTS addresses CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS banners CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer',
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price VARCHAR(20) NOT NULL,
    weight VARCHAR(50),
    category_id INTEGER REFERENCES categories(id),
    images TEXT[],
    videos TEXT[],
    stock INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    addressLine1 TEXT NOT NULL,
    addressLine2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    landmark TEXT,
    isDefault BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist items table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    orderNumber VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    subtotal VARCHAR(20) NOT NULL,
    gstAmount VARCHAR(20) DEFAULT '0',
    deliveryCharge VARCHAR(20) DEFAULT '0',
    total VARCHAR(20) NOT NULL,
    paymentMethod VARCHAR(50) NOT NULL,
    paymentStatus VARCHAR(50) DEFAULT 'pending',
    deliveryAddress JSONB NOT NULL,
    notes TEXT,
    rider_name TEXT,
    rider_phone TEXT,
    estimatedDelivery TIMESTAMP,
    deliveryDate TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price VARCHAR(20) NOT NULL,
    total VARCHAR(20) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    link VARCHAR(500),
    isActive BOOLEAN DEFAULT true,
    sortOrder INTEGER DEFAULT 0,
    startDate TIMESTAMP,
    endDate TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for authentication)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- Insert default admin users
-- SECURITY: Admin accounts must be created manually with secure passwords
-- Run these commands manually after setup with your chosen secure passwords:
-- 
-- INSERT INTO users (username, password, firstName, lastName, email, role) VALUES 
-- ('pathakji', '[BCRYPT_HASH_OF_SECURE_PASSWORD]', 'Pathak', 'Ji', 'admin@pathakbhandar.com', 'admin'),
-- ('rajdeep', '[BCRYPT_HASH_OF_SECURE_PASSWORD]', 'Rajdeep', 'Admin', 'rajdeep@pathakbhandar.com', 'super_admin')
-- ON CONFLICT (username) DO NOTHING;
--
-- To generate bcrypt hash: const bcrypt = require('bcrypt'); bcrypt.hashSync('your_secure_password', 10);

-- Insert sample categories
INSERT INTO categories (name, description, image) VALUES 
('Biscuits', 'Traditional and premium biscuits', '/api/logo'),
('Cakes', 'Fresh cakes and pastries', '/api/logo'),
('Sweets', 'Traditional Indian sweets', '/api/logo'),
('Namkeen', 'Savory snacks and namkeen', '/api/logo'),
('Bread', 'Fresh baked bread and rolls', '/api/logo'),
('Cookies', 'Variety of cookies and crackers', '/api/logo')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, weight, category_id, images, featured, stock) VALUES 
('Chocolate Cookies', 'Premium chocolate chip cookies made with finest ingredients', '120.00', '250g', 1, ARRAY['/api/logo'], true, 50),
('Vanilla Sponge Cake', 'Fresh vanilla sponge cake perfect for celebrations', '450.00', '500g', 2, ARRAY['/api/logo'], true, 20),
('Gulab Jamun', 'Traditional gulab jamun made with khoya', '180.00', '500g', 3, ARRAY['/api/logo'], false, 30),
('Mix Namkeen', 'Assorted savory snacks perfect for tea time', '95.00', '200g', 4, ARRAY['/api/logo'], false, 40),
('Whole Wheat Bread', 'Fresh baked whole wheat bread', '35.00', '400g', 5, ARRAY['/api/logo'], true, 25),
('Butter Cookies', 'Crispy butter cookies with a melt-in-mouth texture', '85.00', '200g', 6, ARRAY['/api/logo'], false, 35)
ON CONFLICT DO NOTHING;

-- Insert sample banner
INSERT INTO banners (title, description, image, isActive, sortOrder) VALUES 
('Premium Bakery Collection', 'Discover our premium range of freshly baked goods', '/api/logo', true, 1),
('Special Festival Offers', 'Get special discounts on festival orders', '/api/logo', true, 2)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_username;

-- Verify installation
SELECT 'Database schema created successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as banner_count FROM banners;`;
}

if (require.main === module) {
  main();
}

module.exports = { main, generateRandomString, generateDatabaseScript };