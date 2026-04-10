const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Standard = require('./standard.model.js');

class DisclosureRequirement extends Model {}

DisclosureRequirement.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    standard_id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      references: {
        model: Standard,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    code: {   
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'DisclosureRequirement',
    tableName: 'disclosure_requirements',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['standard_id', 'code']
      }
    ]
  }
);

module.exports = DisclosureRequirement;