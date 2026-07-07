const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const migrationData = require('../migration-data.json');

router.get('/admin/seed', async (req, res) => {
  if (req.query.secret !== process.env.SEED_SECRET) {
    return res.status(403).send('Forbidden');
  }

  const usersSnap = await db.collection('users').limit(1).get();
  if (!usersSnap.empty) {
    return res.send('Already seeded. Users collection is not empty, skipping.');
  }

  const summary = { users: 0, farmers: 0, entries: 0 };

  for (const u of migrationData.users) {
    await db.collection('users').add({
      username: u.username,
      password: u.password,
      full_name: u.full_name
    });
    summary.users++;
  }

  const farmerIdMap = {};
  for (const f of migrationData.farmers) {
    const ref = await db.collection('farmers').add({
      name: f.name,
      mobile: (f.mobile || '').trim(),
      address: f.address || '',
      created_at: new Date(f.created_at).toISOString()
    });
    farmerIdMap[f.id] = ref.id;
    summary.farmers++;
  }

  for (const e of migrationData.entries) {
    const newFarmerId = farmerIdMap[e.farmer_id];
    if (!newFarmerId) continue;
    await db.collection('wheat_entries').add({
      farmer_id: newFarmerId,
      wheat_variety: e.wheat_variety || '',
      bags: e.bags || 0,
      quantity: e.quantity || 0,
      rate: e.rate || 0,
      amount: e.amount || 0,
      advance_rate: e.advance_rate || 0,
      previous_advance: e.previous_advance || 0,
      advance_payment: e.advance_payment || 0,
      bonus_rate: e.bonus_rate || 0,
      bonus: e.bonus || 0,
      entry_date: e.entry_date,
      created_at: new Date().toISOString()
    });
    summary.entries++;
  }

  res.json({ status: 'done', summary });
});

module.exports = router;
