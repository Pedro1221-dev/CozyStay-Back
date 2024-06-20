require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Database Integration Tests - Insert Property into Database', () => {
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

    test('Insert a new property into the property table with valid information', async () => {
        try {
                // Insert a new property using Sequelize query method
                const result = await sequelize.query(`
                    INSERT INTO property (owner_id, title, city, country, address, number_bathrooms, number_beds, number_bedrooms, number_guests_allowed, description, price, typology)
                    VALUES (1, 'Test Property', 'City Name', 'Country Name', '123 Main St', 2, 3, 3, 6, 'This is a test property description.', 150.00, 'Apartment')
                `);
                       

                // Check if the insertion was successful
                expect(result).toBeTruthy();

                // Check in the database if the property was inserted correctly
                const insertedProperty = await sequelize.query(`SELECT * FROM property WHERE title = 'Test Property' AND owner_id = 1`);
                const propertyId = insertedProperty[0][0].property_id;

                // Clean up: Remove the inserted property from the database
                await sequelize.query(`DELETE FROM property WHERE property_id = ${propertyId}`)
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});

