const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const User = require('./user.model.js');

class Process extends Model { }

Process.init(
    {
        id: {
            type: DataTypes.SMALLINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,          
        },
        name: {
            type: DataTypes.STRING(70),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM('Strategic', 'Key', 'Support'),
            allowNull: false,
        },
        responsible: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Process',
        tableName: 'processes',
        timestamps: false,
        paranoid: true,
        deletedAt: 'deleted_at',
    },
);

module.exports = Process;