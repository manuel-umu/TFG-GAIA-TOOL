const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');

const Framework = require('./framework.model.js');
const DR = require('./disclosure_requirement.model.js');

class DataPoint extends Model {}

DataPoint.init(
  {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    disclosure_requirement_id: {
      type: DataTypes.SMALLINT.UNSIGNED,
     allowNull: false,
      references: {
        model: DR,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    official_id: {   
      type: DataTypes.STRING(30),
      allowNull: false,
      
    },
    name: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    paragraph_ref: {  // Nombre de la version, ejemplo: ESRS Set 1 - enero 2025
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    related_ar: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    data_type: {  
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    is_voluntary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_conditional: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  
  },
  {
    sequelize,
    modelName: 'DataPoint',
    tableName: 'datapoints',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['framework_id', 'version_code']
      }
    ]
  }
);

module.exports = DataPoint;