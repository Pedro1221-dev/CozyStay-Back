const axios = require('axios');

describe('Add to Favorites - Error Handling', () => {
    let authToken;
    let nonExistentPropertyId = 9999;
    let existingPropertyId = 3; 
    let propertyToAddId = 5; 

    beforeAll(async () => {
        try {
            const loginResponse = await axios.post('http://127.0.0.1:3000/users/login', {
                email: 'mompedro1@gmail.com',
                password: 'simao123$'
            });
            authToken = loginResponse.data.accessToken;
        } catch (error) {
            console.error('Error setting up test:', error);
            throw error; 
        }
    });

    test('Send request for a non-existent property', async () => {
        try {
            const response = await axios.post('http://127.0.0.1:3000/users/current/favorites', {
                property_id: nonExistentPropertyId 
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })

            throw new Error('Supposed to fail')
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.msg).toBe(`Property with ID ${nonExistentPropertyId} not found.`);
        }
    });

    test('Send request for an existing property in favorites', async () => {
        try {
            // Send a POST request to add an existing property to favorites
            const response = await axios.post('http://127.0.0.1:3000/users/current/favorites', {
                property_id: existingPropertyId 
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            // If the request succeeds unexpectedly, throw an error
            throw new Error('Expected request to fail');
        } catch (error) {
            // Expect the response status to be 400 and the error message to match
            expect(error.response.status).toBe(400);
            expect(error.response.data.msg).toBe(`Property with ID ${existingPropertyId} is already in favorites.`);
        }
    });

    test('Send request to add property to favorites', async () => {
        try {
            // Send a POST request to add a property to favorites
            const response = await axios.post('http://127.0.0.1:3000/users/current/favorites', {
                property_id: propertyToAddId 
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            // Expect the response to have a success message
            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.msg).toBe('Property added to the favorites sucessfully.');
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            const removeResponse = await axios.delete(`http://127.0.0.1:3000/users/current/favorites/${propertyToAddId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

        } catch (error) {
            console.error('Error during remove property test:', error);
            throw error;
        }
    });
});
