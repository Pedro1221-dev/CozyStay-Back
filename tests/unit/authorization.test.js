// Importing the jsonwebtoken library
const jwt = require('jsonwebtoken');

// Importing middleware functions
const checkAdmin = require('../../middleware/check-admin');

// Loads environment variables from the .env file
require('dotenv').config();

describe('Admin Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        // Set up a clean initial state for each test
        req = {
            userData: {
                type: ''
            }
        };

        // Mock HTTP response
        res = {
            // Mock the status function that returns res to allow chaining calls
            status: jest.fn(() => res), 
            // Mock the json function
            json: jest.fn(() => res) 
        };

        // Mock the next function to verify if it's called
        next = jest.fn();
    });

    test('should return an error message for a non-admin user', () => {
        // Set the user type as non-administrator
        req.userData.type = 'user';

        // Execute the admin check middleware with mocked request, response, and next
        checkAdmin(req, res, next);

        // Verify if the next function was not called
        expect(next).not.toHaveBeenCalled();
        
        // Verify if the status response was called with 403 (Forbidden)
        expect(res.status).toHaveBeenCalledWith(403);

        // Verify if the JSON response contains the correct error message
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Only administrators can perfom this action'
        });
    });

    test('should return an error message for a non-admin user', () => {
        // Set the user type as administrator
        req.userData.type = 'admin';

        // Execute the admin check middleware with mocked request, response, and next
        checkAdmin(req, res, next);

        // Verify if the next function was not called
        expect(next).toHaveBeenCalled();

        // Verify if the status response was not called
        expect(res.status).not.toHaveBeenCalled();

        // Verify if the JSON response was not called
        expect(res.json).not.toHaveBeenCalled();

    });

});
