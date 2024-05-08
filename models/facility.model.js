module.exports = (sequelize, DataTypes) => {
    const Facility = sequelize.define("Facility", {
        facility_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(255), // varchar(255)
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: "Name cannot be empty"
                },
                notNull: {
                    msg: "Name cannot be null"
                },
            }
        },
    }, {
        tableName: 'facility', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return Facility;
}; 