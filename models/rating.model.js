/* module.exports = (sequelize, DataTypes) => {
    const Rating = sequelize.define("Rating", {
        rating_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Foreign Key
            references: {
                model: 'booking', // Table name
                key: 'booking_id' // Table column that is the primary key
            }
        },
        number_stars: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Number of stars cannot be empty"
                },
                notNull: {
                    msg: "Number of stars cannot be null"
                },
                min: {
                    args: [1],
                    msg: "Number of stars must be at least 1"
                },
                max: {
                    args: [5],
                    msg: "Number of stars cannot exceed 5"
                }
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Comment cannot be empty"
                },
                notNull: {
                    msg: "Comment cannot be null"
                },
            }
        }
        
    }, {
        tableName: 'rating', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return Rating;
};  */