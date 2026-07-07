const ExcelJS = require('exceljs');
const Farmer = require('../models/Farmer');
const WheatEntry = require('../models/WheatEntry');
const { styleWorksheet, safeFilename } = require('../utils/excelStyle');

exports.list = (req, res) => {
  const search = req.query.q || '';
  const farmers = Farmer.getAll(search).map(f => ({ ...f, balance: Farmer.getBalance(f.id) }));
  res.render('farmers/list', { title: 'Farmer Accounts', farmers, search });
};

exports.showAddForm = (req, res) => {
  res.render('farmers/form', { title: 'Add New Farmer', farmer: null });
};

exports.create = (req, res) => {
  const { name, mobile, address } = req.body;

  if (!name || !mobile) {
    req.flash('error', 'Name and Mobile number are required');
    return res.redirect('/farmers/new');
  }

  Farmer.create({
    name,
    mobile,
    address: address || ''
  }, req.session.userId);

  req.flash('success', 'Farmer account created successfully');
  res.redirect('/farmers');
};

exports.showEditForm = (req, res) => {
  const farmer = Farmer.findById(req.params.id);
  if (!farmer) {
    req.flash('error', 'Farmer not found');
    return res.redirect('/farmers');
  }
  res.render('farmers/form', { title: 'Edit Farmer Account', farmer });
};

exports.update = (req, res) => {
  const { name, mobile, address } = req.body;

  Farmer.update(req.params.id, {
    name,
    mobile,
    address: address || ''
  });

  req.flash('success', 'Account updated successfully');
  res.redirect(`/farmers/${req.params.id}`);
};

exports.delete = (req, res) => {
  Farmer.delete(req.params.id);
  req.flash('success', 'Farmer account deleted');
  res.redirect('/farmers');
};

exports.view = (req, res) => {
  const farmer = Farmer.findById(req.params.id);
  if (!farmer) {
    req.flash('error', 'Farmer not found');
    return res.redirect('/farmers');
  }
  const entries = WheatEntry.withRunningBalance(WheatEntry.getByFarmer(farmer.id));
  const balance = Farmer.getBalance(farmer.id);

  res.render('farmers/view', { title: farmer.name, farmer, entries, balance });
};

exports.exportList = async (req, res) => {
  const search = req.query.q || '';
  const farmers = Farmer.getAll(search).map(f => ({ ...f, balance: Farmer.getBalance(f.id) }));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Farmers');

  sheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Mobile', key: 'mobile', width: 16 },
    { header: 'Address', key: 'address', width: 30 },
    { header: 'Total Wheat Amount', key: 'total_amount', width: 20 },
    { header: 'Total Bonus', key: 'total_bonus', width: 14 },
    { header: 'Total Advance', key: 'total_advance', width: 14 },
    { header: 'Due to Farmer', key: 'due', width: 16 }
  ];

  farmers.forEach(f => {
    sheet.addRow({
      name: f.name,
      mobile: f.mobile,
      address: f.address,
      total_amount: f.balance.total_amount,
      total_bonus: f.balance.total_bonus,
      total_advance: f.balance.total_advance,
      due: f.balance.due
    });
  });

  styleWorksheet(sheet, {
    title: 'Kisan Record - Farmer Accounts',
    currencyKeys: ['total_amount', 'total_bonus', 'total_advance', 'due'],
    highlightKeys: ['due']
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="farmers.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
};

exports.exportEntries = async (req, res) => {
  const farmer = Farmer.findById(req.params.id);
  if (!farmer) {
    req.flash('error', 'Farmer not found');
    return res.redirect('/farmers');
  }
  const entries = WheatEntry.withRunningBalance(WheatEntry.getByFarmer(farmer.id));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Wheat Entries');

  sheet.columns = [
    { header: 'Date', key: 'entry_date', width: 12 },
    { header: 'Variety', key: 'wheat_variety', width: 16 },
    { header: 'Bags', key: 'bags', width: 8 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Rate', key: 'rate', width: 10 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Adv. Rate/Bag', key: 'advance_rate', width: 14 },
    { header: 'Prev. Advance', key: 'previous_advance', width: 14 },
    { header: 'Advance Payment', key: 'advance_payment', width: 16 },
    { header: 'Bonus Rate/Qtl', key: 'bonus_rate', width: 14 },
    { header: 'Bonus', key: 'bonus', width: 10 },
    { header: 'Net', key: 'net', width: 12 },
    { header: 'Available Balance', key: 'runningBalance', width: 16 }
  ];

  entries.forEach(e => {
    sheet.addRow({
      entry_date: e.entry_date,
      wheat_variety: e.wheat_variety,
      bags: e.bags,
      quantity: e.quantity,
      rate: e.rate,
      amount: e.amount,
      advance_rate: e.advance_rate,
      previous_advance: e.previous_advance,
      advance_payment: e.advance_payment,
      bonus_rate: e.bonus_rate,
      bonus: e.bonus,
      net: e.amount + e.bonus - e.previous_advance - e.advance_payment,
      runningBalance: e.runningBalance
    });
  });

  styleWorksheet(sheet, {
    title: `Wheat Entry History - ${farmer.name}`,
    currencyKeys: ['rate', 'amount', 'advance_rate', 'previous_advance', 'advance_payment', 'bonus_rate', 'bonus', 'net', 'runningBalance'],
    highlightKeys: ['net', 'runningBalance']
  });

  const filename = `${safeFilename(farmer.name)}_wheat_entries.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};
