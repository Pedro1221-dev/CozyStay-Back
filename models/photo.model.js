module.exports = (sequelize, DataTypes) => {
    const Photo = sequelize.define("Photo", {
        photo_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        /* property_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Foreign Key
            references: {
                model: 'property', // Table name
                key: 'property_id' // Table column that is the primary key
            }
        }, */
        url_photo: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Url of photo cannot be empty"
                },
                notNull: {
                    msg: "Url of photo cannot be null"
                },
                isUrl: {
                    msg: "Url of photo must have a url format (https://foo.com)"
                }
            }
        }
    }, {
        tableName: 'photo', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return Photo;
}; 