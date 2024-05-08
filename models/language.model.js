module.exports = (sequelize, DataTypes) => {
    const Language = sequelize.define("Language", {
        language_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        language: {
            type: DataTypes.STRING(100), // varchar(100)
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: "Language cannot be empty"
                },
                notNull: {
                    msg: "Language cannot be null"
                },
                isAlpha: {
                    msg: "Language must only contain letters"
                },
            }
        },
    }, {
        tableName: 'language', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return Language;
}; 