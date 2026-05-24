const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.id, p.user_id, p.title AS name, p.description, p.price, p.image, p.created_at, u.name AS businessName FROM products p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.id, p.user_id, p.title AS name, p.description, p.price, p.image, p.created_at, u.name AS businessName FROM products p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { title, description, price, image } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO products (user_id, title, description, price, image) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, price || 0, image || null]
    );
    const [rows] = await pool.query(
      'SELECT p.id, p.user_id, p.title AS name, p.description, p.price, p.image, p.created_at, u.name AS businessName FROM products p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { title, description, price, image } = req.body;
  try {
    const [existingRows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existingRows.length) return res.status(404).json({ message: 'Not found' });
    const product = existingRows[0];
    if (product.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await pool.query(
      'UPDATE products SET title = ?, description = ?, price = ?, image = ? WHERE id = ?',
      [title || product.title, description || product.description, price ?? product.price, image || product.image, req.params.id]
    );
    const [rows] = await pool.query(
      'SELECT p.id, p.user_id, p.title AS name, p.description, p.price, p.image, p.created_at, u.name AS businessName FROM products p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const [existingRows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existingRows.length) return res.status(404).json({ message: 'Not found' });
    const product = existingRows[0];
    if (product.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
