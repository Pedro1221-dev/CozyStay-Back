const axios = require('axios');

describe('Forgot Password - Send email to recover password', () => {
    test('Send request without email', async () => {
        try {
            const bodyData = {
                 "email": "nonExistant@gmail.com"
            }

            const response = await axios.post(`http://127.0.0.1:3000/users/forgot-password`, bodyData);

            throw new Error('Supposed to fail')
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.msg).toBe(`The user was not found`);
        }
    });

    test('Send well-formed request', async () => {
        const bodyData = {
            email: 'mompedro1@gmail.com'
        };

        try {
            const response = await axios.post(`http://127.0.0.1:3000/users/forgot-password`, bodyData);

            expect(response.status).toBe(200);
            expect(response.data.msg).toBe('Reset password email sent');
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error;
        }
    });
});



