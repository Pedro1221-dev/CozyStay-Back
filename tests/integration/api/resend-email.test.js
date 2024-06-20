// Importing the axios library
const axios = require('axios');

describe('Resend email to specific user', () => {
    test('Send request without user_id', async () => {
        try {
            const bodyData = {
                "user_id": 196,
                "email": "mompedro1@gmail.com"
            }

            const response = await axios.post(`http://127.0.0.1:3000/users/resend-email`, bodyData);

            expect(response.status).toBe(200);
            expect(response.data.msg).toBe(`Verification otp email sent`);
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error;
        }
    });
});

