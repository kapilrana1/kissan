const db = require('../config/database');

const User = {
  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  findById(id) {
    return db.prepare('SELECT id, username, full_name FROM users WHERE id = ?').get(id);
  }
};

module.exports = User;
