const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

function safe(w) {
  return { id: w.id, name: w.name, username: w.username, role: w.role };
}

router.get('/', (req, res) => {
  res.json({ workers: db.workers.all().map(safe) });
});

router.post('/', (req, res) => {
  const { name, username, password, role } = req.body || {};
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Name, username and password are required.' });
  }
  const list = db.workers.all();
  if (list.some((w) => w.username.toLowerCase() === String(username).trim().toLowerCase())) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }
  const worker = {
    id: db.uid(),
    name: String(name).trim(),
    username: String(username).trim(),
    passwordHash: bcrypt.hashSync(String(password), 10),
    role: role === 'admin' ? 'admin' : 'staff',
  };
  list.push(worker);
  db.workers.save(list);
  res.status(201).json({ worker: safe(worker) });
});

router.delete('/:id', (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You can't remove your own account while signed in." });
  }
  const list = db.workers.all();
  const next = list.filter((w) => w.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ error: 'Worker not found.' });
  db.workers.save(next);
  res.json({ ok: true });
});

module.exports = router;
