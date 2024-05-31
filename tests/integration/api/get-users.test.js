const axios = require('axios');

describe('Retrieve user list', () => {
    describe('Authentication check', () => {
        test('Sending a request without an authentication token in the Authorization header should return an error message', async () => {
            try {
                await axios.get('http://127.0.0.1:3000/users');
                // If the request is successful, it means the authentication check failed, so we throw an error
                throw new Error('Expected request to fail due to missing authentication token');
            } catch (error) {
                // Verify if the error is due to missing authentication token
                expect(error.response.status).toBe(401);
            }
        });

        test('Sending a request with an expired authentication token should return an error message', async () => {
            try {
                // Simulating an expired authentication token
                const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjQwMjIwMTkxQGVzbWFkLmlwcC5wdCIsInR5cGUiOiJ1c2VyIiwidXNlcl9pZCI6MTI4LCJpYXQiOjE3MTcxNzAzNDAsImV4cCI6MTcxNzE3Mzk0MH0.a6B0_kXXJKrr5AGkMD5Siy9u8zXcTmGLVEyaW9w2KCU';

                // Making a request with the expired token
                await axios.get('http://127.0.0.1:3000/users', {
                    headers: {
                        Authorization: `Bearer ${expiredToken}`
                    }
                });

                // If the request is successful, we throw an error
                throw new Error('The request should fail due to the expired authentication token');
            } catch (error) {
                // Verifying if the response returned a status code of 401 Unauthorized
                expect(error.response.status).toBe(401);
            }
        });

        test('Sending a request with an valid USER authentication token should return an error message', async () => {
            try {
                // Valid user authentication token
                const validUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjQwMjIwMTkxQGVzbWFkLmlwcC5wdCIsInR5cGUiOiJ1c2VyIiwidXNlcl9pZCI6MTI4LCJpYXQiOjE3MTcxNzAzNDAsImV4cCI6MTcxNzE3Mzk0MH0.a6B0_kXXJKrr5AGkMD5Siy9u8zXcTmGLVEyaW9w2KCU';

                // Making a request with the expired token
                await axios.get('http://127.0.0.1:3000/users', {
                    headers: {
                        Authorization: `Bearer ${validUserToken}`
                    }
                });

                // If the request is successful, we throw an error
                throw new Error('The request should fail due to the type of user not being an admin');
            } catch (error) {
                // Verifying if the response returned a status code of 403 Forbidden
                expect(error.response.status).toBe(403);
            }
        });

        test('Sending a request with a correct authentication token should not return any error', async () => {
            try {
                // Valid admin authentication token
                const validAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjQwMjIwMTkxQGVzbWFkLmlwcC5wdCIsInR5cGUiOiJhZG1pbiIsInVzZXJfaWQiOjEyOCwiaWF0IjoxNzE3MTcwNzQ1LCJleHAiOjE3MTcxNzQzNDV9.KWBsSDN6UN0-sv8gkHRpsHhQrSWQmlAFIy3UeNKrlbI';

                // Making a request with the valid token
                const response = await axios.get('http://127.0.0.1:3000/users', {
                    headers: {
                        Authorization: `Bearer ${validAdminToken}`
                    }
                });

                // If the request is successful, we expect no error
                expect(response.status).toBe(200);
            } catch (error) {
                // If an error occurs, we throw it
                throw error;
            }
        });

     
    });
});


