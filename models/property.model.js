module.exports = (sequelize, DataTypes) => {
    const Property = sequelize.define("Property", {
        property_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        owner_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Foreign Key
            references: {
                model: 'user', // Table name
                key: 'user_id' // Table column that is the primary key
            }
        },
        title: {
            type: DataTypes.STRING, // varchar(255)
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Title cannot be empty"
                },
                notNull: {
                    msg: "Title cannot be null"
                }
            }
        },
        city: {
            type: DataTypes.STRING(100), // varchar(100)
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "City cannot be empty"
                },
                notNull: {
                    msg: "City cannot be null"
                },
                isAlpha: {
                    args: true,
                    msg: "City must contain only alphabetic characters"
                }
            }
        },
        country: {
            type: DataTypes.STRING(100), // varchar(100)
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Country cannot be empty"
                },
                notNull: {
                    msg: "Country cannot be null"
                },
                isAlpha: {
                    args: true,
                    msg: "Country must contain only alphabetic characters"
                }
            }
        },
        address: {
            type: DataTypes.STRING, // varchar(255)
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Address cannot be empty"
                },
                notNull: {
                    msg: "Address cannot be null"
                }
            }
        },
        number_bathrooms: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Number of bathrooms cannot be empty"
                },
                notNull: {
                    msg: "Number of bathrooms cannot be null"
                },
                isInt: {
                    msg: "Number of bathrooms must be an integer"
                },
                min: {
                    args: [0],
                    msg: "Number of bathrooms must be a non-negative integer"
                }
            }
        },
        number_beds: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Number of beds cannot be empty"
                },
                notNull: {
                    msg: "Number of beds cannot be null"
                },
                isInt: {
                    msg: "Number of beds must be an integer"
                },
                min: {
                    args: [0],
                    msg: "Number of beds must be a non-negative integer"
                }
            }
        },
        number_bedrooms: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Number of bedrooms cannot be empty"
                },
                notNull: {
                    msg: "Number of bedrooms cannot be null"
                },
                isInt: {
                    msg: "Number of bedrooms must be an integer"
                },
                min: {
                    args: [0],
                    msg: "Number of bedrooms must be a non-negative integer"
                }
            }
        },
        number_guests_allowed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Number of guests allowed cannot be empty"
                },
                notNull: {
                    msg: "Number of guests allowed cannot be null"
                },
                isInt: {
                    msg: "Number of guests allowed must be an integer"
                },
                min: {
                    args: [0],
                    msg: "Number of guests allowed must be a non-negative integer"
                }
            }
        },
        description: {
            type: DataTypes.TEXT, 
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Description cannot be empty"
                },
                notNull: {
                    msg: "Description cannot be null"
                }
            }
        },
        price: {
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
                min: {
                    args: [0],
                    msg: "Price must be a non-negative value"
                }
            }
        },
        typology: {
            type: DataTypes.STRING(50), // varchar(50)
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Typology cannot be empty"
                },
                notNull: {
                    msg: "Typology cannot be null"
                }
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'available'), 
            allowNull: false,
            defaultValue: 'pending', 
            validate: {
                isIn: {
                    args: [['pending', 'available']], 
                    msg: "Invalid status value"
                }
            }
        },
        
    }, {
        tableName: 'property', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return Property;
}; 