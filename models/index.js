const dbConfig = require('../config/db.config.js');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect
    ,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection do DB has been established successfully.');
    } catch (err) {
        console.error('Unable to connect to the database:', err);
    }
})();

const db = {};
//export the sequelize object (DB connection)
db.sequelize = sequelize;
//export User model
db.user = require("./user.model.js")(sequelize, DataTypes);
//export Property model
db.property = require("./property.model.js")(sequelize, DataTypes);
//export Booking model
db.booking = require("./booking.model.js")(sequelize, DataTypes);
//export Language model
db.language = require("./language.model.js")(sequelize, DataTypes);
//export Badge model
db.badge = require("./badge.model.js")(sequelize, DataTypes);
//export PaymentMethod model
db.paymentMethod = require("./paymentMethod.model.js")(sequelize, DataTypes);
//export Photo model
db.photo = require("./photo.model.js")(sequelize, DataTypes);
//export seasonPrice model
db.seasonPrice = require("./seasonPrice.model.js")(sequelize, DataTypes);
//export facility model
db.facility = require("./facility.model.js")(sequelize, DataTypes);
//export user_otp model
db.user_otp = require("./userOTP.model.js")(sequelize, DataTypes);
//export user_password_token model
db.user_password_token = require("./userPasswordToken.model.js")(sequelize, DataTypes);

// 1:1 - 1 property, 1 season price
db.property.hasOne(db.seasonPrice, {
    foreignKey: 'property_id',
    as: 'seasonPrice'
});
db.seasonPrice.belongsTo(db.property, {
    foreignKey: 'property_id'
});

// 1:N - 1 user, N bookings
db.user.hasMany(db.booking, {
    foreignKey: 'guest_id',
    onDelete: "CASCADE"
});
db.booking.belongsTo(db.user, {
    foreignKey: 'guest_id'
});

// 1:N - 1 property, N bookings
db.property.hasMany(db.booking, {
    foreignKey: 'property_id',
    as: 'rating',
    onDelete: "CASCADE"
});
db.booking.belongsTo(db.property, {
    foreignKey: 'property_id'
});

// 1:N - 1 property, N photo
// if property is deleted, delete all the photo associated with it
db.property.hasMany(db.photo, {
    foreignKey: 'property_id',
    as: 'photos',
    onDelete: "CASCADE"
});
db.photo.belongsTo(db.property,{
    foreignKey: 'property_id'
});

// 1:N - 1 user, N otp_codes
// if user is deleted, delete all the otp associated with it
db.user.hasMany(db.user_otp, {
    foreignKey: 'user_id',
    as: 'userOTP',
    onDelete: "CASCADE"
});
db.user_otp.belongsTo(db.user, {
    foreignKey: 'user_id',
});

// 1:N - 1 user, N user_password_token
// if user is deleted, delete all the reset password token associated with it
db.user.hasMany(db.user_password_token, {
    foreignKey: 'user_id',
    onDelete: "CASCADE"
});
db.user_password_token.belongsTo(db.user, {
    foreignKey: 'user_id',
});

// 1:N (USER - PROPERTY) 
db.user.hasMany(db.property, {
    as: 'properties',
    foreignKey: 'owner_id', // Property's foreign key referencing User
});

db.property.belongsTo(db.user, {
    as: 'owner',
    foreignKey: 'owner_id', // Property's foreign key referencing User
}); 

// N:N (USER - LANGUAGE)
db.user.belongsToMany(db.language, {
    through: 'user_language', 
    as: 'language',
    timestamps: false,
    foreignKey: 'user_id', // Foreign key in the user_language table that references the user table
    otherKey: 'language_id' // Foreign key in the user_language table that references the language table
});
db.language.belongsToMany(db.user, {
    through: 'user_language', 
    timestamps: false,
    foreignKey: 'language_id', // Foreign key in the user_language table that references the language table
    otherKey: 'user_id' // Foreign key in the user_language table that references the user table
});

// N:N (USER - BADGE)
db.user.belongsToMany(db.badge, {
    through: 'user_badge', 
    as: 'badge',
    timestamps: false,
    foreignKey: 'user_id', // Foreign key in the user_badge table that references the user table
    otherKey: 'badge_id' // Foreign key in the user_badge table that references the badge table
});
db.badge.belongsToMany(db.user, {
    through: 'user_badge', 
    timestamps: false,
    foreignKey: 'badge_id', // Foreign key in the user_badge table that references the badge table
    otherKey: 'user_id' // Foreign key in the user_badge table that references the user table
});

// N:N (PROPERTY - PAYMENT METHOD)
db.property.belongsToMany(db.paymentMethod, {
    through: 'payment_method_property', 
    as: 'paymentMethod',
    timestamps: false,
    foreignKey: 'property_id', // Foreign key in the payment_method_property table that references the property table
    otherKey: 'payment_method_id' // Foreign key in the payment_method_property table that references the payment method table
});
db.paymentMethod.belongsToMany(db.property, {
    through: 'payment_method_property', 
    timestamps: false,
    foreignKey: 'payment_method_id', // Foreign key in the payment_method_property table that references the payment method table
    otherKey: 'property_id' // Foreign key in the payment_method_property table that references the property table
});

// N:N (PROPERTY - FACILITY)
db.property.belongsToMany(db.facility, {
    through: 'property_facility', 
    as: 'facilities',
    timestamps: false,
    foreignKey: 'property_id', // Foreign key in the property_facility table that references the property table
    otherKey: 'facility_id' // Foreign key in the property_facility table that references the facility table
});
db.facility.belongsToMany(db.property, {
    through: 'property_facility', 
    timestamps: false,
    foreignKey: 'facility_id', // Foreign key in the property_facility table that references the facility table
    otherKey: 'property_id' // Foreign key in the property_facility table that references the property table
});

// N:N (USER - PROPERTY) (FAVORITE PROPERTIES)
db.user.belongsToMany(db.property, {
    through: 'favorite', 
    as: 'favoriteProperty',
    timestamps: false,
    foreignKey: 'user_id', // Foreign key in the favorite table that references the user table
    otherKey: 'property_id' // Foreign key in the favorite table that references the property table
});
db.property.belongsToMany(db.user, {
    through: 'favorite', 
    as: 'favoriteProperty',
    timestamps: false,
    foreignKey: 'property_id', // Foreign key in the favorite table that references the property table
    otherKey: 'user_id' // Foreign key in the favorite table that references the user table
});




// // optionally: SYNC
// (async () => {
//     try {
//         // await sequelize.sync({ force: true }); // creates tables, dropping them first if they already existed
//         // await sequelize.sync({ alter: true }); // checks the tables in the database (which columns they have, what are their data types, etc.), and then performs the necessary changes to make then match the models
//         // await sequelize.sync(); // creates tables if they don't exist (and does nothing if they already exist)
//         console.log('DB is successfully synchronized')
//     } catch (error) {
//         console.log(error)
//     }
// })();

module.exports = db;
