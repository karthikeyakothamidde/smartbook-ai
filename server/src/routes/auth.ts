import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'smartbook_super_secret_hackathon_token';

// Register User
router.post('/register', async (req: any, res: Response) => {
  const { email, password, name, role, phone, skills, bio } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'Missing required fields: email, password, name, role' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role.toUpperCase(); // CUSTOMER, EMPLOYEE, ADMIN

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        phone
      }
    });

    // If role is EMPLOYEE, create their Employee profile
    if (userRole === 'EMPLOYEE') {
      await prisma.employee.create({
        data: {
          userId: user.id,
          skills: skills || 'General Booking',
          bio: bio || 'Professional staff member at SmartBook AI.',
          rating: 5.0,
          experienceYears: 2,
          active: true,
          // Set default working hours (Monday to Friday, 9:00 to 17:00)
          availability: {
            create: [1, 2, 3, 4, 5].map(day => ({
              dayOfWeek: day,
              startTime: '09:00',
              endTime: '17:00',
              isClosed: false
            }))
          }
        }
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Login User
router.post('/login', async (req: any, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Mock Google Login
router.post('/google-login', async (req: any, res: Response) => {
  const { email, name, googleId } = req.body;

  if (!email || !name || !googleId) {
    return res.status(400).json({ message: 'Google data missing' });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create user with a dummy password
      const dummyPassword = await bcrypt.hash(Math.random().toString(36).substring(2), 10);
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          password: dummyPassword,
          role: 'CUSTOMER'
        }
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        employeeProfile: {
          include: {
            availability: true,
            leaves: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Current User Profile
router.put('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { name, email, phone, password, bio, skills } = req.body;

  try {
    const updateData: any = {
      name,
      email,
      phone
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true
      }
    });

    // If EMPLOYEE, update their employee profile fields (bio, skills)
    if (req.user.role === 'EMPLOYEE') {
      await prisma.employee.update({
        where: { userId: req.user.id },
        data: {
          bio,
          skills
        }
      });
    }

    return res.json(updatedUser);
  } catch (error: any) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: 'Failed to update profile: ' + error.message });
  }
});

// Forgot Password Request (Generate OTP)
router.post('/forgot-password', async (req: any, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return a standard response for security, but flag that it doesn't exist
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Generate 6-digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpires: expires
      }
    });

    console.log(`[PASS RESET OTP FOR ${email}]: ${otp}`);

    return res.json({
      message: 'A password reset code has been sent to your email.',
      status: 'success',
      otp // Return OTP so frontend can show a Mock Inbox Toast
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset Password (Verify OTP and Update Password)
router.post('/reset-password', async (req: any, res: Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Check if expired
    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP code has expired' });
    }

    // Check if match
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null
      }
    });

    return res.json({ message: 'Password has been reset successfully. Please log in.' });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

