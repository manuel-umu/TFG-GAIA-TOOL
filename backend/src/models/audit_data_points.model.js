const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Audit = require('./audit.model.js');
const Datapoint = require('./data_point.model.js');
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
        data_point_id: {
            type: DataTypes.INTEGER.UNSIGNED,
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
            type: DataTypes.TEXT,
            allowNull: true,
        },
        value_numeric: {
            type: DataTypes.DECIMAL(15, 4),
            allowNull: true,
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
            type: DataTypes.ENUM('pending', 'draft', 'completed', 'validated'),
            allowNull: false,
            defaultValue: 'pending',
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
            onDelete: 'SET NULL',
        },
    },
    {
        sequelize,
        modelName: 'AuditDatapoint',
        tableName: 'audit_datapoints',
        timestamps: false,
    },
);

module.exports = AuditDatapoints;