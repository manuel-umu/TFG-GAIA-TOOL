const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');

const FrameworkVer = require('./framework_version.model.js');

class Standard extends Model {}

Standard.init(
  {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    framework_version_id: {   // Referencia a la version a la q pertenece este estandar
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      references: {
        model: FrameworkVer,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    code: { // E1 (De ESRS E1, solo la parte de E1 porque ESRS no es el nombre del estandar)
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    name: {  // Ejemplo: Cambio climatico 
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {//Environmental, Social...
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    is_mandatory: {   // Estandar obligatoria o dependiendo de materialidad (tamaño de empresa y sector)
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sort_order: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Standard',
    tableName: 'standards',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['framework_version_id', 'code']
      }
    ]
  }
);

module.exports = Standard;