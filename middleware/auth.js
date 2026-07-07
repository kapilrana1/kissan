function requireLogin(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please login first');
    return res.redirect('/login');
  }
  next();
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = { requireLogin, redirectIfLoggedIn };
