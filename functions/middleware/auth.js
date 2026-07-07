function requireLogin(req, res, next) {
  if (!req.signedCookies.uid) {
    return res.redirect('/login?error=' + encodeURIComponent('Please login first'));
  }
  next();
}

function redirectIfLoggedIn(req, res, next) {
  if (req.signedCookies.uid) {
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = { requireLogin, redirectIfLoggedIn };
