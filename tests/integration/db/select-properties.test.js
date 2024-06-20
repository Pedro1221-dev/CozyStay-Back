require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Database Integration Tests - Select All Properties', () => {
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

    test('Fetch all properties from the database', async () => {
        try {
                // Insert a new user using Sequelize query method
                const result = await sequelize.query(`
                    SELECT * FROM property
                `)            

                //console.log(result);
                // Check if the insertion was successful
                expect(result).toBeTruthy();
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});

