const db = require('../config/firebase');

const entriesCol = db.collection('wheat_entries');

const WheatEntry = {
  async getByFarmer(farmer_id) {
    const snap = await entriesCol.where('farmer_id', '==', farmer_id).get();
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    entries.sort((a, b) => {
      if (a.entry_date !== b.entry_date) return a.entry_date < b.entry_date ? 1 : -1;
      return b.id.localeCompare(a.id);
    });
    return entries;
  },

  async getAllWithFarmer() {
    const [entriesSnap, farmersSnap] = await Promise.all([
      entriesCol.get(),
      db.collection('farmers').get()
    ]);
    const farmerNames = {};
    farmersSnap.docs.forEach(d => { farmerNames[d.id] = d.data().name; });
    const entries = entriesSnap.docs.map(d => {
      const data = d.data();
      return { id: d.id, ...data, farmer_name: farmerNames[data.farmer_id] || 'Unknown' };
    });
    entries.sort((a, b) => (a.entry_date < b.entry_date ? 1 : a.entry_date > b.entry_date ? -1 : 0));
    return entries;
  },

  async create(data, userId) {
    const ref = await entriesCol.add({
      ...data,
      created_by: userId,
      created_at: new Date().toISOString()
    });
    return ref.id;
  },

  async delete(id) {
    await entriesCol.doc(id).delete();
  },

  async findById(id) {
    const doc = await entriesCol.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  withRunningBalance(entries) {
    const byFarmer = {};
    entries.forEach(e => {
      if (!byFarmer[e.farmer_id]) byFarmer[e.farmer_id] = [];
      byFarmer[e.farmer_id].push(e);
    });

    const runningBalanceById = {};
    Object.values(byFarmer).forEach(group => {
      const chronological = [...group].sort((a, b) => {
        if (a.entry_date !== b.entry_date) return a.entry_date < b.entry_date ? -1 : 1;
        return a.id.localeCompare(b.id);
      });
      let running = 0;
      chronological.forEach(e => {
        running += e.amount + e.bonus - e.previous_advance - e.advance_payment;
        runningBalanceById[e.id] = running;
      });
    });

    return entries.map(e => ({ ...e, runningBalance: runningBalanceById[e.id] }));
  }
};

module.exports = WheatEntry;
