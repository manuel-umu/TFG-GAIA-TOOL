const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Audit = require('./audit.model.js');
const Process = require('./process.model.js');

class CalculatedValuesProcess extends Model { }

CalculatedValuesProcess.init(
  {
    audit: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: Audit,
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    process: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
          model: Process,
          key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    sustainability_index: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CalculatedValuesProcess',
    tableName: 'calculated_values_process',
    timestamps: false,
    underscored: true,
  }
);

module.exports = CalculatedValuesProcess;