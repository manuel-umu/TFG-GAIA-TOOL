const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Audit = require('./audit.model.js');
const Process = require('./process.model.js');
const Indicator = require('./indicator.model.js');

class CalculatedValuesIndicator extends Model { }

CalculatedValuesIndicator.init(
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
        indicator: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: Indicator,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'NO ACTION',
        },
        real_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        ideal_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        normalized_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    },
    {
        sequelize,
        modelName: 'CalculatedValuesIndicator',
        tableName: 'calculated_values_indicator',
        timestamps: false,
        underscored: true,
    }
);

module.exports = CalculatedValuesIndicator;