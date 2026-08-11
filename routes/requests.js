const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// admins see everything, staff see their own only
router.get('/', (req, res) => {
  const all = db.requests.all();
  if (req.user.role === 'admin') return res.json({ requests: all });
  res.json({ requests: all.filter((r) => r.requestedBy === req.user.id) });
});

router.post('/', (req, res) => {
  const { type, payload } = req.body || {};
  if (type !== 'add' && type !== 'delete') {
    return res.status(400).json({ error: 'Unknown request type.' });
  }
  if (type === 'add') {
    const name = String(payload && payload.name || '').trim();
    const price = parseFloat(payload && payload.price) || 0;
    if (!name || price <= 0) {
      return res.status(400).json({ error: 'Give the product a name and a price above zero.' });
    }
  }
  if (type === 'delete') {
    const exists = db.products.all().some((p) => p.id === (payload && payload.id));
    if (!exists) return res.status(404).json({ error: 'That product no longer exists.' });
    const dup = db.requests.all().some(
      (r) => r.type === 'delete' && r.status === 'pending' && r.payload.id === payload.id
    );
    if (dup) return res.status(409).json({ error: 'A removal request for this item is already pending.' });
  }

  const reqObj = {
    id: db.uid(),
    type,
    payload: type === 'add'
      ? {
          name: String(payload.name).trim(),
          price: Math.max(0, parseFloat(payload.price) || 0),
          discount: Math.min(90, Math.max(0, parseFloat(payload.discount) || 0)),
          stock: Math.max(0, parseInt(payload.stock, 10) || 0),
          category: String(payload.category || '').trim() || 'General',
          photo: String(payload.photo || ''),
        }
      : { id: payload.id, name: payload.name, photo: payload.photo || '' },
    requestedBy: req.user.id,
    requestedByName: req.user.name,
    status: 'pending',
    createdAt: Date.now(),
  };
  const list = db.requests.all();
  list.unshift(reqObj);
  db.requests.save(list);
  res.status(201).json({ request: reqObj });
});

router.patch('/:id/approve', requireAdmin, (req, res) => {
  const list = db.requests.all();
  const reqObj = list.find((r) => r.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: 'Request not found.' });
  if (reqObj.status !== 'pending') return res.status(409).json({ error: 'Request already resolved.' });

  if (reqObj.type === 'add') {
    const products = db.products.all();
    products.unshift({ id: db.uid(), ...reqObj.payload, addedBy: reqObj.requestedByName });
    db.products.save(products);
  } else if (reqObj.type === 'delete') {
    const products = db.products.all().filter((p) => p.id !== reqObj.payload.id);
    db.products.save(products);
  }
  reqObj.status = 'approved';
  db.requests.save(list);
  res.json({ request: reqObj });
});

router.patch('/:id/reject', requireAdmin, (req, res) => {
  const list = db.requests.all();
  const reqObj = list.find((r) => r.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: 'Request not found.' });
  if (reqObj.status !== 'pending') return res.status(409).json({ error: 'Request already resolved.' });
  reqObj.status = 'rejected';
  db.requests.save(list);
  res.json({ request: reqObj });
});

module.exports = router;
