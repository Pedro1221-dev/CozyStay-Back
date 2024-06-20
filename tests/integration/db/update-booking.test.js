require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);


describe('Database Integration Tests - Update a Specific Booking in the Database', () => {
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

    test('Update a booking with a non-existent booking_id', async () => {
        const nonExistantBookingId = 999999; 
        const updatedBookingData = {
            observation: "Updated Observation",
        };

        try {
            // Attempt to update a booking with a non-existent booking_id
            const [results] = await sequelize.query(`
                UPDATE booking
                SET observation = '${updatedBookingData.observation}'
                WHERE booking_id = ${nonExistantBookingId}
            `);

            // Extract the number of affected rows
            const { affectedRows } = results;
            console.log(affectedRows);

            // Check if no rows were affected
            expect(affectedRows).toBe(0);
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });

    test('Update a specific booking in the booking table', async () => {
        try {
            // Insert a new booking
            const result = await sequelize.query(`
                INSERT INTO booking (property_id, guest_id, booking_date, check_in_date, check_out_date, final_price, payment_method_id, number_guests)
                VALUES (1, 2, '2024-06-20', '2024-07-01', '2024-07-05', 250.00, 1, 4)
            `);  

            // Get the inserted booking's ID
            const [insertedBooking] = await sequelize.query(`
                SELECT * FROM booking WHERE property_id = 1 AND guest_id = 2 AND booking_date = '2024-06-20'
            `);
            const bookingId = insertedBooking[0].booking_id;
            // Update the inserted booking
            const updateResult = await sequelize.query(`
                UPDATE booking
                SET observation = 'Updated Observation'
                WHERE booking_id = ${bookingId}
            `);

            // Verify the update was successful
            const [updatedBooking] = await sequelize.query(`
                SELECT * FROM booking WHERE booking_id = ${bookingId}
            `);

            expect(updatedBooking[0]).toBeDefined();
            expect(updatedBooking[0].observation).toBe('Updated Observation');

            // Clean up: Remove the inserted booking
            await sequelize.query(`
                DELETE FROM booking WHERE booking_id = ${bookingId}
            `);
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});
