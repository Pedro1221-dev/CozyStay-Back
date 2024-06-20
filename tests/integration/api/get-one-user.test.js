// Importing the axios library
const axios = require('axios');

describe('Retrieve a user', () => {
  
    test('Send a request to retrieve a non-existent user', async () => {
      const userId = 999; // ID that does not exist
  
      try {
        await axios.get(`http://127.0.0.1:3000/users/${userId}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.msg).toBe("User with ID 999 not found.");
      }
    });
  
    test('Send a request to retrieve an existing user', async () => {
      const userId = 1; 
  
      const response =  await axios.get(`http://127.0.0.1:3000/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('user_id', userId);
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('email');
    });
  
  });