const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const wheatEntryRoutes = require('./routes/wheatEntryRoutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.COOKIE_SECRET || 'kisan-record-firebase-secret'));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.currentUser = req.signedCookies.fullName || null;
  res.locals.currentPath = req.path;
  res.locals.success = req.query.success ? [req.query.success] : [];
  res.locals.error = req.query.error ? [req.query.error] : [];
  next();
});

app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', wheatEntryRoutes);
app.use('/farmers', farmerRoutes);

app.get('/', (req, res) => {
  res.redirect(req.signedCookies.uid ? '/dashboard' : '/login');
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

module.exports = app;
