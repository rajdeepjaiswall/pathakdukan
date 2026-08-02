import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Initialize Google OAuth Strategy
export function initializeGoogleAuth() {
  // Only initialize if Google credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not provided - Google login will be disabled");
    return;
  }

  // Determine the callback URL based on environment
  const getCallbackURL = () => {
    // Priority: explicit override > Replit dev domain > local dev
    if (process.env.GOOGLE_CALLBACK_URL) {
      return process.env.GOOGLE_CALLBACK_URL;
    }
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`;
    }
    // Development fallback
    return `http://localhost:5000/api/auth/google/callback`;
  };

  const callbackURL = getCallbackURL();
  console.log(`Google OAuth callback URL: ${callbackURL}`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists by Google ID
          const existingUser = await storage.getUserByGoogleId(profile.id);
          
          if (existingUser) {
            // Block soft-deleted accounts
            if ((existingUser as any).isDeleted) {
              return done(null, false, { message: 'ACCOUNT_DELETED' } as any);
            }
            // User exists, return user
            return done(null, existingUser);
          }
          
          // Check if user exists by email
          if (profile.emails && profile.emails.length > 0) {
            const emailUser = await storage.getUserByEmail(profile.emails[0].value);
            if (emailUser) {
              // Block soft-deleted accounts
              if ((emailUser as any).isDeleted) {
                return done(null, false, { message: 'ACCOUNT_DELETED' } as any);
              }
              // Link Google ID to existing email account
              const updatedUser = await storage.updateUserGoogleId(emailUser.id, profile.id);
              return done(null, updatedUser);
            }
          }
          
          // Create new user
          const newUser = await storage.createGoogleUser({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
            authProvider: "google",
            role: "customer",
            isVerified: true, // Google accounts are considered verified
            profileCompleted: false, // New Google users need to complete profile
          });
          
          return done(null, newUser);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, undefined);
        }
      }
    )
  );

  // Passport session serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error, false);
    }
  });
}

// Setup session middleware
export function setupSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.CUSTOM_DB_URL || process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "pathak-bakery-session-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow over HTTP for development and HTTPS proxy setups
      maxAge: sessionTtl,
      sameSite: 'lax', // Allow cross-site requests for OAuth callbacks
      domain: undefined, // Don't restrict domain for flexibility
    },
    name: 'pathak.session', // Custom session name
  }));

  app.use(passport.initialize());
  app.use(passport.session());
}

// Google OAuth routes
export function setupGoogleAuthRoutes(app: Express) {
  // Only setup Google routes if credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    // Provide fallback routes that redirect to regular login
    app.get("/api/auth/google", (req, res) => {
      res.redirect("/customer/login?error=google_not_configured");
    });
    
    app.get("/api/auth/google/callback", (req, res) => {
      res.redirect("/customer/login?error=google_not_configured");
    });
    return;
  }

  // Google OAuth login route with user agent detection
  app.get("/api/auth/google", (req, res, next) => {
    // Check if this is from a mobile browser or embedded webview
    const userAgent = req.get('User-Agent') || '';
    const isMobileWebview = /wv|WebView/.test(userAgent);
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobileWebview) {
      // Redirect with error for webview
      return res.redirect("/customer/login?error=mobile_webview");
    }
    
    // Proceed with Google OAuth
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      prompt: "select_account" // Allow account selection
    })(req, res, next);
  });

  // Google OAuth callback route
  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/customer/login" }),
    async (req, res) => {
      try {
        // Check if user needs to complete profile
        const user = req.user as any;
        if (user && !user.profileCompleted) {
          res.redirect("/complete-profile");
        } else {
          res.redirect("/");
        }
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        res.redirect("/customer/login?error=callback_failed");
      }
    }
  );

  // Note: /api/auth/status endpoint is handled in routes.ts to support both JWT and session auth

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}