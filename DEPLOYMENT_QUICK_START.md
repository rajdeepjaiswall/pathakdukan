# cPanel Deployment - Quick Start Guide

This is a quick reference for deploying Pathak Bhandar to cPanel. For detailed instructions, see `CPANEL_DEPLOYMENT_GUIDE.md`.

## 📦 What You Need

1. cPanel hosting with Node.js support (v18+)
2. Your project files as a ZIP (download from Replit)
3. Fast2SMS API key
4. 30-60 minutes for deployment

## 🚀 Quick Steps

### 1. Database Setup (10 min)
- Create MySQL database in cPanel
- Create database user with all privileges
- Copy SQL from `database-schema-mysql.sql`
- Paste into phpMyAdmin SQL tab
- Run all commands

### 2. File Upload (5 min)
- Upload ZIP to cPanel File Manager
- Extract to `pathak-bhandar` folder
- **Don't upload** `node_modules` or `.git`

### 3. Node.js App Setup (15 min)
- Use "Setup Node.js App" in cPanel
- Set app root: `pathak-bhandar`
- Set startup file: `server/index.ts`
- Add environment variables (see below)
- Run "NPM Install"

### 4. Update Database Code (5 min)
- Edit `server/db.ts` to use MySQL
- See full code in deployment guide

### 5. Start & Test (5 min)
- Start the application
- Visit your domain
- Login as admin
- Test SMS verification

## 🔑 Environment Variables

Add these in cPanel Node.js App settings:

```env
NODE_ENV=production
DATABASE_URL=mysql://username_dbuser:password@localhost:3306/username_dbname
FAST2SMS_API_KEY=your_api_key_here
SESSION_SECRET=your_random_32_char_secret_here
```

## 📝 Database Connection String Format

```
mysql://[username]_[dbuser]:[password]@localhost:3306/[username]_[dbname]
```

Replace:
- `[username]` = Your cPanel username
- `[dbuser]` = Database user you created
- `[password]` = Database password
- `[dbname]` = Database name

## ✅ Quick Checklist

- [ ] MySQL database created
- [ ] SQL schema imported via phpMyAdmin
- [ ] Files uploaded (without node_modules)
- [ ] Node.js app created
- [ ] Environment variables set
- [ ] Dependencies installed (npm install)
- [ ] server/db.ts updated for MySQL
- [ ] App started successfully
- [ ] Website accessible
- [ ] Admin login works
- [ ] SSL installed

## 🐛 Common Issues

**Database connection failed?**
- Check DATABASE_URL format
- Verify user has ALL PRIVILEGES

**App won't start?**
- Check logs for errors
- Verify Node.js version (18+)
- Make sure npm install completed

**Images not loading?**
- Check image URLs in database
- Verify CORS if using external images

**SMS not sending?**
- Verify FAST2SMS_API_KEY is set
- Check API balance
- Verify DLT template approval

## 📚 Files You Need

1. **CPANEL_DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
2. **database-schema-mysql.sql** - Database creation commands
3. **shared/schema-mysql.ts** - MySQL schema definitions

## 🔗 Default Login

- **Username**: pathakji
- **Password**: bhandar123
- **⚠️ Change password immediately after first login!**

## 📞 Need Help?

Refer to the complete deployment guide or check:
- Passenger logs in cPanel
- phpMyAdmin for database issues
- cPanel Error Logs section

---

**Ready to deploy?** Open `CPANEL_DEPLOYMENT_GUIDE.md` for detailed instructions!
