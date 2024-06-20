require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Database Integration Tests - Delete a Specific Property from the Database', () => {
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

    test('Delete a specific property from the property table', async () => {
        try {
            // Insert a new property
            const result = await sequelize.query(`
                INSERT INTO property (owner_id, title, city, country, address, number_bathrooms, number_beds, number_bedrooms, number_guests_allowed, description, price, typology)
                VALUES (1, 'Test Property', 'City Name', 'Country Name', '123 Main St', 2, 3, 3, 6, 'This is a test property description.', 150.00, 'Apartment')
            `);          

            // Get the inserted property's ID
            const [insertedProperty] = await sequelize.query(`
                SELECT property_id FROM property WHERE title = 'Test Property' AND owner_id = 1
            `);
            const propertyId = insertedProperty[0].property_id;

            // Delete the inserted property
            const deleteResult = await sequelize.query(`
                DELETE FROM property WHERE property_id = ${propertyId}
            `);

            // Verify the deletion was successful
            const [deletedProperty] = await sequelize.query(`
                SELECT * FROM property WHERE property_id = ${propertyId}
            `);

            expect(deletedProperty).toHaveLength(0); // Should return an empty array

        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});
