const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Audit = require('./audit.model.js');
const User = require('./user.model.js');

class SourceDocument extends Model {}

SourceDocument.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        audit_id: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            references: {
                model: Audit,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        // Nombre hasheado para guardar
        filename: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        original_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        format: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        // Tamaño del fichero en bytes
        file_size: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        extracted_text: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
        },
        page_count: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: true,
        },
        processed_status: {
            type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
        },
        uploaded_by: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: true,
            references: {
                model: User,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        uploaded_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'SourceDocument',
        tableName: 'source_documents',
        timestamps: false,
    }
);

module.exports = SourceDocument;
