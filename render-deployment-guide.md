# Render Deployment Guide for Pathak Bhandar

## Render Configuration

Your app is already configured for Render deployment with these commands:

### Build Command:
```bash
yarn build
```

### Start Command:
```bash
yarn start
```

## Current Package.json Scripts:
- `yarn build`: Builds both frontend (Vite) and backend (esbuild)
- `yarn start`: Runs the production server from `dist/index.js`

## Environment Variables for Render

Set these environment variables in your Render dashboard:

### Required:
```
NODE_ENV=production
DATABASE_URL=your_neon_postgres_url
```

### Optional (if using sessions):
```
SESSION_SECRET=your_random_session_secret
```

## Render Service Settings

### Web Service Configuration:
- **Build Command**: `yarn build`
- **Start Command**: `yarn start`
- **Node Version**: 18 or 20
- **Auto-Deploy**: Yes (recommended)

### Environment:
- **Runtime**: Node.js
- **Region**: Choose closest to your users
- **Instance Type**: Starter (free tier) or paid plan

## Database Setup

Your app uses Neon PostgreSQL which is perfect for Render:
1. Your DATABASE_URL is already configured
2. No additional database setup needed on Render
3. Automatic SSL connection handling

## Deployment Steps

1. **Connect Repository**: Link your GitHub/GitLab repo to Render
2. **Configure Service**: 
   - Build: `yarn build`
   - Start: `yarn start`
3. **Set Environment Variables**: Add DATABASE_URL and others
4. **Deploy**: Render will automatically build and deploy

## Port Configuration

Your app automatically uses Render's assigned port via `process.env.PORT` - no changes needed.

## Health Check

Render will automatically check your app's health at the root URL (`/`).

## Build Process

When deployed, Render will:
1. Install dependencies with `yarn install`
2. Run `yarn build` to create production files
3. Start the app with `yarn start`

Your app is fully ready for Render deployment!