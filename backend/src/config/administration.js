
const User = require("../models/user.model.js");
const Audits = require("../models/audit.model.js");
const EmailService = require('../services/mailer');
const bcrypt = require("bcrypt");
const { Op } = require('sequelize');

async function createAdminUser() {
  try {
    // Buscar si ya existe el administrador
    const admin = await User.findOne({ where: { username: process.env.ADMIN_USERNAME } });

    if (!admin) {
      // Si no existe, crear el usuario administrador
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      const admin = await User.create({
        username: process.env.ADMIN_USERNAME,
        password: hashedPassword,
        name: 'Administrator',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
      });

      console.log('Admin user created successfully with id: ', admin.id);
    } else {
      console.log('Admin user already exists with id: ', admin.id);
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}

async function checkAudits() {
    try {
      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

      // Auditorías que empiezan hoy
      const auditsStartingToday = await Audits.findAll({
        where: { init_date: { [Op.between]: [startOfDay, endOfDay] } }
      });

      await Promise.all(auditsStartingToday.map(async audit => {
        if (audit.state === 'Not started') {
          await Audits.update({ state: 'Pending' }, { where: { id: audit.id } });
          const auditor = await User.findOne({ where: { id: audit.auditor } });
          const manager = await User.findOne({ where: { id: audit.manager } });
          await EmailService.sendAuditInitiationReminder(
            auditor.email,
            audit.id,
            audit.name,
            audit.init_date,
            audit.end_date,
            manager.name
          );
        }
      }));

      // Auditorías que terminan hoy
      const auditsEndingToday = await Audits.findAll({
        where: { end_date: { [Op.between]: [startOfDay, endOfDay] } }
      });

      await Promise.all(
        auditsEndingToday.map(async (audit) => {
          if (audit.state === 'Evaluated') {
            await Audits.update({ state: 'Closed' }, { where: { id: audit.id } });
          } else if (audit.state !== 'Closed') {
            await Audits.update({ state: 'Not evaluated' }, { where: { id: audit.id } });
          }
          const auditor = await User.findOne({ where: { id: audit.auditor } });
          const manager = await User.findOne({ where: { id: audit.manager } });
          await EmailService.sendAuditFinalizationAvertisement(manager.email, audit.id, audit.name);
          await EmailService.sendAuditFinalizationAvertisement(auditor.email, audit.id, audit.name);
        })
      );

      // Auditorías que terminan en 5 días
      const fiveDaysLater = new Date();
      fiveDaysLater.setUTCDate(fiveDaysLater.getUTCDate() + 5);
      const startFive = new Date(Date.UTC(fiveDaysLater.getUTCFullYear(), fiveDaysLater.getUTCMonth(), fiveDaysLater.getUTCDate(), 0, 0, 0));
      const endFive = new Date(Date.UTC(fiveDaysLater.getUTCFullYear(), fiveDaysLater.getUTCMonth(), fiveDaysLater.getUTCDate(), 23, 59, 59, 999));

      const auditsEndingSoon = await Audits.findAll({
        where: { end_date: { [Op.between]: [startFive, endFive] } }
      });

      await Promise.all(auditsEndingSoon.map(async audit => {
        const auditor = await User.findOne({ where: { id: audit.auditor } });
        await EmailService.sendAuditEndingSoonReminder(auditor.email, audit.id, audit.name, audit.end_date);
      }));

    } catch (error) {
      console.error('Error checking audits:', error);
    }
}

module.exports = { 
  createAdminUser,
  checkAudits
};