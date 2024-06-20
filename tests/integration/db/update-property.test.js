require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);


describe('Database Integration Tests - Update a Specific Property in the Database', () => {
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

    test('Update a property with a non-existent property_id', async () => {
        const nonExistantPropertyId = 999999; 
        const updatedPropertyData = {
            title: "Updated Title",
        };

        try {
            // Attempt to update a property with a non-existent property_id
            const [results] = await sequelize.query(`
                UPDATE property
                SET title = '${updatedPropertyData.title}'
                WHERE property_id = ${nonExistantPropertyId}
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

    test('Update a specific property in the property table', async () => {
        try {
            // Insert a new property
            const result = await sequelize.query(`
                INSERT INTO property (owner_id, title, city, country, address, number_bathrooms, number_beds, number_bedrooms, number_guests_allowed, description, price, typology)
                VALUES (1, 'Test Property', 'City Name', 'Country Name', '123 Main St', 2, 3, 3, 6, 'This is a test property description.', 150.00, 'Apartment')
            `);   

            // Get the inserted property's ID
            const [insertedProperty] = await sequelize.query(`
                SELECT * FROM property WHERE title = 'Test Property' AND owner_id = 1
            `);
            const propertyId = insertedProperty[0].property_id;
            // Update the inserted property
            const updateResult = await sequelize.query(`
                UPDATE property
                SET title = 'Updated Teste'
                WHERE property_id = ${propertyId}
            `);

            // Verify the update was successful
            const [updatedProperty] = await sequelize.query(`
                SELECT * FROM property WHERE property_id = ${propertyId}
            `);

            expect(updatedProperty[0]).toBeDefined();
            expect(updatedProperty[0].title).toBe('Updated Teste');

            // Clean up: Remove the inserted property
            await sequelize.query(`
                DELETE FROM property WHERE property_id = ${propertyId}
            `);
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});
