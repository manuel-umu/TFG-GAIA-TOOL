const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');

const Organization = require('./organization.model.js');

class Factor extends Model { }

Factor.init(
    {
        id: {
            type: DataTypes.SMALLINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        organization: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            references: {
                model: Organization,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        modelName: 'Factor',
        tableName: 'factors',
        timestamps: false,
    }
);

module.exports = Factor;