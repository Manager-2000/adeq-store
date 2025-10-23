import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import your existing modules
import connectDB from "./config/database.js";
import User from "./models/User.js";

// Add these lines for __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ ADD THIS LINE - Data directory path
const dataDir = path.join(__dirname, "public", "data");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ INCREASE PAYLOAD LIMITS - Add these lines:
app.use(express.json({ limit: "10mb" })); // 10MB for JSON
app.use(express.urlencoded({ limit: "10mb", extended: true })); // 10MB for URL-encoded
app.use(bodyParser.json({ limit: "10mb" })); // 10MB for bodyParser

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// JWT Secret Key (use environment variable in production)
const JWT_SECRET =
  process.env.JWT_SECRET || "adeq-water-solutions-secret-key-2024";

// Setup Nodemailer transporter with environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "adeqtesting@gmail.com",
    pass: process.env.EMAIL_PASS || "dycg fklc oxvg gpfs",
  },
});

// Log email configuration (without showing full password)
console.log("📧 Email configuration:", {
  user: process.env.EMAIL_USER || "adeqtesting@gmail.com",
  service: "gmail",
  hasPassword: !!process.env.EMAIL_PASS,
});

//Helper function to read JSON files
const readJSONFile = (filename) => {
  try {
    const filePath = path.join(dataDir, filename); // ✅ Use dataDir
    if (!fs.existsSync(filePath)) {
      return getDefaultData(filename);
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return getDefaultData(filename);
  }
};

// Helper function to write JSON files
const writeJSONFile = (filename, data) => {
  try {
    const filePath = path.join(dataDir, filename); // ✅ Use dataDir

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

// Default data structures
const getDefaultData = (filename) => {
  const defaults = {
    "hero.json": { slides: [] },
    "services.json": { services: [] },
    "equipment.json": { equipment: [] },
    "projects.json": { projects: [] },
    "testimonials.json": { testimonials: [] },
    "contact.json": {
      contact: {
        address: "155 Gbagba Area, Airport Road, Ilorin Kwara State.",
        phones: ["+234 810 423 7317", "+234 811 427 5025"],
        emails: ["info@adeqintegrated.com", "support@adeqintegrated.com"],
        hours: {
          weekdays: "Monday - Friday: 8am - 6pm",
          saturday: "Saturday: 9am - 2pm",
        },
      },
    },
    "booking.json": {
      surveyTypes: [
        {
          value: "residential",
          label: "Residential Water Survey",
          price: 50000,
        },
        {
          value: "commercial",
          label: "Commercial Water Survey",
          price: 100000,
        },
        { value: "mining", label: "Mining Survey", price: 150000 },
        {
          value: "borehole",
          label: "Borehole Drilling Consultation",
          price: 25000,
        },
      ],
    },
  };
  return defaults[filename] || {};
};

// ==================== MONGODB AUTHENTICATION ROUTES ====================

// Register User
app.post("/api/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      verificationCode,
    });

    await user.save();

    console.log(`✅ New user registered: ${email}`);

    // Send verification email
    try {
      const mailOptions = {
        from: "ADEQ Water Solutions <adeqtesting@gmail.com>",
        to: email,
        subject: "Verify Your Email Address - ADEQ Water Solutions",
        html: `
          <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
            <h2 style="color:#0e7490; text-align:center;">ADEQ Water Solutions</h2>
            
            <div style="background:#f0f9ff; padding:20px; border-radius:8px; margin:20px 0;">
              <h3 style="color:#0e7490; margin-top:0;">Email Verification</h3>
              <p>Hello <strong>${firstName}</strong>, thank you for registering with ADEQ Water Solutions!</p>
              <p>Your verification code is:</p>
              <div style="text-align:center; margin:20px 0;">
                <div style="display:inline-block; background:#0e7490; color:white; padding:15px 30px; border-radius:8px; font-size:28px; font-weight:bold; letter-spacing:3px;">
                  ${verificationCode}
                </div>
              </div>
              <p>Enter this code in the verification form to complete your registration.</p>
              <p style="font-size:12px; color:#666; margin-top:20px;">If you didn't request this code, please ignore this email.</p>
            </div>
            
            <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
              <p style="color:#666; font-size:14px;">Thank you for choosing ADEQ Water Solutions</p>
              <p style="color:#999; font-size:12px;">Ilorin, Kwara State, Nigeria</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for verification code.",
      userId: user._id,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});

// Verify Email
app.post("/api/auth/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email, verificationCode: code });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Update user as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Email verified successfully!",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
});

// Login User
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});

// Forgot Password
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("🔍 Forgot password request for:", email);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(400).json({
        success: false,
        message: "No user found with this email",
      });
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    console.log("✅ Reset code generated and saved to user:", resetCode);

    // Send reset email
    try {
      const mailOptions = {
        from: "ADEQ Water Solutions <adeqtesting@gmail.com>",
        to: email,
        subject: "Password Reset Request - ADEQ Water Solutions",
        html: `
          <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
            <h2 style="color:#0e7490; text-align:center;">ADEQ Water Solutions</h2>
            
            <div style="background:#f0f9ff; padding:20px; border-radius:8px; margin:20px 0;">
              <h3 style="color:#0e7490; margin-top:0;">Password Reset Request</h3>
              <p>Hello <strong>${user.firstName}</strong>,</p>
              <p>We received a request to reset your password for your ADEQ Water Solutions account.</p>
              <p>Your password reset code is:</p>
              <div style="text-align:center; margin:20px 0;">
                <div style="display:inline-block; background:#0e7490; color:white; padding:15px 30px; border-radius:8px; font-size:28px; font-weight:bold; letter-spacing:3px;">
                  ${resetCode}
                </div>
              </div>
              <p>Enter this code in the password reset form to create a new password.</p>
              <p style="font-size:12px; color:#666; margin-top:20px;">If you didn't request a password reset, please ignore this email.</p>
            </div>
            
            <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
              <p style="color:#666; font-size:14px;">ADEQ Water Solutions</p>
              <p style="color:#999; font-size:12px;">Ilorin, Kwara State, Nigeria</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error("❌ Failed to send password reset email:", emailError);
    }

    res.json({
      success: true,
      message: "Password reset code sent to your email",
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request. Please try again.",
    });
  }
});

// Reset Password - SIMPLIFIED (MongoDB is working)
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    console.log("🔍 Reset password attempt:", {
      email: email,
      code: code,
      newPasswordLength: newPassword?.length,
    });

    if (!email || !code || !newPassword) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Find user with valid reset code
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }, // Check if code hasn't expired
    });

    console.log("👤 User found for password reset:", user ? "Yes" : "No");

    if (!user) {
      console.log("❌ Invalid or expired reset code");

      // Additional debugging to see why it failed
      const userWithEmail = await User.findOne({ email: email.toLowerCase() });
      if (userWithEmail) {
        console.log("🔍 User exists but:", {
          hasResetCode: !!userWithEmail.resetPasswordCode,
          storedCode: userWithEmail.resetPasswordCode,
          codeMatches: userWithEmail.resetPasswordCode === code,
          isExpired: userWithEmail.resetPasswordExpires <= Date.now(),
          expiresAt: new Date(userWithEmail.resetPasswordExpires),
        });
      } else {
        console.log("🔍 No user found with email:", email);
      }

      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    console.log("✅ Code verified, updating password for:", email);

    // Update password (this will trigger the pre-save hook to hash it)
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log("✅ Password reset successfully for:", email);

    res.json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Password reset failed. Please try again.",
    });
  }
});

// Get User Profile (Protected route)
app.get("/api/auth/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("❌ Profile error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

// Check if user exists (for frontend validation)
app.get("/api/auth/check-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });

    res.json({
      exists: !!user,
    });
  } catch (error) {
    console.error("❌ Check email error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking email",
    });
  }
});

// ==================== EXISTING CONTENT ROUTES ====================

// GET Routes for all content types
app.get("/api/hero", (req, res) => {
  const data = readJSONFile("hero.json");
  res.json(data);
});

app.get("/api/services", (req, res) => {
  const data = readJSONFile("services.json");
  res.json(data);
});

app.get("/api/equipment", (req, res) => {
  const data = readJSONFile("equipment.json");
  res.json(data);
});

app.get("/api/projects", (req, res) => {
  const data = readJSONFile("projects.json");
  res.json(data);
});

app.get("/api/testimonials", (req, res) => {
  const data = readJSONFile("testimonials.json");
  res.json(data);
});

app.get("/api/contact", (req, res) => {
  const data = readJSONFile("contact.json");
  res.json(data);
});

app.get("/api/booking", (req, res) => {
  const data = readJSONFile("booking.json");
  res.json(data);
});

// ADMIN UPDATE Routes
app.put("/api/admin/hero", (req, res) => {
  if (writeJSONFile("hero.json", req.body)) {
    res.json({ success: true, message: "Hero data updated successfully" });
  } else {
    res.status(500).json({ error: "Failed to update hero data" });
  }
});

app.put("/api/admin/services", (req, res) => {
  if (writeJSONFile("services.json", req.body)) {
    res.json({ success: true, message: "Services updated successfully" });
  } else {
    res.status(500).json({ error: "Failed to update services" });
  }
});

app.put("/api/admin/equipment", (req, res) => {
  if (writeJSONFile("equipment.json", req.body)) {
    res.json({ success: true, message: "Equipment updated successfully" });
  } else {
    res.status(500).json({ error: "Failed to update equipment" });
  }
});

app.put("/api/admin/projects", (req, res) => {
  if (writeJSONFile("projects.json", req.body)) {
    res.json({ success: true, message: "Projects updated successfully" });
  } else {
    res.status(500).json({ error: "Failed to update projects" });
  }
});

app.put("/api/admin/testimonials", (req, res) => {
  console.log("📥 Received testimonial update:", req.body);

  if (writeJSONFile("testimonials.json", req.body)) {
    console.log("✅ Testimonials saved to file");
    res.json({ success: true, message: "Testimonials updated successfully" });
  } else {
    console.error("❌ Failed to save testimonials");
    res.status(500).json({ error: "Failed to update testimonials" });
  }
});

app.put("/api/admin/contact", (req, res) => {
  if (writeJSONFile("contact.json", req.body)) {
    res.json({ success: true, message: "Contact info updated successfully" });
  } else {
    res.status(500).json({ error: "Failed to update contact info" });
  }
});

app.put("/api/admin/booking", (req, res) => {
  if (writeJSONFile("booking.json", req.body)) {
    res.json({
      success: true,
      message: "Booking options updated successfully",
    });
  } else {
    res.status(500).json({ error: "Failed to update booking options" });
  }
});

// ==================== YOUR EXISTING ROUTES (UNCHANGED) ====================

// Your existing services API routes (keep for backward compatibility)

app.get("/api/services", (req, res) => {
  try {
    const servicesData = readJSONFile("services.json"); // ✅ Use helper
    res.json(servicesData);
  } catch (error) {
    console.error("Error loading services:", error);
    res.status(500).json({ error: "Failed to load services" });
  }
});

// API to update services data
app.post("/api/services/update", (req, res) => {
  try {
    const { services } = req.body;
    if (writeJSONFile("services.json", { services })) {
      // ✅ Use helper
      res.json({ success: true, message: "Services updated successfully" });
    } else {
      res.status(500).json({ error: "Failed to update services" });
    }
  } catch (error) {
    console.error("Error updating services:", error);
    res.status(500).json({ error: "Failed to update services" });
  }
});

app.get("/api/equipment", (req, res) => {
  try {
    const equipmentData = readJSONFile("equipment.json");
    res.json(equipmentData);
  } catch (error) {
    console.error("Error loading equipment:", error);
    res.status(500).json({ error: "Failed to load equipment" });
  }
});

app.post("/api/equipment/update", (req, res) => {
  try {
    const { equipment } = req.body;
    if (writeJSONFile("equipment.json", { equipment })) {
      res.json({ success: true, message: "Equipment updated successfully" });
    } else {
      res.status(500).json({ error: "Failed to update equipment" });
    }
  } catch (error) {
    console.error("Error updating equipment:", error);
    res.status(500).json({ error: "Failed to update equipment" });
  }
});

// Your existing email routes (unchanged)
app.post("/send-email", async (req, res) => {
  console.log("📧 Received email request:", req.body);

  const {
    reference,
    name,
    email,
    phone,
    service,
    amount,
    quantity,
    paymentType,
    location,
    date,
    details,
    orderDetails,
  } = req.body;

  if (!email || !service) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required data" });
  }

  // Check if this is an equipment purchase
  const isEquipmentPurchase =
    service === "Equipment Purchase" && Array.isArray(orderDetails);

  // 1. EMAIL TO CUSTOMER - SIMPLIFIED AND FIXED
  let customerSubject = "";
  let customerHtml = "";

  if (isEquipmentPurchase) {
    // Equipment purchase email template
    customerSubject = `Order Confirmation - ${reference}`;
    customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
        <h2 style="color:#0e7490; text-align:center;">ADEQ Water Solutions</h2>
        
        <div style="background:#f0f9ff; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="color:#0e7490; margin-top:0;">Order Confirmed! ✅</h3>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for your equipment purchase! Your order has been confirmed.</p>
        </div>

        <h3 style="color:#0e7490;">Order Details:</h3>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Reference Number:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${reference}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Order Type:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">Equipment Purchase</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Items:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">
              <ul style="margin:0; padding-left:20px;">
                ${orderDetails
                  .map(
                    (item) => `
                  <li><strong>${item.product}</strong> - Quantity: ${
                      item.quantity
                    } - Price: ₦${(
                      item.price * item.quantity
                    ).toLocaleString()}</li>
                `
                  )
                  .join("")}
              </ul>
            </td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Total Amount:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Phone:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${phone}</td>
          </tr>
        </table>

        <div style="background:#f0f9ff; padding:15px; border-radius:8px; margin:20px 0;">
          <h4 style="color:#0e7490; margin-top:0;">Next Steps:</h4>
          <p>Your equipment will be prepared for shipping. We will contact you within <strong>24 hours</strong> with shipping details.</p>
          <p>If you have any questions, please contact us at <strong>+234 810 423 7317</strong>.</p>
        </div>

        <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
          <p style="color:#666; font-size:14px;">Thank you for choosing ADEQ Water Solutions</p>
          <p style="color:#999; font-size:12px;">Ilorin, Kwara State, Nigeria</p>
        </div>
      </div>
    `;
  } else {
    // Survey booking email template
    customerSubject = `Booking Confirmation - ${reference}`;
    const totalAmount = paymentType === "half" ? amount * 2 : amount;

    customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
        <h2 style="color:#0e7490; text-align:center;">ADEQ Water Solutions</h2>
        
        <div style="background:#f0f9ff; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="color:#0e7490; margin-top:0;">Booking Confirmed! ✅</h3>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for your ${
            paymentType === "half" ? "50% deposit" : "full payment"
          }! Your booking has been confirmed.</p>
        </div>

        <h3 style="color:#0e7490;">Booking Details:</h3>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Reference Number:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${reference}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Service:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${service}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Quantity:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${
              quantity || 1
            }</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Payment Type:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${
              paymentType === "half" ? "50% Deposit" : "Full Payment"
            }</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Amount ${
              paymentType === "half" ? "Deposited" : "Paid"
            }:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">₦${amount.toLocaleString()}</td>
          </tr>
          ${
            paymentType === "half"
              ? `
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Remaining Balance:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">₦${amount.toLocaleString()}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Total Amount:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">₦${totalAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Phone:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${phone}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Location:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${location}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Preferred Date:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${date}</td>
          </tr>
          ${
            details
              ? `
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Details:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${details}</td>
          </tr>
          `
              : ""
          }
        </table>

        <div style="background:#f0f9ff; padding:15px; border-radius:8px; margin:20px 0;">
          <h4 style="color:#0e7490; margin-top:0;">Next Steps:</h4>
          <p>Our team will contact you within <strong>24 hours</strong> to confirm your booking details and schedule.</p>
          <p>If you have any questions, please contact us at <strong>+234 810 423 7317</strong>.</p>
        </div>

        <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
          <p style="color:#666; font-size:14px;">Thank you for choosing ADEQ Water Solutions</p>
          <p style="color:#999; font-size:12px;">Ilorin, Kwara State, Nigeria</p>
        </div>
      </div>
    `;
  }

  // 2. EMAIL TO OWNER - SIMPLIFIED AND FIXED
  let ownerSubject = "";
  let ownerHtml = "";

  if (isEquipmentPurchase) {
    ownerSubject = `🚨 NEW EQUIPMENT ORDER - ${reference}`;
    ownerHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
        <h2 style="color:#dc2626; text-align:center;">NEW EQUIPMENT ORDER! 🚨</h2>
        
        <div style="background:#fef2f2; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="color:#dc2626; margin-top:0;">Equipment Order Details</h3>
          
          <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Reference:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${reference}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Customer:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Email:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${email}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Phone:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${phone}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Order Type:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">Equipment Purchase</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Items:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">
                <ul style="margin:0; padding-left:20px;">
                  ${orderDetails
                    .map(
                      (item) => `
                    <li><strong>${item.product}</strong> - Quantity: ${
                        item.quantity
                      } - Price: ₦${(
                        item.price * item.quantity
                      ).toLocaleString()}</li>
                  `
                    )
                    .join("")}
                </ul>
              </td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Total Amount:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">₦${amount.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background:#f0f9ff; padding:15px; border-radius:8px; margin:20px 0;">
          <h4 style="color:#0e7490; margin-top:0;">Action Required:</h4>
          <p>Please prepare the equipment for shipping and contact the customer within 24 hours.</p>
          <p><strong>Customer Phone:</strong> ${phone}</p>
          <p><strong>Customer Email:</strong> ${email}</p>
        </div>
      </div>
    `;
  } else {
    ownerSubject = `🚨 NEW BOOKING: ${service} - ${reference}`;
    const totalAmount = paymentType === "half" ? amount * 2 : amount;

    ownerHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
        <h2 style="color:#dc2626; text-align:center;">NEW BOOKING: ${service} - ${reference}</h2>
        
        <div style="background:#fef2f2; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="color:#dc2626; margin-top:0;">Customer Booking Details</h3>
          
          <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Reference:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${reference}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Customer:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Email:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${email}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Phone:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${phone}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Service:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${service}</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Quantity:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${
                quantity || 1
              }</td>
            </tr>
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Payment Type:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${
                paymentType === "half" ? "50% Deposit" : "Full Payment"
              }</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Amount Received:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Total Amount:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">₦${totalAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Location:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${location}</td>
          </tr>
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Preferred Date:</td>
            <td style="padding:10px; border-bottom:1px solid #eee;">${date}</td>
          </tr>
          ${
            details
              ? `
            <tr>
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:bold;">Details:</td>
              <td style="padding:10px; border-bottom:1px solid #eee;">${details}</td>
            </tr>
            `
              : ""
          }
        </table>
      </div>

      <div style="background:#f0f9ff; padding:15px; border-radius:8px; margin:20px 0;">
        <h4 style="color:#0e7490; margin-top:0;">Action Required:</h4>
        <p>Please contact the customer within 24 hours to confirm the booking schedule.</p>
        <p><strong>Customer Phone:</strong> ${phone}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
      </div>
    </div>
  `;
  }

  const customerMailOptions = {
    from: "ADEQ Water Solutions <adeqtesting@gmail.com>",
    to: email,
    subject: customerSubject,
    html: customerHtml,
  };

  const ownerMailOptions = {
    from: "ADEQ Booking System <adeqtesting@gmail.com>",
    to: "adeqtesting@gmail.com", // Your actual business email
    subject: ownerSubject,
    html: ownerHtml,
  };

  try {
    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(ownerMailOptions),
    ]);

    console.log("✅ Emails sent successfully!");
    console.log("📧 Customer email sent to:", email);
    console.log("📧 Owner email sent to: adeqtesting@gmail.com");

    res.json({
      success: true,
      message: "Confirmation emails sent successfully",
    });
  } catch (error) {
    console.error("❌ Email Error:", error);
    res.json({
      success: true, // Still return success so payment doesn't fail
      message:
        "Payment successful! There was an issue with email notifications, but we will contact you shortly.",
      emailError: true,
    });
  }
});

//Verification Email Route
app.post("/api/send-verification", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Missing email or code" });
  }

  try {
    const mailOptions = {
      from: "ADEQ Water Solutions <adeqtesting@gmail.com>",
      to: email,
      subject: "Verify Your Email Address - ADEQ Water Solutions",
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
          <h2 style="color:#0e7490; text-align:center;">ADEQ Water Solutions</h2>
          
          <div style="background:#f0f9ff; padding:20px; border-radius:8px; margin:20px 0;">
            <h3 style="color:#0e7490; margin-top:0;">Email Verification</h3>
            <p>Thank you for registering with ADEQ Water Solutions!</p>
            <p>Your verification code is:</p>
            <div style="text-align:center; margin:20px 0;">
              <div style="display:inline-block; background:#0e7490; color:white; padding:15px 30px; border-radius:8px; font-size:28px; font-weight:bold; letter-spacing:3px;">
                ${code}
              </div>
            </div>
            <p>Enter this code in the verification form to complete your registration.</p>
            <p style="font-size:12px; color:#666; margin-top:20px;">If you didn't request this code, please ignore this email.</p>
          </div>
          
          <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
            <p style="color:#666; font-size:14px;">Thank you for choosing ADEQ Water Solutions</p>
            <p style="color:#999; font-size:12px;">Ilorin, Kwara State, Nigeria</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    res.json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send verification email" });
  }
});

// ✅ Enhanced Password Reset Email Route
app.post("/api/send-password-reset", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Missing email or code" });
  }

  try {
    const mailOptions = {
      from: "ADEQ Water Solutions <adeqtesting@gmail.com>",
      to: email,
      subject: "Password Reset Request - ADEQ Water Solutions",
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
          <h2 style="color:#0e7490; text-align:center;">ADEQ Water Solutions</h2>
          
          <div style="background:#f0f9ff; padding:20px; border-radius:8px; margin:20px 0;">
            <h3 style="color:#0e7490; margin-top:0;">Password Reset Request</h3>
            <p>We received a request to reset your password for your ADEQ Water Solutions account.</p>
            <p>Your password reset code is:</p>
            <div style="text-align:center; margin:20px 0;">
              <div style="display:inline-block; background:#0e7490; color:white; padding:15px 30px; border-radius:8px; font-size:28px; font-weight:bold; letter-spacing:3px;">
                ${code}
              </div>
            </div>
            <p>Enter this code in the password reset form to create a new password.</p>
            <p style="font-size:12px; color:#666; margin-top:20px;">If you didn't request a password reset, please ignore this email.</p>
          </div>
          
          <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
            <p style="color:#666; font-size:14px;">ADEQ Water Solutions</p>
            <p style="color:#999; font-size:12px;">Ilorin, Kwara State, Nigeria</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    res.json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send password reset email" });
  }
});

// ==================== STATIC FILE SERVING ====================

// Serve main pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Serve specific folders explicitly
app.use("/js", express.static(path.join(__dirname, "public", "js")));
app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));
app.use("/data", express.static(path.join(__dirname, "public", "data")));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔐 MongoDB Authentication routes are active`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
