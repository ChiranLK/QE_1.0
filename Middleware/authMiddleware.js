import { verifyJWT } from '../utils/generateToken.js';
import User from '../models/UserModel.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ msg: 'Not authorized, token invalid' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }

    req.user = user; // Attach full user (without password by schema)
    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Not authorized', error: error.message });
  }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: 'Not authorized' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'Forbidden: insufficient role' });
  }

  next();
};
