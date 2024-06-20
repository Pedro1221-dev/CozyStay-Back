require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Database Integration Tests - Select One Property', () => {
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

    test('Get a property with a non-existent property_id', async () => {
        try {
                // Select a property with a non-existent property_id
                const result = await sequelize.query(`
                    SELECT * FROM property WHERE property_id = 999999
                `)            

                //console.log(result);
                expect(result[0]).toHaveLength(0)
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });

    test('Get a specific property with a valid property_id', async () => {
        const existingPropertyId = 1; 

        try {
            // Select a property with an existing property_id
            const result = await sequelize.query(`SELECT * FROM property WHERE property_id = ${existingPropertyId}`);

            // Check if the property is returned correctly
            expect(result[0]).toHaveLength(1);
            const property = result[0][0];
            expect(property.property_id).toBe(existingPropertyId);
            expect(property).toHaveProperty('title');
            expect(property).toHaveProperty('city');
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});

