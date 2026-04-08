const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Factor = require('./factor.model.js');
const Indicator = require('./indicator.model.js');
const Process = require('./process.model.js');

class ProcessIndicatorFactor extends Model { }

ProcessIndicatorFactor.init(
    {
        factor: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: Factor,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
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
            onDelete: 'RESTRICT',
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
        }
    },
    {
        sequelize,
        modelName: 'ProcessIndicatorFactor',
        tableName: 'process_indicator_factor',
        timestamps: false,
        underscored: true,
    },
);

module.exports = ProcessIndicatorFactor;