const db = require('../config/firebase');

const usersCol = db.collection('users');

const User = {
  async findByUsername(username) {
    const snap = await usersCol.where('username', '==', username).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async findById(id) {
    const doc = await usersCol.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }
};

module.exports = User;
