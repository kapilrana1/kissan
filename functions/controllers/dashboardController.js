const Farmer = require('../models/Farmer');

exports.index = async (req, res) => {
  const farmers = await Farmer.getAllWithDue();
  const totalFarmers = farmers.length;
  const totalAmount = farmers.reduce((sum, f) => sum + f.balance.total_amount, 0);
  const totalBonus = farmers.reduce((sum, f) => sum + f.balance.total_bonus, 0);
  const totalAdvance = farmers.reduce((sum, f) => sum + f.balance.total_advance, 0);
  const totalDue = totalAmount + totalBonus - totalAdvance;

  res.render('dashboard', {
    title: 'Dashboard',
    totalFarmers,
    totalAmount,
    totalBonus,
    totalAdvance,
    totalDue,
    recentFarmers: farmers.slice(0, 5)
  });
};
