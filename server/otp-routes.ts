import { Router } from "express";
import { otpService } from "./otp-service";
import { z } from "zod";

const router = Router();

// Validation schemas
const sendOtpSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  type: z.enum(["email", "whatsapp", "sms"], { required_error: "Type must be 'email', 'whatsapp', or 'sms'" }),
  customerName: z.string().optional().default("Customer"),
  purpose: z.string().optional().default("verification")
});

const verifyOtpSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  type: z.enum(["email", "whatsapp", "sms"], { required_error: "Type must be 'email', 'whatsapp', or 'sms'" })
});

const resendOtpSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  type: z.enum(["email", "whatsapp", "sms"], { required_error: "Type must be 'email', 'whatsapp', or 'sms'" }),
  customerName: z.string().optional().default("Customer"),
  purpose: z.string().optional().default("verification")
});

// Send OTP (Email, WhatsApp, or SMS)
router.post("/send-otp", async (req, res) => {
  try {
    const { identifier, type, customerName, purpose } = sendOtpSchema.parse(req.body);

    // Validate email format if type is email
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }
    }

    // Validate phone format if type is whatsapp or sms
    if (type === "whatsapp" || type === "sms") {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(identifier)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format"
        });
      }
    }

    let result;
    if (type === "email") {
      result = await otpService.sendEmailOTP(identifier, purpose);
    } else if (type === "sms") {
      result = await otpService.sendSMSOTP(identifier, customerName, purpose, 'sms');
    } else {
      result = await otpService.sendWhatsAppOTP(identifier, customerName, purpose);
    }

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        type: type,
        expiresIn: "5 minutes"
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }

    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again."
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { identifier, otp, type } = verifyOtpSchema.parse(req.body);

    const result = await otpService.verifyOTP(identifier, otp, type);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        verified: true
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        verified: false
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
        verified: false
      });
    }

    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
      verified: false
    });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { identifier, type, customerName, purpose } = resendOtpSchema.parse(req.body);

    const result = await otpService.resendOTP(identifier, type, customerName, purpose);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        type: type
      });
    } else {
      res.status(result.waitTime ? 429 : 400).json({
        success: false,
        message: result.message,
        waitTime: result.waitTime
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }

    console.error("Resend OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP. Please try again."
    });
  }
});

// Check OTP status (optional - for debugging)
router.post("/otp-status", async (req, res) => {
  try {
    const { identifier, type } = req.body;

    if (!identifier || !type) {
      return res.status(400).json({
        success: false,
        message: "Identifier and type are required"
      });
    }

    // This is a simple status check - you might want to implement this in the service
    res.status(200).json({
      success: true,
      message: "Status check endpoint",
      identifier,
      type
    });

  } catch (error) {
    console.error("OTP Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check OTP status"
    });
  }
});

export default router;