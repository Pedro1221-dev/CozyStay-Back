// Importing the jsonwebtoken library
const jwt = require('jsonwebtoken');

// Importing middleware functions
const checkAuth = require('../../middleware/check-auth');

// Loads environment variables from the .env file
require('dotenv').config();


describe('Auth Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        // Set up a clean initial state for each test
        req = {
            headers: {
                authorization: ''
            }
        };

        // Mock HTTP response
        res = {
            // Mock status function that returns res to allow chaining calls
            status: jest.fn(() => res),
            // Mock json function
            json: jest.fn(() => res)
        };

        // Mock the next function to verify if it's called
        next = jest.fn();

        // Set the JWT secret key for the test environment
        process.env.JWT_KEY = 'testsecret'; 
    });

    test('should return an error message for an invalid token', async () => {
        // Set an invalid token in the authorization header
        req.headers.authorization = 'Bearer invalidtoken';

        // Execute the authentication middleware with mocked request, response, and next
        await checkAuth(req, res, next);

        // Verify if the status response was called with 401 (unauthorized)
        expect(res.status).toHaveBeenCalledWith(401);

        // Verify if the JSON response contains the correct error message
        expect(res.json).toHaveBeenCalledWith({
            msg: 'No access token provided'
        });

        // Verify if the next function was not called
        expect(next).not.toHaveBeenCalled();
    });

    test('should return an error message for an expired token', async () => {
        // Setting an expired token
        const expiredToken = jwt.sign({ userId: '123' }, 'testsecret', { expiresIn: '-1s' });
        
        // Set an invalid token in the authorization header
        req.headers.authorization = `Bearer ${expiredToken}`;

        // Execute the authentication middleware with mocked request, response, and next
        await checkAuth(req, res, next);

        // Verify if the status response was called with 401 (unauthorized)
        expect(res.status).toHaveBeenCalledWith(401);

        // Verify if the JSON response contains the correct error message
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Your token has expired. Please login again.'
        });

        // Verify if the next function was not called
        expect(next).not.toHaveBeenCalled();
    });

    test('should return an error message for missing authentication token', async () => {
        // Execute the authentication middleware with mocked request, response, and next
        await checkAuth(req, res, next);

        // Verify if the status response was called with 401 (unauthorized)
        expect(res.status).toHaveBeenCalledWith(401);

        // Verify if the JSON response contains the correct error message
        expect(res.json).toHaveBeenCalledWith({
            msg: 'No access token provided'
        });

        // Verify if the next function was not called
        expect(next).not.toHaveBeenCalled();
    });

    test('should pass control to the next middleware for a valid token and pass user data', async () => {
        // Setting a valid token
        const userData = {
            userId: '123',
            type: 'user'
        };
        const token = jwt.sign(userData, 'testsecret', { expiresIn: '2m' });

        // Set a valid token in the authorization header
        req.headers.authorization = `Bearer ${token}`;

        // Execute the authentication middleware with mocked request, response, and next
        await checkAuth(req, res, next);

        // Verify if the next function was called
        expect(next).toHaveBeenCalled();

        // Verify if the status response was not called
        expect(res.status).not.toHaveBeenCalled();

        // Verify if the JSON response was not called
        expect(res.json).not.toHaveBeenCalled();

        // Verify if the authenticated user data was passed to the next function
        expect(req.userData).toEqual(expect.objectContaining({
            userId: userData.userId,
            type: userData.type
        }));
    });
});
