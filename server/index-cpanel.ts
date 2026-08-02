import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes-mysql";
import { setupVite, serveStatic } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable trust proxy for cPanel hosting
app.set('trust proxy', true);

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Set up Vite for development or serve static files for production
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`Error ${status}: ${message}`);
    console.error(err.stack);
    res.status(status).json({ message });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();