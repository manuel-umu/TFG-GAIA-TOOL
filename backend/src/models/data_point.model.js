const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');

const Framework = require('./framework.model.js');
const DR = require('./disclosure_requirement.model.js');

class DataPoint extends Model {}

DataPoint.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    disclosure_requirement_id: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      unique: true,
      
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
    phased_in_750: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    phased_in_appendix_c: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cross_reference: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  
  
  },
  {
    sequelize,
    modelName: 'DataPoint',
    tableName: 'datapoints',
    timestamps: false,
  }
);

module.exports = DataPoint;