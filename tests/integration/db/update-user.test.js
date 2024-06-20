require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);


describe('Database Integration Tests - Update a Specific User in the Database', () => {
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

    test('Update a user with a non-existent user_id', async () => {
        const nonExistentUserId = 999999; 
        const updatedUserData = {
            name: "Updated Name",
        };

        try {
            // Attempt to update a user with a non-existent user_id
            const [results] = await sequelize.query(`
                UPDATE user
                SET name = '${updatedUserData.name}'
                WHERE user_id = ${nonExistentUserId}
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

    test('Update a specific user in the user table', async () => {
        try {
            // Insert a new user
            const result = await sequelize.query(`
                INSERT INTO user (name, password, nationality, vat_number, email)
                VALUES ('Teste', 'Password123!', 'Portuguese', '1234567891234313455', 'teste@mail.com')
            `)     

            // Get the inserted user's ID
            const [insertedUser] = await sequelize.query(`
                SELECT user_id FROM user WHERE email = 'teste@mail.com'
            `);
            const userId = insertedUser[0].user_id;

            // Update the inserted user
            const updateResult = await sequelize.query(`
                UPDATE user
                SET name = 'Updated Teste'
                WHERE user_id = ${userId}
            `);

            // Verify the update was successful
            const [updatedUser] = await sequelize.query(`
                SELECT * FROM user WHERE user_id = ${userId}
            `);

            expect(updatedUser[0]).toBeDefined();
            expect(updatedUser[0].name).toBe('Updated Teste');

            // Clean up: Remove the inserted user
            await sequelize.query(`
                DELETE FROM user WHERE user_id = ${userId}
            `);
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});
