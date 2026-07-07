const db = require('../config/database');

const Farmer = {
  getAll(search) {
    if (search) {
      const q = `%${search}%`;
      return db.prepare(
        `SELECT * FROM farmers
         WHERE name LIKE ? OR mobile LIKE ? OR address LIKE ?
         ORDER BY created_at DESC`
      ).all(q, q, q);
    }
    return db.prepare('SELECT * FROM farmers ORDER BY created_at DESC').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
  },

  create(data, userId) {
    const stmt = db.prepare(`
      INSERT INTO farmers (name, mobile, address, created_by)
      VALUES (@name, @mobile, @address, @created_by)
    `);
    return stmt.run({ ...data, created_by: userId });
  },

  update(id, data) {
    const stmt = db.prepare(`
      UPDATE farmers SET
        name = @name,
        mobile = @mobile,
        address = @address
      WHERE id = @id
    `);
    return stmt.run({ ...data, id });
  },

  delete(id) {
    return db.prepare('DELETE FROM farmers WHERE id = ?').run(id);
  },

  getBalance(id) {
    const row = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(previous_advance), 0) AS total_previous_advance,
        COALESCE(SUM(advance_payment), 0) AS total_advance_payment,
        COALESCE(SUM(bonus), 0) AS total_bonus
      FROM wheat_entries WHERE farmer_id = ?
    `).get(id);
    const total_advance = row.total_previous_advance + row.total_advance_payment;
    return {
      total_amount: row.total_amount,
      total_previous_advance: row.total_previous_advance,
      total_advance_payment: row.total_advance_payment,
      total_advance,
      total_bonus: row.total_bonus,
      due: row.total_amount + row.total_bonus - total_advance
    };
  },

  getAllWithDue() {
    const farmers = Farmer.getAll();
    return farmers.map(f => ({ ...f, balance: Farmer.getBalance(f.id) }));
  }
};

module.exports = Farmer;
