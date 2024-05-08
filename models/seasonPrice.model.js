module.exports = (sequelize, DataTypes) => {
    const SeasonPrice = sequelize.define("SeasonPrice", {
        season_price_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        property_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Foreign Key
            references: {
                model: 'property', // Table name
                key: 'property_id' // Table column that is the primary key
            }
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Start date cannot be empty"
                },
                notNull: {
                    msg: "Start date cannot be null"
                },
                isDate: {
                    msg: "Start date must be a valid date"
                },
                notNull: {
                    msg: "Start date cannot be null"
                }
            }
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "End date cannot be empty"
                },
                notNull: {
                    msg: "End date cannot be null"
                },
                isDate: {
                    msg: "End date must be a valid date"
                },
                notNull: {
                    msg: "End date cannot be null"
                }
            }
        },
        addition: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: {
                    msg: "Addition must be a decimal value"
                },
                notNull: {
                    msg: "Addition cannot be null"
                },
                min: {
                    args: [0],
                    msg: "Addition must be at least 0"
                }
            }
        }
    }, {
        tableName: 'season_price', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return SeasonPrice;
}; 