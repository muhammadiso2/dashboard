const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const worker = db.workers.all().find(
    (w) => w.username.toLowerCase() === String(username).trim().toLowerCase()
  );
  if (!worker || !bcrypt.compareSync(password, worker.passwordHash)) {
    return res.status(401).json({ error: 'Wrong username or password.' });
  }
  const user = { id: worker.id, name: worker.name, username: worker.username, role: worker.role };
  res.json({ token: signToken(user), user });
});

// returns the current user based on the token, so the frontend can restore a session after refresh
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
