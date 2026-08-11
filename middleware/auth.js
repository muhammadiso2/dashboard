const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in required.' });
  try {
    req.user = jwt.verify(token, SECRET);
    req.user.role = normalizeRole(req.user.role);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || normalizeRole(req.user.role) !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, username: user.username, role: normalizeRole(user.role) },
    SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { requireAuth, requireAdmin, signToken, SECRET };
