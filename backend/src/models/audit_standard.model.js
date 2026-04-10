const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Audit = require('./audit.model.js');
const Standard = require('./standard.model.js');
const User = require('./user.model.js');

class AuditStandard extends Model {}

AuditStandard.init(
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
        standard_id: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: { 
                model: Standard, 
                key: 'id' 
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        is_material: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        justification: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        assessed_by: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: true,
            references: { 
                model: User, 
                key: 'id' 
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        assessed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'AuditStandard',
        tableName: 'audit_standards',
        timestamps: false,
    }
);

module.exports = AuditStandard;
