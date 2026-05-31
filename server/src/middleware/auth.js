import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash -refreshTokenHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
}

/** Ensure parent can only access their ward's student IDs */
export async function parentStudentGuard(req, res, next) {
  if (req.user.role === 'admin') return next();
  const Parent = (await import('../models/Parent.js')).default;
  const parent = await Parent.findById(req.user.parentId);
  if (!parent) {
    return res.status(403).json({ success: false, message: 'Parent profile not found' });
  }
  req.parentStudentIds = parent.students.map((s) => s.toString());
  next();
}
