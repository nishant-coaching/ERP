import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateResetToken,
} from '../utils/tokens.js';

export async function login(req, res, next) {
  try {
    const { email, password, rememberMe, role } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), role }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const payload = { id: user._id, role: user.role, parentId: user.parentId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload, rememberMe);

    user.refreshTokenHash = hashToken(refreshToken);
    user.rememberMe = !!rememberMe;
    user.lastLogin = new Date();
    await user.save();

    const userObj = await User.findById(user._id);
    res.json({
      success: true,
      data: {
        user: userObj,
        accessToken,
        refreshToken,
        redirect: user.role === 'admin' ? '/admin' : '/parent',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const payload = { id: user._id, role: user.role, parentId: user.parentId };
    const accessToken = signAccessToken(payload);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ success: true, data: req.user });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If account exists, reset link sent' });
    }
    const { token, hash, expires } = generateResetToken();
    user.resetPasswordToken = hash;
    user.resetPasswordExpires = expires;
    await user.save();
    // In production: send email. Dev returns token for testing.
    res.json({
      success: true,
      message: 'If account exists, reset link sent',
      devResetToken: process.env.NODE_ENV !== 'production' ? token : undefined,
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const hash = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+passwordHash');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}
