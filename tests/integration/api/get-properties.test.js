const axios = require('axios');

describe('Get User Properties', () => {
    let userIdWithoutProperties;
    let authToken;
    let userWithPropertiesAuthToken;

    beforeAll(async () => {
        try {
            const userData = {
                name: 'John Doe',
                email: 'example5@mail.com',
                password: 'Password123!',
                nationality: 'portuguese',
                vat_number: '12345678912343134' 
            };

            const response = await axios.post('http://127.0.0.1:3000/users', userData);
            userIdWithoutProperties = response.data.data.user_id; 

            const loginResponse = await axios.post('http://127.0.0.1:3000/users/login', {
                email: userData.email,
                password: userData.password
            });
            authToken = loginResponse.data.accessToken;

            const loginWithPropertiesResponse = await axios.post('http://127.0.0.1:3000/users/login', {
                email: 'mompedro1@gmail.com',
                password: 'simao123$'
            });
            userWithPropertiesAuthToken = loginWithPropertiesResponse.data.accessToken;
        } catch (error) {
            console.error('Error setting up test:', error);
            throw error;
        }
    });

    test('Send request for a user without properties', async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:3000/users/current/properties`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            
            throw new Error('Supposed to fail')
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.msg).toBe(`Properties for owner with ID ${userIdWithoutProperties} not found.`);
        }
    });

    test('Send request to get user properties', async () => {
        try {
            const response = await axios.get('http://127.0.0.1:3000/users/current/properties', {
                headers: {
                    'Authorization': `Bearer ${userWithPropertiesAuthToken}`
                }
            });

            expect(response.status).toBe(200);
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; 
        }
    });

    afterAll(async () => {
        try {
            await axios.delete(`http://127.0.0.1:3000/users/${userIdWithoutProperties}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        } catch (error) {
            console.error('Error cleaning up test:', error);
            throw error;
        }
    });
});
