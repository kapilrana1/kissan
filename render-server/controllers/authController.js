const bcrypt = require('bcryptjs');
const User = require('../models/User');

const COOKIE_OPTS = {
  signed: true,
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 8
};

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findByUsername(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.redirect('/login?error=' + encodeURIComponent('Invalid username or password'));
  }

  res.cookie('uid', user.id, COOKIE_OPTS);
  res.cookie('fullName', user.full_name, COOKIE_OPTS);
  res.redirect('/dashboard');
};

exports.logout = (req, res) => {
  res.clearCookie('uid');
  res.clearCookie('fullName');
  res.redirect('/login');
};
