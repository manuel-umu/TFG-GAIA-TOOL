const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Audit = require('./audit.model.js');
const DataPoint = require('./data_point.model.js');
const SourceDocument = require('./source_document.model.js');

/*
 * Tabla pivote que relaciona los datos extraidos de los datapoints con los documentos fuente  
*/ 
class DataPointSource extends Model {}

DataPointSource.init(
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
        data_point_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: DataPoint,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        source_document_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: SourceDocument,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        // Valor que la IA extrajo del documento
        extracted_value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Cita textual del valor
        quote: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        page_hint: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: true,
        },
        confidence: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: false,
            validate: { min: 0, max: 1 },
        },
        extracted_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        is_validated: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: 'DataPointSource',
        tableName: 'data_point_sources',
        timestamps: false,
        indexes: [
            { fields: ['audit_id', 'data_point_id'] },
            { fields: ['source_document_id'] },
        ],
    }
);

module.exports = DataPointSource;
