// Importing the axios library
const axios = require('axios');

describe('Login -> Email Verification', () => {
    test('should return an error message when logging in with a non-existent email', async () => {
        // Define the request body with a non-existent email
        const requestBody = {
            email: 'nonexistent@example.com',
            password: 'password123'
        };

        try {
            // Send a POST request to log in with the non-existent email
            const response = await axios.post('http://127.0.0.1:3000/users/login', requestBody);

            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to non-existent email');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);

            // Verify if the error message indicates that the email does not exist
            expect(error.response.data.msg).toBe("Invalid credentials");
        }
    });

    test('should return an error message when logging in with an empty email', async () => {
        // Define the request body with an empty email
        const requestBody = {
            email: '',
            password: 'password123'
        };
    
        try {
            // Send a POST request to log in with the empty email
            await axios.post('http://127.0.0.1:3000/users/login', requestBody);
    
            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to empty email');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);

            // Verify if the error message indicates that the email is required
            expect(error.response.data.msg).toBe("Invalid credentials");
        }
    });

    test('should successfully find an account with correct email', async () => {
        // Define the request body with a correct email
        const requestBody = {
            email: 'mompedro1@gmail.com',
            password: 'simao123$'
        };
    
        try {
            // Send a POST request to log in with the correct email
            const response = await axios.post('http://127.0.0.1:3000/users/login', requestBody);
    
            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);
    
            // Verify if the response contains the success message
            expect(response.data.success).toBe(true);

            expect(response.data.msg).toBe("Auth successful");
        } catch (error) {
            // If an error occurs, fail the test
            throw error;
        }
    });
});

describe('Login -> Password Verification', () => {
    test('should return an error message when password is incorrect', async () => {
        // Define the request body with correct email and incorrect password
        const requestBody = {
            email: 'mompedro1@gmail.com',
            password: 'wrongpassword123#$'
        };
    
        try {
            // Send a POST request to log in with incorrect password
            await axios.post('http://127.0.0.1:3000/users/login', requestBody);
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to incorrect password');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);

            expect(error.response.data.success).toBe(false);
    
            // Verify if the error message indicates that the password is incorrect
            expect(error.response.data.msg).toBe("Invalid credentials");
        }
    });

    test('should return an error message when password is empty', async () => {
        // Define the request body with correct email and empty password
        const requestBody = {
            email: 'mompedro1@gmail.com',
            password: ''
        };
    
        try {
            // Send a POST request to log in with empty password
            await axios.post('http://127.0.0.1:3000/users/login', requestBody);
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to empty password');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);

            expect(error.response.data.success).toBe(false);
    
            // Verify if the error message indicates that the password is empty
            expect(error.response.data.msg).toBe("Invalid credentials");
        }
    });

    test('should return an access token when password is correct', async () => {
        // Define the request body with correct email and password
        const requestBody = {
            email: 'mompedro1@gmail.com',
            password: 'simao123$'
        };
    
        try {
            // Send a POST request to log in with correct password
            const response = await axios.post('http://127.0.0.1:3000/users/login', requestBody);
    
            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);
    
            // Verify if the response contains the success message
            expect(response.data.success).toBe(true);
    
            // Verify if the response contains the access token
            expect(response.data.accessToken).toBeDefined();
        } catch (error) {
            // If an error occurs, fail the test
            throw error;
        }
    });
});
