const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');

class Framework extends Model {}

Framework.init(
  {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: false,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    entity: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
     created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }, 
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
  },
  {
    sequelize,
    modelName: 'Framework',
    tableName: 'frameworks',
    timestamps: false,
  }
);

module.exports = Framework;