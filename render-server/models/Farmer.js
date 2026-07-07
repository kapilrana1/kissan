const db = require('../config/firebase');
const WheatEntry = require('./WheatEntry');

const farmersCol = db.collection('farmers');

function computeBalance(entries) {
  const total_amount = entries.reduce((s, e) => s + e.amount, 0);
  const total_previous_advance = entries.reduce((s, e) => s + e.previous_advance, 0);
  const total_advance_payment = entries.reduce((s, e) => s + e.advance_payment, 0);
  const total_bonus = entries.reduce((s, e) => s + e.bonus, 0);
  const total_advance = total_previous_advance + total_advance_payment;
  return {
    total_amount,
    total_previous_advance,
    total_advance_payment,
    total_advance,
    total_bonus,
    due: total_amount + total_bonus - total_advance
  };
}

const Farmer = {
  async getAll(search) {
    const snap = await farmersCol.orderBy('created_at', 'desc').get();
    let farmers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (search) {
      const q = search.toLowerCase();
      farmers = farmers.filter(f =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.mobile || '').toLowerCase().includes(q) ||
        (f.address || '').toLowerCase().includes(q)
      );
    }
    return farmers;
  },

  async findById(id) {
    const doc = await farmersCol.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async create(data, userId) {
    const ref = await farmersCol.add({
      ...data,
      created_by: userId,
      created_at: new Date().toISOString()
    });
    return ref.id;
  },

  async update(id, data) {
    await farmersCol.doc(id).update(data);
  },

  async delete(id) {
    const entries = await WheatEntry.getByFarmer(id);
    const batch = db.batch();
    entries.forEach(e => batch.delete(db.collection('wheat_entries').doc(e.id)));
    batch.delete(farmersCol.doc(id));
    await batch.commit();
  },

  async getBalance(id) {
    const entries = await WheatEntry.getByFarmer(id);
    return computeBalance(entries);
  },

  async getAllWithDue() {
    const farmers = await Farmer.getAll();
    const results = [];
    for (const f of farmers) {
      const balance = await Farmer.getBalance(f.id);
      results.push({ ...f, balance });
    }
    return results;
  }
};

module.exports = Farmer;
