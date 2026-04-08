const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Audit = require('./audit.model.js');
const Process = require('./process.model.js');
const Indicator = require('./indicator.model.js');

class CalculatedElementMatrixSaaty extends Model { }

CalculatedElementMatrixSaaty.init(
    {
        audit: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: Audit,
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        process: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: Process,
                key: 'id'
            },
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE',
        },
        column_ind: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: Indicator,
                key: 'id'
            },
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE',
        },
        row_ind: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: Indicator,
                key: 'id'
            },
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE',
        },
        element: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false
        },
    },
    {
        sequelize,
        modelName: 'CalculatedElementMatrixSaaty',
        tableName: 'calculated_element_matrix_saaty',
        timestamps: false,
        underscored: true,
    }
);

module.exports = CalculatedElementMatrixSaaty;