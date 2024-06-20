require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Database Integration Tests - Select One Booking', () => {
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

    test('Get a booking with a non-existent booking_id', async () => {
        try {
                // Select a booking with a non-existent booking_id
                const result = await sequelize.query(`
                    SELECT * FROM booking WHERE booking_id = 999999
                `)            

                //console.log(result);
                expect(result[0]).toHaveLength(0)
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });

    test('Get a specific booking with a valid booking_id', async () => {
        const existingBookingId = 1; 

        try {
            // Select a booking with an existing booking_id
            const result = await sequelize.query(`SELECT * FROM booking WHERE booking_id = ${existingBookingId}`);

            // Check if the booking is returned correctly
            expect(result[0]).toHaveLength(1);
            const booking = result[0][0];
            expect(booking.booking_id).toBe(existingBookingId);
            expect(booking).toHaveProperty('guest_id');
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});

