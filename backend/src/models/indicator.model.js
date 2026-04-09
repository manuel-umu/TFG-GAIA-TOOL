const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const DataPoint = require('./datapoint.model.js');
class Indicator extends Model { }

Indicator.init(
  {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    data_point_id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: true,
      references: {
        model: DataPoint,
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    dimension: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    formula: {
      type: DataTypes.STRING(400),
      allowNull: false,
    },
    goal: {
      type: DataTypes.ENUM('Minimize', 'Maximize'),
      allowNull: false,
    },
    measure: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    modelName: 'Indicator',
    tableName: 'indicators',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = Indicator;
