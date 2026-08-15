const { CompanySetting } = require('../models');

// GET /api/settings - readable by any authenticated user (needed to render invoice form)
exports.getSettings = async (req, res) => {
  try {
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = await CompanySetting.create({});
    }
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching settings.' });
  }
};

// PUT /api/settings (admin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = await CompanySetting.create({});
    }
    const fields = [
      'company_name', 'gstin', 'phone', 'address', 'logo_text',
      'bank_account_name', 'bank_account_no', 'bank_ifsc', 'upi_id', 'default_gst_rate',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) settings[f] = req.body[f];
    });
    await settings.save();
    return res.json({ success: true, message: 'Settings updated successfully.', settings });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating settings.' });
  }
};
