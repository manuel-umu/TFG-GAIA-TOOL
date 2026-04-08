const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');

const Organization = require('./organization.model.js');
const User = require('./user.model.js');

class Audit extends Model {}

Audit.init(
  {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    init_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'),
      allowNull: false,
    },
    state: {
      type: DataTypes.ENUM('Not started', 'Pending', 'Evaluated', 'Closed', 'Not evaluated'),
      allowNull: false,
      defaultValue: 'Not started',
    },
    organization: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      references: {
        model: Organization,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    auditor: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    manager: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    coefficient: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'Audit',
    tableName: 'audits',
    timestamps: false,
  }
);

module.exports = Audit;