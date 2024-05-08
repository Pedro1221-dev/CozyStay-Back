module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING, // varchar(255)
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Name cannot be empty"
                },
                notNull: {
                    msg: "Name cannot be null"
                }
            }
        },
        password: {
            type: DataTypes.STRING, // varchar(255)
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Password cannot be empty"
                },
                notNull: {
                    msg: "Password cannot be null"
                },
                len: {
                    args: [8, 100], // Minimum 8 characters
                    msg: "Password must be at least 8 characters long"
                },
                isStrongPassword(value) {
                    // Check if the value contains at least one digit (\d) and one special character (!@#$%^&*)
                    if (!/(?=.*\d)(?=.*[!@#$%^&*])/.test(value)) {
                      // If the value doesn't meet the criteria, throw an error with a specific message
                      throw new Error('Password must contain at least one number and one special character');
                    }
                }
            },
        },
        nationality: {
            type: DataTypes.STRING, // varchar(255)
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Nationality cannot be empty"
                },
                notNull: {
                    msg: "Nationality cannot be null"
                },
                isAlpha: {
                    args: true,
                    msg: "Nationality must contain only alphabetic characters"
                }
            }
        },
        vat_number: {
            type: DataTypes.STRING, // varchar(255)
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: "VAT number cannot be empty"
                },
                isNumeric: {
                  msg: "VAT number must contain only numeric characters"
                }
            }
        },
        email: {
            type: DataTypes.STRING, // varchar(255)
            allowNull: false,
            unique: true, 
            validate: {
                notEmpty: {
                    msg: "Email cannot be empty"
                },  
                notNull: {
                    msg: "Email cannot be null"
                },
                isEmail: {
                    msg: "Invalid email address"
                }
            }
        },
        type: {
            type: DataTypes.STRING(50), // varchar(50)
            allowNull: false,
            defaultValue: 'user',
            validate: {
              isIn: {
                args: [['admin', 'user']],
                msg: "Invalid user type"
              }
            }
        },
        blocked: {
            type: DataTypes.BOOLEAN, // 0 represents false, 1 represents true
            defaultValue: false,  
            allowNull: false,
        },
        url_avatar: {
            type: DataTypes.STRING, // varchar(255)
            allowNull: true, 
            defaultValue: 'https://example.com/default_avatar.jpg', 
            validate: {
              isURL: {
                msg: "Invalid avatar URL"
              }
            }
        },
        host_since: {
            type: DataTypes.DATEONLY,
            allowNull: true, 
            defaultValue: null, 
            validate: {
              isDate: {
                msg: "Invalid date"
              }
            }
        }
    }, {
        tableName: 'user', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return User;
}; 