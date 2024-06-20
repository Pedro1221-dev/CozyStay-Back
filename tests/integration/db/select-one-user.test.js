require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Database Integration Tests - Select One User', () => {
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

    test('Get a user with a non-existent user_id', async () => {
        try {
                // Select a user with a non-existent user_id
                const result = await sequelize.query(`
                    SELECT * FROM user WHERE user_id = 999999
                `)            

                //console.log(result);
                expect(result[0]).toHaveLength(0)
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });

    test('Get a specific user with a valid user_id', async () => {
        const existingUserId = 1; 

        try {
            // Select a user with an existing user_id
            const result = await sequelize.query(`SELECT * FROM user WHERE user_id = ${existingUserId}`);

            // Check if the user is returned correctly
            expect(result[0]).toHaveLength(1);
            const user = result[0][0];
            expect(user.user_id).toBe(existingUserId);
            expect(user).toHaveProperty('name');
            expect(user).toHaveProperty('email');
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});

