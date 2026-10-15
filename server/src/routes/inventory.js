import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { requireRole } from '../auth.js';
import { ah, HttpError } from '../util.js';
import { notify } from '../notify.js';

const router = Router();
router.use(requireRole('admin'));

const status = (i) => {
  const ratio = i.needed ? i.stock / i.needed : 1;
  return ratio >= 0.9 ? 'ok' : ratio >= 0.6 ? 'low' : 'short';
};

router.get('/', ah(async (req, res) => {
  const { rows } = await q('SELECT * FROM inventory_items ORDER BY category, item');
  res.json({ items: rows.map((i) => ({ ...i, status: status(i) })) });
}));

router.patch('/:id', ah(async (req, res) => {
  const { stock } = z.object({ stock: z.number().int().min(0).max(100000) }).parse(req.body);
  const { rows } = await q('UPDATE inventory_items SET stock = $1 WHERE id = $2 RETURNING *', [stock, req.params.id]);
  if (!rows.length) throw new HttpError(404, 'Item not found');
  const item = { ...rows[0], status: status(rows[0]) };
  if (item.status === 'short') {
    await notify({ role: 'admin', title: 'Supplies are short', body: `${item.item}: ${item.stock} of ${item.needed} ${item.unit}.` });
  }
  res.json({ item });
}));

export default router;
