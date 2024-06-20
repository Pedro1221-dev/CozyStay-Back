require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Database Integration Tests - Insert Booking into Database', () => {
    // Before all tests, connect to the database
    beforeAll(async () => {
        try {
            await sequelize.authenticate();
            console.log('Connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            throw error; // Throw error to fail the test if connection fails
        }
    });

    // After all tests, close the database connection
    afterAll(async () => {
        try {
            await sequelize.close();
            console.log('Connection closed successfully.');
        } catch (error) {
            console.error('Error closing database connection:', error);
            throw error; // Throw error to fail the test if closing fails
        }
    });

    test('Insert a new booking into the booking table with valid information', async () => {
        try {
                // Insert a new booking using Sequelize query method
                const result = await sequelize.query(`
                    INSERT INTO booking (property_id, guest_id, booking_date, check_in_date, check_out_date, final_price, payment_method_id, number_guests)
                    VALUES (1, 2, '2024-06-20', '2024-07-01', '2024-07-05', 250.00, 1, 4)
                `);
                

                // Check if the insertion was successful
                expect(result).toBeTruthy();

                // Check in the database if the booking was inserted correctly
                const insertedBooking = await sequelize.query(`SELECT * FROM booking WHERE property_id = 1 AND guest_id = 2 AND booking_date = '2024-06-20'`);
                const bookingId = insertedBooking[0][0].booking_id;
                

                // Clean up: Remove the inserted booking from the database
                await sequelize.query(`DELETE FROM booking WHERE booking_id = ${bookingId}`)
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});

