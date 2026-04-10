const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');

const Framework = require('./framework.model.js');

class FrameworkVersion extends Model {}

FrameworkVersion.init(  //TODO: MIRAR SI VERSIONCODE SE PUEDE COMO PRIMARY KEY
  {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    framework_id: {   
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      references: {
        model: Framework,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    version_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    version_label: {  // Nombre de la version, ejemplo: ESRS Set 1 - enero 2025
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    effective_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    source_file: {  
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  
  },
  {
    sequelize,
    modelName: 'FrameworkVersion',
    tableName: 'framework_versions',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['framework_id', 'version_code']
      }
    ]
  }
);

module.exports = FrameworkVersion;