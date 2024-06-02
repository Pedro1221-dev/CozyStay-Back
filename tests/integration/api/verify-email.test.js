// Importing the axios library
const axios = require('axios');

// Importing all the models
const db = require("../../../models/index.js");

/**
 * Function to delete a user from the database.
 *
 * @param {string} userIdToDelete The ID of the user to delete.
 * @param {string} authToken The authentication token used for authorization.
 * @returns {Promise<void>} A promise that resolves after the user is deleted or rejects if an error occurs.
 */
const deleteUser = async (userIdToDelete, authToken) => {
    try {
        // Sends a request to delete the user using the user ID and the authentication token
        await axios.delete(`http://127.0.0.1:3000/users/${userIdToDelete}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
    } catch (error) {
        // If an error occurs while deleting the user, logs the error
        console.error('Error deleting user:', error);
    }
};

// Before all tests, authenticate and obtain the authentication token
/* beforeAll(async () => {
    try {
        // Send a request to authenticate the user and obtain the authentication token
        const authResponse = await axios.post('http://127.0.0.1:3000/users/login', {
            email: "mompedro1@gmail.com",
            password: "simao123$"
        });

        // Store the authentication token for later use
        authToken = authResponse.data.accessToken;
    } catch (error) {
        // Log an error if authentication fails
        console.error('Error getting authentication token:', error);
    }
}); */

describe('Email Verification', () => {
    // Define variable to store user ID
    //let userIdToDelete;
    
    test('should return an error message when user_id is missing', async () => {
        // Define the request body without the user_id, only with the otp
         const requestBody = {
            otp: '123456'
        };

        try {
            // Send a POST request to verify the email without the user_id
            await axios.post('http://127.0.0.1:3000/users/verify-email', requestBody);

            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to missing user_id');
        } catch (error) {
            // Verify if the error is due to the missing user_id
            expect(error.response.status).toBe(400); 
            
            // Verify if the error message is the expected one about the missing user_id
            expect(error.response.data.msg).toBe("User ID is required. Please provide a valid user ID.");
        }
    });

    test('should return an error message when OTP is missing', async () => {
        // Define the request body without the otp, only with the user_id
        const requestBody = {
            user_id: 374
        };

        try {
            // Send a POST request to verify the email without the otp
            await axios.post('http://127.0.0.1:3000/users/verify-email', requestBody);

            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to missing otp');
        } catch (error) {
            // Verify if the error is due to the missing otp
            expect(error.response.status).toBe(400); 

            // Verify if the error message is the expected one about the missing otp
            expect(error.response.data.msg).toBe("OTP is required. Please provide a valid OTP code.");
        }
    });

    test('should return an error message when OTP is incorrect', async () => {
        // Define the request body with a valid user_id and an incorrect otp
        const requestBody = {
            user_id: 380,
            otp: '431081'
        };

        try {
            // Send a POST request to verify the email with the incorrect otp
            await axios.post('http://127.0.0.1:3000/users/verify-email', requestBody);

            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to incorrect OTP');
        } catch (error) {
            // Verify if the error is due to the incorrect otp
            expect(error.response.status).toBe(400); 

            // Verify if the error message is the expected one about the invalid OTP
            expect(error.response.data.msg).toBe("Invalid OTP. Please try again.");
        }
    });

    test('should verify email successfully with valid user_id and otp', async () => {
        // Define valid user_id and otp
        const requestBody = {
            user_id: 374,
            otp: '122511'
        };
    
        try {
            // Send a POST request to verify the email with valid user_id and otp
            const response = await axios.post('http://127.0.0.1:3000/users/verify-email', requestBody);
    
            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);
    
            // Verify if the response contains the success message
            expect(response.data.success).toBe(true);
            expect(response.data.msg).toBe("User's email successfully verified");
    
            // Verify if the response contains the links for actions
            expect(response.data.links).toEqual([
                { "rel": "self", "href": `/user/${requestBody.user_id}`, "method": "GET" },
                { "rel": "delete", "href": `/user/${requestBody.user_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/user/${requestBody.user_id}`, "method": "PATCH" }
            ]);
        } catch (error) {
            console.log(error);
            // If an error occurs, fail the test
            throw error;
        }
    });

    test('should return an error message when verifying email for an already verified account', async () => {
        // Define user_id for an already verified account
        const requestBody = {
            user_id: 374,
            otp: '122511'
        };
    
        try {
            // Send a POST request to verify the email for the already verified account
            await axios.post('http://127.0.0.1:3000/users/verify-email', requestBody);
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail for already verified account');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);
    
            // Verify if the error message indicates that the account is already verified
            expect(error.response.data.success).toBe(false);
            expect(error.response.data.msg).toBe("Account record doesn't exist or has been verified already.");
        }
    });

    test('should return an error message when OTP is expired', async () => {
        // Define user_id and an expired otp
        const requestBody = {
            user_id: 379,
            otp: '354153' 
        };

        try {
            // Send a POST request to verify the email with an expired OTP
            await axios.post('http://127.0.0.1:3000/users/verify-email', requestBody);

            // If the request is successful, throw an error, as we expect a validation failure
            throw new Error('Expected request to fail due to expired OTP');
        } catch (error) {
            // Verify if the error is due to the expired OTP
            expect(error.response.status).toBe(400);

            // Verify if the error message is the expected one about the expired OTP
            expect(error.response.data.msg).toBe("The code has expired."); 
        }
    });

    test('should successfully verify email with valid user_id and otp and remove the otp record from the database', async () => {
        // Define valid user_id and otp
        const requestBody = {
            user_id: 381,
            otp: '431083'
        };

        try {
            // Send a POST request to verify the email with valid user_id and otp
            const response = await axios.post('http://127.0.0.1:3000/users/verify-email', requestBody);

            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);

            // Verify if the response contains the success message
            expect(response.data.success).toBe(true);
            expect(response.data.msg).toBe("User's email successfully verified");

            // Verify if the response contains the links for actions (HATEOAS)
            expect(response.data.links).toEqual([
                { "rel": "self", "href": `/user/${requestBody.user_id}`, "method": "GET" },
                { "rel": "delete", "href": `/user/${requestBody.user_id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/user/${requestBody.user_id}`, "method": "PATCH" }
            ]);

            // Verify if the user's email verification status is updated in the database
            const user = await db.user.findOne({ where: { user_id: requestBody.user_id } });
            expect(user.verified).toBe(true);

            // Verify if the OTP record is removed from the database
            const otpRecord = await db.user_otp.findOne({ where: { user_id: requestBody.user_id } });
            expect(otpRecord).toBeNull();
        } catch (error) {
            // If an error occurs, fail the test
            throw error;
        }
    });
});

