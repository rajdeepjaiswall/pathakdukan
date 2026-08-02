# Desktop Development Setup for Pathak Bhandar

## Quick Fix for Desktop Issues

The reconnection issues you're experiencing are due to Replit-specific configurations. Here's how to run the app optimally on your desktop:

### Use the Desktop Script
```bash
npm run desktop
```
or
```bash
yarn desktop
```

This command starts the app with desktop-optimized settings:
- Disables Replit-specific features
- Uses localhost instead of 0.0.0.0
- Prevents unnecessary reconnections
- Better error handling

### Environment Setup

1. **Copy Environment Variables**:
```bash
cp .env.local .env
```

2. **Update Database URL** in `.env`:
```
DATABASE_URL=your_actual_database_url
```

### Port Configuration

The app now intelligently detects the environment:
- **Desktop**: Uses `localhost:5000` (more stable)
- **Replit**: Uses `0.0.0.0:5000` (required for Replit)
- **Production**: Uses environment PORT or 5000

### Troubleshooting Connection Issues

If you still experience reconnections:

1. **Use Chrome/Edge** instead of Firefox for better WebSocket support
2. **Disable browser extensions** that might interfere with localhost
3. **Check firewall settings** - allow port 5000
4. **Clear browser cache** and reload

### Development Commands

| Command | Purpose | Best For |
|---------|---------|----------|
| `npm run dev` | Standard development | Replit environment |
| `npm run desktop` | Desktop-optimized | Local PC development |
| `npm run build` | Production build | Deployment |
| `npm run start` | Production server | After build |

### Performance Optimizations Applied

- **Host binding**: Uses localhost for desktop stability
- **Port flexibility**: Avoids port conflicts
- **Error handling**: Graceful degradation instead of crashes
- **HMR optimization**: Better hot module replacement
- **CORS configuration**: Proper cross-origin handling

### Network Configuration

The app automatically detects if it's running in Replit vs desktop and adjusts:
- Network bindings
- Error handling behavior
- Plugin loading
- Port configuration

This should resolve the reconnection issues and provide a much smoother desktop development experience.