const { DataTypes, Model } = require('sequelize');

const sequelize = require('../config/sequelize.js');

class User extends Model { }

User.init(
    {
        id: {
            type: DataTypes.SMALLINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(70),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(70),
            allowNull: false,
        },
        first_second_name: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        role: {
            type: DataTypes.ENUM('admin', 'chief_auditor', 'evaluator_auditor'),
            allowNull: false,
            defaultValue: 'evaluator_auditor',
        },
        recovery_code: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        code_expiry: {
            type: DataTypes.DATE,
            allowNull: true,
        }
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: false,
    }
);

module.exports = User;