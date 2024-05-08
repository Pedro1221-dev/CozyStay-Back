module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define("Booking", {
        booking_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
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
        guest_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Foreign Key
            references: {
                model: 'user', // Table name
                key: 'user_id' // Table column that is the primary key
            }
        },
        booking_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            validate: {
                notEmpty: {
                    msg: "Booking date cannot be empty"
                },
                notNull: {
                    msg: "Booking date cannot be null"
                },
                isDate: true,
            }
        },
        check_in_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Check in date cannot be empty"
                },
                notNull: {
                    msg: "Check in date cannot be null"
                },
                isDate: true, 
                //isAfter: { args: new Date().toISOString(), msg: 'Check-in date must be after current date' }, 
                customValidator(value) {
                    if (value <= this.booking_date) {
                        throw new Error('Check-in date must be after booking date'); 
                    }
                }
            }
        },
        check_out_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Check out date cannot be empty"
                },
                notNull: {
                    msg: "Check out date cannot be null"
                },
                isDate: true, 
                //isAfter: { args: new Date().toISOString(), msg: 'Check-out date must be after current date' }, 
                customValidator(value) {
                    if (value <= this.check_in_date) {
                        throw new Error('Check-out date must be after check-in date'); 
                    }
                }
            }
        },
        final_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Price cannot be empty"
                },
                notNull: {
                    msg: "Price cannot be null"
                },
                isDecimal: {
                    msg: "Price must be a decimal number"
                },
                min: 0, // >= 0
            }
        },
        observation: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        payment_method_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Foreign Key
            references: {
                model: 'payment_method', // Table name
                key: 'payment_method_id' // Table column that is the primary key
            }
        },
        invoice: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        number_guests: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Number of guests cannot be empty"
                },
                notNull: {
                    msg: "Number of guests cannot be null"
                },
                isInt: {
                    msg: "Number of guests must be an integer"
                },
                min: {
                    args: [0],
                    msg: "Number of guests must be a non-negative integer"
                }
            }
        }
    }, {
        tableName: 'booking', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return Booking;
}; 