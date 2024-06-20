require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Database Integration Tests - Delete a Specific User from the Database', () => {
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

    test('Delete a specific user from the user table', async () => {
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

            // Delete the inserted user
            const deleteResult = await sequelize.query(`
                DELETE FROM user WHERE user_id = ${userId}
            `);

            // Verify the deletion was successful
            const [deletedUser] = await sequelize.query(`
                SELECT * FROM user WHERE user_id = ${userId}
            `);

            expect(deletedUser).toHaveLength(0); // Should return an empty array

        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});
