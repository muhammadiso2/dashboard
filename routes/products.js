const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function clean(body) {
  return {
    name: String(body.name || '').trim(),
    price: Math.max(0, parseFloat(body.price) || 0),
    discount: Math.min(90, Math.max(0, parseFloat(body.discount) || 0)),
    stock: Math.max(0, parseInt(body.stock, 10) || 0),
    category: String(body.category || '').trim() || 'General',
    photo: String(body.photo || ''),
  };
}

router.get('/', (req, res) => {
  res.json({ products: db.products.all() });
});

router.post('/', requireAdmin, (req, res) => {
  const data = clean(req.body);
  if (!data.name || data.price <= 0) {
    return res.status(400).json({ error: 'Give the product a name and a price above zero.' });
  }
  const product = { id: db.uid(), ...data, addedBy: req.user.name };
  const list = db.products.all();
  list.unshift(product);
  db.products.save(list);
  res.status(201).json({ product });
});

router.put('/:id', requireAdmin, (req, res) => {
  const data = clean(req.body);
  if (!data.name || data.price <= 0) {
    return res.status(400).json({ error: 'Give the product a name and a price above zero.' });
  }
  const list = db.products.all();
  const idx = list.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found.' });
  list[idx] = { ...list[idx], ...data };
  db.products.save(list);
  res.json({ product: list[idx] });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const list = db.products.all();
  const next = list.filter((p) => p.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ error: 'Product not found.' });
  db.products.save(next);
  res.json({ ok: true });
});

module.exports = router;
