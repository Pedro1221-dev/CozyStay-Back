// Importing the axios library
const axios = require('axios');

// Define variable to store authentication token
let userAuthToken;
let adminAuthToken;

// Define variable to store user ID
let userToDeleteIdByUser;
let userToDeleteIdByAdmin;

// Before all tests, authenticate and obtain the authentication token
beforeAll(async () => {
    try {
        // Authenticate the regular user
        const userAuthResponse = await axios.post('http://127.0.0.1:3000/users/login', {
            email: "40220191@esmad.ipp.pt",
            password: "simao123$"
        });
        userAuthToken = userAuthResponse.data.accessToken;

        // Authenticate the admin user (assuming you have admin credentials)
        const adminAuthResponse = await axios.post('http://127.0.0.1:3000/users/login', {
            email: "mompedro1@gmail.com", 
            password: "simao123$"
        });
        adminAuthToken = adminAuthResponse.data.accessToken;
    } catch (error) {
        // Log an error if authentication fails
        console.error('Error getting authentication token:', error);
    }
});

/**
 * Function to delete a user from the database.
 *
 * @param {string} userIdToDelete The ID of the user to delete.
 * @param {string} adminAuthToken The authentication token used for authorization.
 * @returns {Promise<void>} A promise that resolves after the user is deleted or rejects if an error occurs.
 */
const deleteUser = async (userIdToDelete, adminAuthToken) => {
    try {
        // Sends a request to delete the user using the user ID and the authentication token
        await axios.delete(`http://127.0.0.1:3000/users/${userIdToDelete}`, {
            headers: {
                'Authorization': `Bearer ${adminAuthToken}`
            }
        });
    } catch (error) {
        // If an error occurs while deleting the user, logs the error
        console.error('Error deleting user:', error);
    }
};

describe('Delete a user', () => {
    test('Send a request as a user to delete another user\'s account', async () => {
        const userData = {
            name: 'testuser',
            email: 'example@mail.com',
            password: 'Password123!',
            nationality: 'portuguese',
            vat_number: '1234567891234' 
        };
  
        try {
            // Send a request to create a new user with the defined data
            const response = await axios.post('http://127.0.0.1:3000/users', userData);

            // Store the user ID for later use in deletion
            userToDeleteIdByUser = response.data.data.user_id;


            await axios.delete(`http://127.0.0.1:3000/users/${userToDeleteIdByUser}`, {
                headers: {
                    'Authorization': `Bearer ${userAuthToken}`
                }
            });
        } catch (error) {
            console.log(error);
            expect(error.response.status).toBe(403);
            expect(error.response.data.msg).toBe("Unauthorized: You don't have permission to perform this action.");
        }
    });

    test('Send a request as an admin to delete a user\'s account', async () => {
        const userData = {
            name: 'testuser',
            email: 'example1@mail.com',
            password: 'Password123!',
            nationality: 'portuguese',
            vat_number: '12345678912341' 
        };
  
        try {
            // Send a request to create a new user with the defined data
            const response = await axios.post('http://127.0.0.1:3000/users', userData);

            // Store the user ID for later use in deletion
            userToDeleteIdByAdmin = response.data.data.user_id;

            // Attempt to delete the user with admin token
            const deleteResponse = await axios.delete(`http://127.0.0.1:3000/users/${userToDeleteIdByAdmin}`, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });

            // Expect a successful deletion
            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.data.msg).toBe(`User with id ${userToDeleteIdByAdmin} was successfully deleted!`);
        } catch (error) {
            console.error('Error during test execution:', error);
        }
    });

    test('Send a request to delete my own account', async () => {
        let idToDelete
        let token

        const userData = {
            name: 'John Doe',
            email: 'example2@mail.com',
            password: 'Password123!',
            nationality: 'portuguese',
            vat_number: '12345678912343134' 
        };

        const loginData = {
            email: 'example2@mail.com',
            password: 'Password123!',
        };

        try {
            const response = await axios.post('http://127.0.0.1:3000/users', userData);
            idToDelete = response.data.data.user_id; 

            const responseLogin = await axios.post('http://127.0.0.1:3000/users/login', loginData);
            token = responseLogin.data.accessToken; 

            const deleteResponse = await axios.delete(`http://127.0.0.1:3000/users/${idToDelete}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.data.msg).toBe(`User with id ${idToDelete} was successfully deleted!`);

        } catch (error) {
            console.error('Error creating user account:', error);
            throw error; 
        }
    });

    // After all tests are done, delete the user from the database
    afterAll(async () => {
        if (userToDeleteIdByUser) {
            await deleteUser(userToDeleteIdByUser, adminAuthToken);
        }
        if (userToDeleteIdByAdmin) {
            await deleteUser(userToDeleteIdByAdmin, adminAuthToken);
        }    
    });
});