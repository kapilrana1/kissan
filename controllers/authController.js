const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  const user = User.findByUsername(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.flash('error', 'Invalid username or password');
    return res.redirect('/login');
  }

  req.session.userId = user.id;
  req.session.fullName = user.full_name;
  res.redirect('/dashboard');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
