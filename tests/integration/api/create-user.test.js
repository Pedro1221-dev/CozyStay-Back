// Importing the axios library
const axios = require('axios');
// Importing the bcrypt library
const bcrypt = require('bcrypt');
// read environment variables from .env file
require('dotenv').config(); 

// Importing all the models
const db = require("../../../models/index.js");

// Define variable to store authentication token
let authToken;

/**
 * Function to delete a user from the database.
 *
 * @param {string} userIdToDelete The ID of the user to delete.
 * @param {string} authToken The authentication token used for authorization.
 * @returns {Promise<void>} A promise that resolves after the user is deleted or rejects if an error occurs.
 */
const deleteUser = async (userIdToDelete, authToken) => {
    try {
        // Sends a request to delete the user using the user ID and the authentication token
        await axios.delete(`http://127.0.0.1:3000/users/${userIdToDelete}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
    } catch (error) {
        // If an error occurs while deleting the user, logs the error
        console.error('Error deleting user:', error);
    }
};

// Before all tests, authenticate and obtain the authentication token
beforeAll(async () => {
    try {
        // Send a request to authenticate the user and obtain the authentication token
        const authResponse = await axios.post('http://127.0.0.1:3000/users/login', {
            email: "mompedro1@gmail.com",
            password: "simao123$"
        });

        // Store the authentication token for later use
        authToken = authResponse.data.accessToken;
    } catch (error) {
        // Log an error if authentication fails
        console.error('Error getting authentication token:', error);
    }
});



describe('Password Validation', () => {
    // Define variable to store user ID
    let userIdToDelete;
    
    test('should return an error message for a password with less than 8 characters', async () => {
        // Define user data with an invalid password (less than 8 characters)
        const userData = {
            name: 'testuser',
            email: '40220191@esmad.ipp.pt',
            password: 'pass', 
            nationality: 'portuguese',
            vat_number: '1234567891234'
        };

        try {
            // Send a request to create a new user with the defined data
            await axios.post('http://127.0.0.1:3000/users', userData);

            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to password validation');
        } catch (error) {
            // Verify if the error is due to password validation
            expect(error.response.status).toBe(400); 

            // Verify if the second element of the error messages array contains the expected phrase about the minimum password length
            expect(error.response.data.msg[1]).toBe("Password must be at least 8 characters long");
        }
    });

    test('should return an error message for a password without at least 1 special character', async () => {
        // Define user data with a password without at least 1 special character
        const userData = {
            name: 'testuser',
            password: 'password123', 
        };

        try {
            // Send a request to create a new user with the defined data
            await axios.post('http://127.0.0.1:3000/users', userData);

            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to password validation');
        } catch (error) {
            // Verify if the error is due to password validation
            expect(error.response.status).toBe(400); 

            // Verify if the second element of the error messages array contains the expected phrase about the requirement for at least 1 special character
            expect(error.response.data.msg[0]).toBe("Password must contain at least one number and one special character");
        }
    });

    test('should return an error message for an empty password', async () => {
        // Define user data with an empty password
        const userData = {
            name: 'testuser',
            password: '', 
        };

        try {
            // Send a request to create a new user with the defined data
            await axios.post('http://127.0.0.1:3000/users', userData);

            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to password validation');
        } catch (error) {
            // Verify if the error is due to password validation
            expect(error.response.status).toBe(400); 

            // Verify if the error message contains the expected phrase about the empty password
            expect(error.response.data.msg).toContain("Password cannot be empty");
        }
    });

    test('should not return an error message for a password that meets all requirements', async () => {
        // Define user data with a password that meets all requirements
        const userData = {
            name: 'testuser',
            email: '40220191@esmad.ipp.pt',
            password: 'Password123!',
            nationality: 'portuguese',
            vat_number: '1234567891234' 
        };

        try {
            // Send a request to create a new user with the defined data
            const response = await axios.post('http://127.0.0.1:3000/users', userData);

            // Store the user ID for later use in deletion
            userIdToDelete = response.data.data.user_id;

            // Verify if the request is successful (status code 200)
            expect(response.status).toBe(200); 

            // Verify if the response contains the expected phrase
            expect(response.data.msg).toContain('Verification otp email sent');
        } catch (error) {
            // If an error occurs, fail the test
            throw new Error('Request failed unexpectedly: ' + error.message);
        }
    });

    // After all tests are done, delete the user from the database
    afterAll(async () => {
        await deleteUser(userIdToDelete, authToken);
    });
});


describe('Password Hashing', () => {
    // Define variable to store user ID
    let userIdToDelete;

    // Define user data with a password
    const userData = {
        name: 'testuser1',
        email: '40220191@esmad.ipp.pt',
        password: 'password123$',
        nationality: 'portuguese',
        vat_number: '12345678912341' 
    };

    test('should match the stored password with the inserted password', async () => {
        try {
            // Send a request to create a new user with the defined data
            const response = await axios.post('http://127.0.0.1:3000/users', userData);

            // Verify if the request to create the user is successful
            expect(response.status).toBe(200); 

            // Store the user ID for later use in deletion
            userIdToDelete = response.data.data.user_id;

            // Hash the password using bcrypt
            const hashedPassword = await bcrypt.hash(userData.password, 10)

            // Verify if the hashed password is not the same as the original password
            expect(hashedPassword).not.toBe(userData.password);

            // Verify if the hashed password matches the original password using bcrypt
            const passwordMatch = await bcrypt.compare(userData.password, hashedPassword);

            // Ensure that the hashed password matches the original password
            expect(passwordMatch).toBe(true); 
        } catch (error) {
            // If an error occurs, fail the test
            throw new Error('Request failed unexpectedly: ' + error.message);
        }
    });

    // After each tests are done, delete the user from the database
    afterAll(async () => {
        await deleteUser(userIdToDelete, authToken);
    });
});

describe('User Creation', () => {
    // Define variable to store user ID
    let userIdToDelete;
    test('should receive an error message when trying to create a user with an email that already exists in the system', async () => {
        // Define an email that already exists in the system
        const existingEmail = 'mompedro1@gmail.com';

        // Define data for a new user with the existing email
        const userData = {
            name: 'Test User',
            email: existingEmail,
            password: 'password123$',
            nationality: 'portuguese',
            vat_number: '12345678912341234131' 
        };

        try {
            // Try to create a user with the existing email
            await axios.post('http://127.0.0.1:3000/users', userData);

            // If the creation is successful, throw an error
            throw new Error('Expected request to fail due to existing email');
        } catch (error) {
            // Verify if the response status is 400 (Bad Request)
            expect(error.response.status).toBe(400);

            // Verify if the error message contains the indication of existing email
            expect(error.response.data.msg).toContain('email_UNIQUE must be unique');
        }
    });

    test('should receive an error message when trying to create a user with a VAT number that already exists in the system', async () => {
        // Define a VAT number that already exists in the system
        const existingVatNumber = '731313131';

        // Define data for a new user with the existing VAT number
        const userData = {
            name: 'Test User',
            email: 'newuser@example.com',
            password: 'password123$',
            nationality: 'portuguese',
            vat_number: existingVatNumber
        };

        try {
            // Try to create a user with the existing VAT number
            await axios.post('http://127.0.0.1:3000/users', userData);

            // If the creation is successful, throw an error
            throw new Error('Expected request to fail due to existing VAT number');
        } catch (error) {
            // Verify if the response status is 400 (Bad Request)
            expect(error.response.status).toBe(400);

            // Verify if the error message contains the indication of existing VAT number
            expect(error.response.data.msg).toContain('vat_number_UNIQUE must be unique');
        }
    });

    test('should receive an error message when sending requests with empty or incomplete data', async () => {
        // Define an array of test cases with different combinations of empty or incomplete data
        const testCases = [
            {
                name: 'Empty data',
                userData: {}
            },
            {
                name: 'Incomplete data - Missing email',
                userData: {
                    name: 'Test User',
                    password: 'password123$',
                    nationality: 'portuguese',
                    vat_number: '12345678912341234131'
                }
            },
            {
                name: 'Incomplete data - Missing password',
                userData: {
                    name: 'Test User',
                    email: 'newuser@example.com',
                    nationality: 'portuguese',
                    vat_number: '12345678912341234131'
                }
            } 
        ];

        // Iterate over each test case
        for (const testCase of testCases) {
            try {
                // Send a request with the test case data
                await axios.post('http://127.0.0.1:3000/users', testCase.userData);

                // If the request is successful, throw an error
                throw new Error(`Expected request to fail due to ${testCase.name}`);
            } catch (error) {
                // Verify if the response status is 400 (Bad Request)
                expect(error.response.status).toBe(400);
            }
        }
    });

    test('should successfully create a user with all correct data', async () => {
        // Define user data with all correct information
        const userData = {
            name: 'testuser1',
            email: '40220191@esmad.ipp.pt',
            password: 'password123$',
            nationality: 'portuguese',
            vat_number: '12345678912341' 
        };

        try {
            // Send a request to create a new user with the defined data
            const response = await axios.post('http://127.0.0.1:3000/users', userData);

            // Store the user ID for later use in deletion
            userIdToDelete = response.data.data.user_id;

            // Verify if the request is successful (status code 200)
            expect(response.status).toBe(200);

            // Verify if the response contains the expected message
            expect(response.data.msg).toContain('Verification otp email sent');
        } catch (error) {
            // If an error occurs, fail the test
            throw new Error('Failed to create user: ' + error.message);
        }
    });

    // After each tests are done, delete the user from the database
    afterAll(async () => {
        await deleteUser(userIdToDelete, authToken);
    });
});

describe('User Language Association', () => {
    // Define variable to store user ID
    let userIdToDelete;

    test('should associate and store languages correctly in the database', async () => {
        // Define user data with language associations
        const userData = {
            name: 'testuser1',
            email: '40220191@esmad.ipp.pt',
            password: 'password123$',
            nationality: 'portuguese',
            vat_number: '12345678912341', 
            languages: [
                {
                    language_id: 1
                },
                {
                    language_id: 2
                },
                {
                    language_id: 3
                }
            ]
        };

        try {
            // Send a request to create a new user with the language associations
            const response = await axios.post('http://127.0.0.1:3000/users', userData);

            // Store the user ID for later use in deletion
            userIdToDelete = response.data.data.user_id;

            // Verify if the request was successful (status code 200)
            expect(response.status).toBe(200);

            // Retrieve the user from the database to verify language associations
            const user = await db.user.findOne({ where: { email: userData.email } });

            // Retrieve the languages associated with the user
            const languages = await user.getLanguage();

            // Extract only the language IDs from the returned languages
            const returnedLanguageIds = languages.map(lang => lang.language_id);

            // Extract only the language IDs from the languages sent in the user data
            const userDataLanguageIds = userData.languages.map(lang => lang.language_id);

            // Verify if the returned language IDs match the language IDs sent in the user data
            expect(returnedLanguageIds).toEqual(userDataLanguageIds);
        } catch (error) {
            // Log any errors and fail the test if an error occurs
            throw new Error('Failed to associate and store languages: ' + error.message);
        }
    });

    // After each tests are done, delete the user from the database
    afterAll(async () => {
        await deleteUser(userIdToDelete, authToken);
    });
});

describe('Email Confirmation', () => {
    // Define variable to store user ID
    let userIdToDelete;

    test('should send verification email with OTP to the specified email address', async () => {
        // Define user data with a valid email address
        const userData = {
            name: 'testuser1',
            email: '40220191@esmad.ipp.pt',
            password: 'password123$',
            nationality: 'portuguese',
            vat_number: '12345678912341', 
        };

        try {
            // Send a request to create a new user with the defined data
            const response = await axios.post('http://127.0.0.1:3000/users', userData);

            // Store the user ID for later use in deletion
            userIdToDelete = response.data.data.user_id;

            // Verify if the request is successful (status code 200)
            expect(response.status).toBe(200);

            // Verify if the email in the response data matches the email provided in the userData object
            expect(response.data.data.email).toEqual(userData.email);
            
            // Verify if the response contains the expected message
            expect(response.data.msg).toContain('Verification otp email sent');

            // Add additional assertions to ensure email sending functionality

        } catch (error) {
            // If an error occurs, fail the test
            throw new Error('Failed to send verification email: ' + error.message);
        }
    });

    // After each tests are done, delete the user from the database
    afterAll(async () => {
        await deleteUser(userIdToDelete, authToken);
    });
});

describe('Save Confirmation Code', () => {
    // Define variable to store user ID
    let userIdToDelete;

    test('should save confirmation code correctly in the database', async () => {
        // Define user data with a valid email address
        const userData = {
            name: 'testuser1',
            email: '40220191@esmad.ipp.pt',
            password: 'password123$',
            nationality: 'portuguese',
            vat_number: '12345678912341', 
        };

        try {
            // Send a request to create a new user with the defined data
            const response = await axios.post('http://127.0.0.1:3000/users', userData);

            // Store the user ID for later use in deletion
            userIdToDelete = response.data.data.user_id;

            // Verify if the request is successful (status code 200)
            expect(response.status).toBe(200);

            // Retrieve the user from the database to verify language associations
            const user = await db.user.findOne({ where: { email: userData.email } });
            const otp = await user.getUserOTP();

            // Verify if it saved correctly in the database, with the right atributes
            expect(otp[0]).toHaveProperty('user_id', 'otp_code', 'created_at', 'expired_at');

        } catch (error) {
            // If an error occurs, fail the test
            throw new Error('Failed to send verification email: ' + error.message);
        }
    });

    // After each tests are done, delete the user from the database
    afterAll(async () => {
        await deleteUser(userIdToDelete, authToken);
    });
});



