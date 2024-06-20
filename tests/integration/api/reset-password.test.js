const axios = require('axios');

describe('Reset Password - Reset user password', () => {
    test('Send request with mismatching passwords', async () => {
        const resetToken = '65802adf5346a87534f63d2b9bae1d74e6b88e437229fbf20f57ebca239a58b1466fbfadb826cd337c53c45de267c0d92fc4755453d0ef3f70ed2aa18a7af738'; 
        const requestData = {
            password: 'pass123$',
            confirmPassword: 'pass123!'
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/reset-password/${resetToken}`, requestData);

            throw new Error('Supposed to fail')
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.msg).toBe(`Passwords do not match`);
        }
    });

    test('Send request with an invalid token', async () => {
        const usedToken = '7ee8e967ce348e65408f43252bda5587edab202fa89a169254c5ca7db054582c2c294477eca23c45593e8fdf7ad9b542cf1313d2a5239a6166bc58568e855f85'; 

        const requestData = {
            password: 'newPass123$',
            confirmPassword: 'newPass123$'
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/reset-password/${usedToken}`, requestData);

            throw new Error('Expected the request to fail due to invalid token');
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.msg).toBe('Password token record not found or has already been used.');
        }
    });

    test('Send request with valid token and password', async () => {
        const validToken = '65802adf5346a87534f63d2b9bae1d74e6b88e437229fbf20f57ebca239a58b1466fbfadb826cd337c53c45de267c0d92fc4755453d0ef3f70ed2aa18a7af738'; 
        const requestData = {
            password: 'newPass123$',
            confirmPassword: 'newPass123$'
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/reset-password/${validToken}`, requestData);

            expect(response.status).toBe(200);
            expect(response.data.msg).toBe('Password sucessfully reset');
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    });
});
