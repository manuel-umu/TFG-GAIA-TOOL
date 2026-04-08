const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');

class Organization extends Model { }

Organization.init(
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
            unique: true,
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING(70),
            allowNull: false,
        },
        sector: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        rangeEmployees: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        website: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        goals: {
            type: DataTypes.STRING(1000),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Organization',
        tableName: 'organizations',
        timestamps: false,
    },
);

module.exports = Organization;