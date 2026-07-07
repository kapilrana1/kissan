const db = require('../config/database');

const WheatEntry = {
  getByFarmer(farmerId) {
    return db.prepare(
      'SELECT * FROM wheat_entries WHERE farmer_id = ? ORDER BY entry_date DESC, id DESC'
    ).all(farmerId);
  },

  getAllWithFarmer() {
    return db.prepare(`
      SELECT we.*, f.name AS farmer_name
      FROM wheat_entries we
      JOIN farmers f ON f.id = we.farmer_id
      ORDER BY we.entry_date DESC, we.id DESC
    `).all();
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
        return a.id - b.id;
      });
      let running = 0;
      chronological.forEach(e => {
        running += e.amount + e.bonus - e.previous_advance - e.advance_payment;
        runningBalanceById[e.id] = running;
      });
    });

    return entries.map(e => ({ ...e, runningBalance: runningBalanceById[e.id] }));
  },

  create(data, userId) {
    const stmt = db.prepare(`
      INSERT INTO wheat_entries
        (farmer_id, crop_type, wheat_variety, bags, quantity, rate, amount, advance_rate, previous_advance, advance_payment, bonus_rate, bonus, entry_date, created_by)
      VALUES
        (@farmer_id, @crop_type, @wheat_variety, @bags, @quantity, @rate, @amount, @advance_rate, @previous_advance, @advance_payment, @bonus_rate, @bonus, @entry_date, @created_by)
    `);
    return stmt.run({ ...data, created_by: userId });
  },

  delete(id) {
    return db.prepare('DELETE FROM wheat_entries WHERE id = ?').run(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM wheat_entries WHERE id = ?').get(id);
  }
};

module.exports = WheatEntry;
