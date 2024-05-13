module.exports = (sequelize, DataTypes) => {
    const UserOTP = sequelize.define("UserOTP", {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'user', 
                key: 'user_id'
            }
        },
        otp_code: {
            type: DataTypes.STRING(255), 
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'user_otp', // Specify the table name explicitly
        timestamps: false // Disable automatic creation of `createdAt` and `updatedAt` columns
    });
    return UserOTP;
}; 