import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

//  1. JWT SECRET 
const JWT_SECRET = process.env.JWT_SECRET;

//gemini api key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

//  2. USER SCHEMA & MODEL (Dusra)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  language: { type: String, default: 'English' },
  avatar: { type: String, default: '👤' },
  level: { type: String, default: 'Beginner' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema, 'language_app_users');

// Progress, Achievement, Lesson, Grammar, Vocab schemas
const progressSchema = new mongoose.Schema({
  userId: String,
  module: String,
  score: Number,
  total: Number,
  minutes: Number,
  timestamp: { type: Date, default: Date.now }
});
const Progress = mongoose.model('Progress', progressSchema);

const achievementSchema = new mongoose.Schema({
  userId: String,
  title: String,
  description: String,
  icon: String,
  earned: Boolean,
  earnedAt: Date
});
const Achievement = mongoose.model('Achievement', achievementSchema);

const lessonSchema = new mongoose.Schema({
  title: String,
  topic: String,
  progress: { type: Number, default: 0 },
  level: String,
  exercises: mongoose.Schema.Types.Mixed
});
const Lesson = mongoose.model('Lesson', lessonSchema);

const grammarSchema = new mongoose.Schema({}, { strict: false });
const Grammar = mongoose.model('Grammar', grammarSchema, 'Grammar');

const vocabSchema = new mongoose.Schema({}, { strict: false });
const Vocab = mongoose.model('Vocab', vocabSchema);

// Nodemailer transporter (for forgot password)
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

//  3. AUTH MIDDLEWARE (Teesra)
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};



// MongoDB Connection (SIRF EK BAAR)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

// Routes
app.get("/api/grammar", async (req, res) => {
  try {
    const docs = await Grammar.find();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/vocab", async (req, res) => {
  try {
    const docs = await Vocab.find();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/lessons", async (req, res) => {
  try {
    const lessons = await Lesson.find();
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/lessons/:id", async (req, res) => {
  try {
    const updated = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Lesson not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Progress APIs
app.post('/api/progress', authMiddleware, async (req, res) => {
  try {
    const { module, score, total, minutes } = req.body;
    
    // Ensure minutes is a valid number
    const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.min(minutes, 60)) : 0;
    
    const progress = new Progress({
      userId: String(req.user.userId),
      module: module || 'session', // Default to 'session' for time tracking
      score: score || 0,
      total: total || 0,
      minutes: safeMinutes, // Always include minutes
      timestamp: new Date() // Explicit timestamp
    });
    
    await progress.save();
    res.json({ success: true, message: 'Progress saved!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/progress/me', authMiddleware, async (req, res) => {
  try {
    const progressData = await Progress.find({ userId: String(req.user.userId) });

    const summary = {
      totalLessons: progressData.length,
      totalScore: progressData.reduce((sum, p) => sum + p.score, 0),
      totalPossible: progressData.reduce((sum, p) => sum + p.total, 0),
      byModule: {}
    };

    progressData.forEach(p => {
      if (!summary.byModule[p.module]) {
        summary.byModule[p.module] = { score: 0, total: 0, count: 0 };
      }
      summary.byModule[p.module].score += p.score;
      summary.byModule[p.module].total += p.total;
      summary.byModule[p.module].count += 1;
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update weekly aggregation to handle minutes properly
app.get('/api/progress/me/weekly', authMiddleware, async (req, res) => {
  try {
    const timezone = 'Asia/Karachi';
    const today = new Date();
    const pakToday = new Date(today.toLocaleString('en-US', { timeZone: timezone }));
    const sevenDaysAgo = new Date(pakToday);
    sevenDaysAgo.setDate(pakToday.getDate() - 6);
    
    // Reset times for accurate date comparison
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    // FIXED: Aggregate minutes from ALL entries (not just minutes > 0)
    const weeklyProgress = await Progress.aggregate([
      {
        $match: {
          userId: String(req.user.userId),
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $addFields: {
          // Extract PKT date
          pktDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
              timezone: timezone
            }
          },
          // Ensure minutes field exists (default to 0)
          validMinutes: { $ifNull: ["$minutes", 0] }
        }
      },
      {
        $group: {
          _id: "$pktDate",
          totalMinutes: { $sum: "$validMinutes" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          day: "$_id",
          totalMinutes: { $min: ["$totalMinutes", 1440] }, // Clamp to 24h
          count: 1,
          _id: 0
        }
      },
      { $sort: { day: 1 } }
    ]);

    // Build full week response
    const response = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(pakToday);
      d.setDate(pakToday.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const dayKey = d.toISOString().split('T')[0];
      const jsDay = d.getDay();
      
      // Find matching progress
      const dayProgress = weeklyProgress.find(p => p.day === dayKey);
      
      response.push({
        _id: jsDay === 0 ? 1 : jsDay + 1, // Match your frontend mapping
        day: dayKey,
        label: daysOfWeek[jsDay],
        totalMinutes: dayProgress ? dayProgress.totalMinutes : 0,
        count: dayProgress ? dayProgress.count : 0
      });
    }
    
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/achievements', authMiddleware, async (req, res) => {
  try {
    const { title, description, icon } = req.body;
    const achievement = new Achievement({
      userId: String(req.user.userId),
      title,
      description,
      icon,
      earned: true,
      earnedAt: new Date()
    });
    await achievement.save();
    res.json({ success: true, message: 'Achievement unlocked!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/achievements/me', authMiddleware, async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: String(req.user.userId) });
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ✅ LESSON PROGRESS APIs
app.post('/api/lessons/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    // Update lesson progress
    const updatedLesson = await Lesson.findByIdAndUpdate(
      id,
      { progress },
      { new: true }
    );

    if (!updatedLesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // ✅ Save to progress tracking
    const progressRecord = new Progress({
      userId: String(req.user.userId),
      module: "lesson",
      score: progress,
      total: 100
    });
    await progressRecord.save();

    res.json({
      success: true,
      message: 'Lesson progress saved!',
      lesson: updatedLesson
    });

  } catch (error) {
    console.error("Update lesson progress error:", error);
    res.status(500).json({ error: "Failed to update lesson progress" });
  }
});

// ✅ Get user's lesson progress
app.get('/api/lessons/progress/me', authMiddleware, async (req, res) => {
  try {
    const lessons = await Lesson.find();
    const userProgress = await Progress.find({
      userId: String(req.user.userId),
      module: "lesson"
    });

    const lessonProgress = lessons.map(lesson => {
      const progressRecord = userProgress.find(p =>
        p.score === lesson.progress
      );

      return {
        _id: lesson._id,
        title: lesson.title,
        topic: lesson.topic,
        progress: lesson.progress,
        completed: lesson.progress === 100,
        lastUpdated: progressRecord?.timestamp || null
      };
    });

    res.json(lessonProgress);
  } catch (error) {
    console.error("Get lesson progress error:", error);
    res.status(500).json({ error: "Failed to fetch lesson progress" });
  }
});

//  Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      avatar: '👤',
      language: 'English',
      level: 'Beginner'
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        language: newUser.language,
        level: newUser.level
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

//  Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        language: user.language,
        level: user.level
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


//  Forgot Password Route with Real Email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔵 Forgot password request for:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Security ke liye user exists ya nahi, same response
    const responseMessage = 'If an account exists with this email, a reset link has been sent';

    if (!user) {
      return res.json({
        success: true,
        message: responseMessage
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Frontend URL (Vite default)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    //  Send Real Email
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Glotspeak" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password - Glotspeak',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f9fafb; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #7C3AED, #4F46E5, #0EA5E9); padding: 30px; text-align: center; color: white; }
              .content { padding: 30px; }
              .button { background: linear-gradient(135deg, #F59E0B, #EA580C); color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; margin: 20px 0; }
              .link { word-break: break-all; color: #6B7280; font-size: 14px; background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 15px 0; }
              .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Glotspeak</p>
              </div>
              
              <div class="content">
                <h2 style="color: #1f2937; margin-bottom: 10px;">Hello ${user.name},</h2>
                <p style="color: #4b5563; line-height: 1.6;">You requested to reset your password for your Glotspeak account. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${resetLink}" class="button">Reset Your Password</a>
                </div>
                
                <p style="color: #4b5563; margin: 20px 0;">Or copy and paste this link in your browser:</p>
                <div class="link">${resetLink}</div>
                
                <p style="color: #ef4444; font-size: 14px; margin: 20px 0;">
                  ⚠️ This link will expire in 1 hour for security reasons.
                </p>
                
                <p style="color: #4b5563;">If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">© 2025 Glotspeak. All rights reserved.</p>
                <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated message, please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(' Password reset email sent to:', email);

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Email fail hone par bhi security ke liye success response
    }

    res.json({
      success: true,
      message: responseMessage
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
});

//  Reset Password Route
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    console.log('🔵 Reset password request');

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    //  Verify reset token
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    //  Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    //  Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    //  Update password
    user.password = hashedPassword;
    await user.save();

    console.log('✅Password reset successful for:', user.email);

    res.json({
      success: true,
      message: '✅ Password reset successfully'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset link'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

//  Dark Mode Toggle Route - Server.js mein add karo
app.put('/api/users/:email/darkmode', async (req, res) => {
  try {
    const { email } = req.params;
    const { enabled } = req.body;

    // User ko find karo aur update karo
    const user = await User.findOneAndUpdate(
      { email: email },
      { darkMode: enabled },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Dark mode updated successfully',
      darkMode: user.darkMode
    });

  } catch (error) {
    console.error('Dark mode update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dark mode'
    });
  }
});

// Save progress
app.post('/api/conversation/save-progress', authMiddleware, async (req, res) => {
  try {
    const { scenarioId, messageCount, duration } = req.body;

    const progress = new Progress({
      userId: String(req.user.userId),
      module: `conversation-${scenarioId}`,
      score: messageCount * 10,
      total: 100,
    });

    await progress.save();

    res.json({ success: true, message: 'Progress saved successfully' });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ success: false, error: 'Failed to save progress' });
  }
});

// Root route (for health checks / load balancers that hit /)
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Health Check
app.get("/health", (req, res) => {
  res.send("Server running & DB connected");
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
