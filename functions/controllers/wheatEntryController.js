const ExcelJS = require('exceljs');
const WheatEntry = require('../models/WheatEntry');
const Farmer = require('../models/Farmer');
const { styleWorksheet } = require('../utils/excelStyle');

exports.create = async (req, res) => {
  const { crop_type, wheat_variety, bags, quantity, rate, advance_rate, advance_payment, bonus_rate, entry_date } = req.body;
  const farmerId = req.params.id;

  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    return res.redirect('/farmers?error=' + encodeURIComponent('Farmer not found'));
  }

  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  const bagCount = parseInt(bags, 10) || 0;
  const advRate = parseFloat(advance_rate) || 0;
  const bonusRate = parseFloat(bonus_rate) || 0;

  if (qty <= 0 || rt <= 0) {
    return res.redirect(`/farmers/${farmerId}?error=` + encodeURIComponent('Please enter a valid Quantity and Rate'));
  }

  await WheatEntry.create({
    farmer_id: farmerId,
    crop_type: crop_type || 'Wheat',
    wheat_variety: wheat_variety || '',
    bags: bagCount,
    quantity: qty,
    rate: rt,
    amount: qty * rt,
    advance_rate: advRate,
    previous_advance: bagCount * advRate,
    advance_payment: parseFloat(advance_payment) || 0,
    bonus_rate: bonusRate,
    bonus: qty * bonusRate,
    entry_date: entry_date || new Date().toISOString().slice(0, 10)
  }, req.signedCookies.uid);

  res.redirect(`/farmers/${farmerId}?success=` + encodeURIComponent('Wheat entry added successfully'));
};

exports.delete = async (req, res) => {
  const entry = await WheatEntry.findById(req.params.entryId);
  await WheatEntry.delete(req.params.entryId);
  res.redirect(`/farmers/${entry ? entry.farmer_id : req.params.id}?success=` + encodeURIComponent('Entry deleted'));
};

exports.index = async (req, res) => {
  const entries = WheatEntry.withRunningBalance(await WheatEntry.getAllWithFarmer());
  res.render('wheat-entries', { title: 'Wheat Entry History', entries });
};

exports.exportAll = async (req, res) => {
  const entries = WheatEntry.withRunningBalance(await WheatEntry.getAllWithFarmer());

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Wheat Entries');

  sheet.columns = [
    { header: 'Date', key: 'entry_date', width: 12 },
    { header: 'Farmer', key: 'farmer_name', width: 20 },
    { header: 'Crop', key: 'crop_type', width: 12 },
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
      farmer_name: e.farmer_name,
      crop_type: e.crop_type,
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
    title: 'Kissan Record - Wheat Entry History (All Farmers)',
    currencyKeys: ['rate', 'amount', 'advance_rate', 'previous_advance', 'advance_payment', 'bonus_rate', 'bonus', 'net', 'runningBalance'],
    highlightKeys: ['net', 'runningBalance']
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="all_wheat_entries.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
};
