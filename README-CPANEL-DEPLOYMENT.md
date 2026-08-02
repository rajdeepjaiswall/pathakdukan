# Pathak Bhandar E-Commerce Platform - cPanel Deployment Guide

## Overview
This guide will help you deploy the Pathak Bhandar e-commerce platform on cPanel hosting with Node.js support.

## Prerequisites
- cPanel hosting account with Node.js support (version 18 or higher)
- PostgreSQL database access
- SSH access (recommended) or File Manager access
- Domain/subdomain configured for the application

## Step 1: Prepare Your Files

### 1.1 Download and Extract
1. Download the project as a ZIP file
2. Extract all files to your local computer
3. Ensure you have all project files including:
   - `package.json`
   - `app.js` (cPanel entry point)
   - `server/` directory
   - `client/` directory
   - `shared/` directory
   - All configuration files

## Step 2: Database Setup

### 2.1 Create PostgreSQL Database
1. Log into your cPanel dashboard
2. Navigate to **Databases** → **PostgreSQL Databases**
3. Create a new database:
   - Database Name: `pathak_bhandar` (or your preferred name)
   - Click **Create Database**

### 2.2 Create Database User
1. In the same PostgreSQL section, create a database user:
   - Username: `pathak_user` (or your preferred username)
   - Password: Create a strong password
   - Click **Create User**

### 2.3 Assign User to Database
1. In the **Add User to Database** section:
   - Select your user and database
   - Grant **ALL PRIVILEGES**
   - Click **Add**

### 2.4 Get Database Connection Details
Note down these details for later:
- Database Host: Usually `localhost` or provided by your host
- Database Port: Usually `5432`
- Database Name: The name you created
- Database User: The username you created
- Database Password: The password you set

### 2.5 Initialize Database Schema
1. Access your database via **phpPgAdmin** or **Adminer** in cPanel
2. Run the following SQL commands to create the required tables:

```sql
-- Users table
CREATE TABLE users (
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
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
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
CREATE TABLE addresses (
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
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist items table
CREATE TABLE wishlist_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
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
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price VARCHAR(20) NOT NULL,
    total VARCHAR(20) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Banners table
CREATE TABLE banners (
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
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);
```

### 2.6 Insert Sample Data
```sql
-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, firstName, lastName, email, role) VALUES 
('pathakji', '$2b$10$YourHashedPasswordHere', 'Pathak', 'Ji', 'admin@pathakbhandar.com', 'admin'),
('rajdeep', '$2b$10$YourHashedPasswordHere', 'Rajdeep', 'Admin', 'rajdeep@pathakbhandar.com', 'super_admin');

-- Insert sample categories
INSERT INTO categories (name, description, image) VALUES 
('Biscuits', 'Traditional and premium biscuits', '/api/logo'),
('Cakes', 'Fresh cakes and pastries', '/api/logo'),
('Sweets', 'Traditional Indian sweets', '/api/logo'),
('Namkeen', 'Savory snacks and namkeen', '/api/logo');

-- Insert sample products
INSERT INTO products (name, description, price, weight, category_id, images, featured) VALUES 
('Chocolate Cookies', 'Premium chocolate chip cookies', '120.00', '250g', 1, ARRAY['/api/logo'], true),
('Vanilla Cake', 'Fresh vanilla sponge cake', '450.00', '500g', 2, ARRAY['/api/logo'], true),
('Gulab Jamun', 'Traditional gulab jamun', '180.00', '500g', 3, ARRAY['/api/logo'], false),
('Mix Namkeen', 'Assorted savory snacks', '95.00', '200g', 4, ARRAY['/api/logo'], false);

-- Insert sample banner
INSERT INTO banners (title, description, image, isActive) VALUES 
('Premium Bakery Collection', 'Discover our premium range of baked goods', '/api/logo', true);
```

## Step 3: Upload Files to cPanel

### 3.1 Using File Manager
1. Log into cPanel
2. Open **File Manager**
3. Navigate to your domain's document root (usually `public_html` or `public_html/subdomain`)
4. Upload the ZIP file
5. Extract all files in the correct directory

### 3.2 Using SSH (Recommended)
```bash
# Connect via SSH
ssh username@yourdomain.com

# Navigate to your domain directory
cd public_html

# Upload files (use SCP or similar)
# Extract if uploaded as ZIP
unzip pathak-bhandar.zip
```

## Step 4: Node.js Application Setup

### 4.1 Access Node.js App Section
1. In cPanel, find **Software** → **Node.js App** (or similar)
2. Click **Create Application**

### 4.2 Configure Application
- **Node.js Version**: Select 18.x or higher
- **Application Mode**: Production
- **Application Root**: Select your domain directory where files are uploaded
- **Application URL**: Your domain or subdomain
- **Application Startup File**: `app.js`

### 4.3 Set Environment Variables
In the Node.js app environment variables section, add:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PGHOST=localhost
PGPORT=5432
PGUSER=your_db_username
PGPASSWORD=your_db_password
PGDATABASE=your_db_name
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key-min-32-chars
```

**Replace the database values with your actual credentials from Step 2.**

## Step 5: Install Dependencies

### 5.1 Access Terminal or SSH
```bash
# Navigate to your application directory
cd /path/to/your/app

# Install dependencies
npm install

# Build the client application
npm run build
```

### 5.2 Via cPanel Terminal (if available)
1. Open **Terminal** in cPanel
2. Navigate to your app directory
3. Run the installation commands above

## Step 6: Configure Web Server

### 6.1 Create .htaccess File
Create a `.htaccess` file in your document root:

```apache
RewriteEngine On

# Handle Node.js application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /app.js [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive on
    ExpiresDefault "access plus 1 month"
</FilesMatch>
```

### 6.2 Update Package.json Scripts
Ensure your `package.json` has the correct scripts:

```json
{
  "scripts": {
    "start": "node app.js",
    "build": "vite build",
    "dev": "NODE_ENV=development tsx server/index.ts"
  }
}
```

## Step 7: Start the Application

### 7.1 Start Node.js App
1. In cPanel Node.js section
2. Click **Start** on your application
3. Monitor the startup logs for any errors

### 7.2 Verify Application
1. Visit your domain/subdomain
2. Check if the application loads correctly
3. Test user registration and login
4. Verify database connectivity

## Step 8: SSL Certificate Setup

### 8.1 Enable SSL
1. In cPanel, go to **Security** → **SSL/TLS**
2. Install or enable Let's Encrypt certificate
3. Force HTTPS redirects

### 8.2 Update Environment Variables
Add to your environment variables:
```
HTTPS=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/private.key
```

## Step 9: Domain Configuration

### 9.1 Point Domain to App
1. Ensure your domain points to the correct directory
2. Update DNS if necessary
3. Configure any subdomains

## Troubleshooting

### Common Issues

#### Database Connection Error
- Verify database credentials in environment variables
- Check PostgreSQL service is running
- Confirm database exists and user has proper permissions

#### Node.js App Won't Start
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review application logs in cPanel

#### Static Files Not Loading
- Ensure build process completed successfully
- Check file permissions
- Verify .htaccess configuration

#### Memory Issues
- Increase Node.js memory limit in cPanel
- Optimize application code
- Contact hosting provider for resource limits

### Log Files
Monitor these log files for issues:
- Node.js application logs (in cPanel)
- Error logs (cPanel → Errors)
- Access logs (cPanel → Raw Access)

## Performance Optimization

### 9.1 Enable Compression
Add to .htaccess:
```apache
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
</IfModule>
```

### 9.2 Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
```

## Security Considerations

### 10.1 Environment Security
- Use strong, unique passwords
- Keep JWT and session secrets secure
- Regularly update dependencies
- Monitor application logs

### 10.2 Database Security
- Use database user with minimal required permissions
- Enable SSL for database connections if available
- Regular database backups

## Backup Strategy

### 10.1 Database Backup
```bash
# Create database backup
pg_dump -h localhost -U username database_name > backup.sql

# Restore from backup
psql -h localhost -U username database_name < backup.sql
```

### 10.2 File Backup
- Regular backup of application files
- Use cPanel backup features
- Store backups off-site

## Support

For technical support:
- Check cPanel hosting documentation
- Contact your hosting provider
- Review application logs for specific errors

---

## Quick Setup Checklist

- [ ] Create PostgreSQL database and user
- [ ] Upload and extract application files
- [ ] Configure Node.js application in cPanel
- [ ] Set environment variables
- [ ] Install dependencies
- [ ] Create .htaccess file
- [ ] Start Node.js application
- [ ] Enable SSL certificate
- [ ] Test application functionality
- [ ] Set up monitoring and backups

---

**Note**: Replace placeholder values (database credentials, domain names, etc.) with your actual values. Test thoroughly in a staging environment before deploying to production.