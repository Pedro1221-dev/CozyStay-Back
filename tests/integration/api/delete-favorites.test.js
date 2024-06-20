const axios = require('axios');

describe('Remove from Favorites - Error Handling', () => {
    let authToken;
    let nonExistentPropertyId = 9999;
    let nonFavoritePropertyId = 5;
    let propertyIdToAddAndRemove = 1;

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

    test('Send request to remove a non-existent property from favorites', async () => {
        try {
            const response = await axios.delete(`http://127.0.0.1:3000/users/current/favorites/${nonExistentPropertyId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            throw new Error('Supposed to fail');
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.msg).toBe(`Property with ID ${nonExistentPropertyId} not found.`);
        }
    });

    test('Send request to remove a property not in favorites', async () => {
        try {
            const response = await axios.delete(`http://127.0.0.1:3000/users/current/favorites/${nonFavoritePropertyId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            throw new Error('Supposed to fail');
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.msg).toBe(`Property with ID ${nonFavoritePropertyId} is not in the user's favorites.`);
        }
    });

    test('Add property to favorites and then remove it', async () => {
        try {
            const addToFavoritesResponse = await axios.post(`http://127.0.0.1:3000/users/current/favorites`, {
                property_id: propertyIdToAddAndRemove
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const removeFromFavoritesResponse = await axios.delete(`http://127.0.0.1:3000/users/current/favorites/${propertyIdToAddAndRemove}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(removeFromFavoritesResponse.status).toBe(200);
            expect(removeFromFavoritesResponse.data.success).toBe(true);
            expect(removeFromFavoritesResponse.data.msg).toBe("Property removed from favorites successfully.");
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error;
        }
    });
});
