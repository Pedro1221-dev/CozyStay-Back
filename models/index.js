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
//export Rating model
db.rating = require("./rating.model.js")(sequelize, DataTypes);
//export PaymentMethod model
db.paymentMethod = require("./paymentMethod.model.js")(sequelize, DataTypes);
//export Photo model
db.photo = require("./photo.model.js")(sequelize, DataTypes);
//export seasonPrice model
db.seasonPrice = require("./seasonPrice.model.js")(sequelize, DataTypes);
//export facility model
db.facility = require("./facility.model.js")(sequelize, DataTypes);


// N:N (USER - LANGUAGE)
db.user.belongsToMany(db.language, {
    through: 'user_language', 
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
