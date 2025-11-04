import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ticketDb } from './server-db.js';

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware to protect routes
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user info to request
  req.user = decoded;
  next();
};

// Create default admin user if no users exist
export const createDefaultAdmin = async () => {
  const users = ticketDb.getAllUsers();
  
  if (users.length === 0) {
    const defaultEmail = 'admin@titantix.com';
    const defaultPassword = 'admin123';
    const hashedPassword = await hashPassword(defaultPassword);
    
    ticketDb.createUser({
      id: 'admin-' + Date.now(),
      email: defaultEmail,
      password: hashedPassword,
      name: 'Admin',
      role: 'admin'
    });
    
    console.log('✅ Default admin user created');
    console.log(`   Email: ${defaultEmail}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log('   ⚠️  Please change the password after first login!');
  }
};
