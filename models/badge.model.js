module.exports = (sequelize, DataTypes) => {
    const Badge = sequelize.define("Badge", {
        badge_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Title cannot be empty"
                },
                notNull: {
                    msg: "Title cannot be null"
                },
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
                },
            }
        },
        url_badge: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Url of badge cannot be empty"
                },
                notNull: {
                    msg: "Url of badge cannot be null"
                },
                isUrl: {
                    msg: "Url of badge must have a url format (https://foo.com)"
                }
            }
        }
    }, {
        tableName: 'badge', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return Badge;
}; 