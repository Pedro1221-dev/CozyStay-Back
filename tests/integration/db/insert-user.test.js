require('dotenv').config(); // read environment variables from .env file
const db = require("../../../models/index");
const sequelize = db.sequelize;
const dbConfig = require('../../../config/db.config.js');
console.log(dbConfig);

//console.log(sequelize);

describe('Insert User into Database', () => {
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

    test('Insert a new user into the users table with valid information', async () => {
        try {
                // Insert a new user using Sequelize query method
                const result = await sequelize.query(`
                    INSERT INTO user (name, password, nationality, vat_number, email)
                    VALUES ('Teste', 'Password123!', 'Portuguese', '1234567891234313455', 'teste@mail.com')
                `)            

                // Check if the insertion was successful
                expect(result).toBeTruthy();

                // Check in the database if the user was inserted correctly
                const insertedUser = await sequelize.query(`SELECT * FROM user WHERE email = 'teste@mail.com'`);
                

                // Clean up: Remove the inserted user from the database
                await sequelize.query(`DELETE FROM user WHERE email = 'teste@mail.com'`)
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; // Throw error to fail the test if any assertion or operation fails
        }
    });
});

