const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Audit = require('./audit.model.js');
const Datapoint = require('./datapoint.model.js');
const User = require('./user.model.js');

class AuditDatapoints extends Model { }

AuditDatapoints.init(
    {
        audit_id: {
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
        datapoint_id: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: Datapoint,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        value_text: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        value_num: {
            type: DataTypes.DECIMAL(15, 4),
            allowNull: false,
        },
        is_applicable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        evidence_reference: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Draft', 'Completed', 'Validated'),
            allowNull: false,
            defaultValue: 'Pending',
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_by: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: true,
            references: {
                model: User,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
    },
    {
        sequelize,
        modelName: 'AuditDatapoint',
        tableName: 'audit_datapoints',
        timestamps: false,
        underscored: true,
    },
);

module.exports = ProcessIndicatorFactor;