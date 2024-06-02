const axios = require('axios');

// Define variable to store authentication token
let authToken;

// Before all tests, authenticate and obtain the authentication token
beforeAll(async () => {
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
});

describe('Retrieve user list', () => {
    test('should return an error message when sending request without authentication token in the Authorization header', async () => {
        try {
            // Send a GET request to retrieve the list of users without authentication token
            await axios.get('http://127.0.0.1:3000/users');
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to missing authentication token');
        } catch (error) {
            // Verify if the error status is 401, indicating unauthorized access
            expect(error.response.status).toBe(401);
    
            // Verify if the error message indicates missing authentication token
            expect(error.response.data.msg).toBe("No access token provided");
        }
    });

    test('should return an error message when sending request with an expired authentication token', async () => {
        try {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1vbXBlZHJvMUBnbWFpbC5jb20iLCJ0eXBlIjoiYWRtaW4iLCJ1c2VyX2lkIjoxOTYsImlhdCI6MTcxNzM0MDQ5MSwiZXhwIjoxNzE3MzQ0MDkxfQ.nwAxN9GxY_olOWxOShmoQj8XBuIGTE4LH7GC0_cUK7g'

            // Send a GET request to retrieve the list of users with an expired authentication token
            await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${expiredToken}`
                }
            });
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to expired authentication token');
        } catch (error) {
            console.log(error);
            // Verify if the error status is 401, indicating unauthorized access
            expect(error.response.status).toBe(401);
    
            // Verify if the error message indicates expired authentication token
            expect(error.response.data.msg).toBe("Your token has expired. Please login again.");
        }
    });

    test('should return an error message when sending request with a valid user token for restricted action', async () => {
        try {
            // Log in to obtain a valid token (type user)
            const loginResponse = await axios.post('http://127.0.0.1:3000/users/login', {
                email: "40220191@esmad.ipp.pt",
                password: "simao123$"
            });
    
            await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.accessToken}`
                }
            });
    
            // If the request is successful, throws an error
            throw new Error('Expected request to fail for restricted action');
        } catch (error) {
            console.log(error);
            // Check if the error status is 403, indicating access is prohibited
            expect(error.response.status).toBe(403);
    
            // Check if the error message indicates unauthorized access
            expect(error.response.data.msg).toBe("Only administrators can perfom this action");
        }
    });

    test('should pass with no error when sending request with a correct authentication token', async () => {
        try {
            // Send a GET request to a route that requires authentication
            const response = await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);
        } catch (error) {
            // If an error occurs during the request, fail the test and throw the error
            throw error;
        }
    });

    test('should return an error message when sending request with a non-boolean value for the "blocked" filter', async () => {
        try {
            // Send a GET request to retrieve the user list with a non-boolean value for the "blocked" filter
            await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                params: {
                    blocked: 'nonBooleanValue'
                }
            });
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to non-boolean value for "blocked" filter');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);
    
            // Verify if the error message indicates invalid value for "blocked" filter
            expect(error.response.data.message).toBe("The 'blocked' parameter must be a boolean value ('0' for false and '1' for true)");
        }
    });

    test('should return an error message when sending request with a non-numeric value for the "limit" parameter', async () => {
        try {
            // Send a GET request to retrieve the user list with a non-numeric value for the "limit" parameter
            await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                params: {
                    limit: 'nonNumericValue'
                }
            });
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to non-numeric value for "limit" parameter');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);
    
            // Verify if the error message indicates invalid value for "limit" parameter
            expect(error.response.data.message).toBe("Limit must be a positive integer, greater than 5");
        }
    });

    test('should return an error message when sending request with a value less than 5 for the "limit" parameter', async () => {
        try {
            // Send a GET request to retrieve the user list with a value less than 5 for the "limit" parameter
            await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                params: {
                    limit: 3
                }
            });
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to value less than 5 for "limit" parameter');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);
    
            // Verify if the error message indicates the value for "limit" parameter is less than 5
            expect(error.response.data.message).toBe("Limit must be a positive integer, greater than 5");
        }
    });

    test('should return an error message when sending request with a non-numeric value for the "page" parameter', async () => {
        try {
            // Send a GET request to retrieve the user list with a non-numeric value for the "page" parameter
            await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                params: {
                    page: 'nonNumericValue'
                }
            });
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to non-numeric value for "page" parameter');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);
    
            // Verify if the error message indicates the value for "page" parameter is non-numeric
            expect(error.response.data.message).toBe("Page must be 1 or a positive integer");
        }
    });

    test('should return an error message when sending request with a value less than 1 for the "page" parameter', async () => {
        try {
            // Send a GET request to retrieve the user list with a value less than 1 for the "page" parameter
            await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                params: {
                    page: 0
                }
            });
    
            // If the request is successful, throw an error
            throw new Error('Expected request to fail due to value less than 1 for "page" parameter');
        } catch (error) {
            // Verify if the error status is 400, indicating a bad request
            expect(error.response.status).toBe(400);
    
            // Verify if the error message indicates the value for "page" parameter is less than 1
            expect(error.response.data.message).toBe("Page must be 1 or a positive integer");
        }
    });

    test('should return an error message when sending request to retrieve an empty list of users', async () => {
        try {
            // Send a GET request to retrieve the user list with a name parameter that does not match any users
            const response = await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                params: {
                    name: '150'
                }
            });
    
             // Throw an error if the request succeeds but should have failed
            throw new Error('Expected request to fail due to empty user list');
        } catch (error) {
            // Verify if the error status is 404, indicating not found
            expect(error.response.status).toBe(404);
    
            // Verify if the error message indicates no results found
            expect(error.response.data.message).toBe("No results found");
        }
    });

    test('should retrieve a list of users without applying search filters or pagination', async () => {
        try {
            // Send a GET request to retrieve the user list without applying any filters or pagination
            const response = await axios.get('http://127.0.0.1:3000/users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
    
            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);
    
            // Verify if the response contains the pagination information
            expect(response.data).toHaveProperty('pagination');
            expect(response.data.pagination).toHaveProperty('total');
            expect(response.data.pagination).toHaveProperty('pages');
            expect(response.data.pagination).toHaveProperty('current');
            expect(response.data.pagination).toHaveProperty('limit');
    
            // Verify if the response contains the data field with users
            expect(response.data).toHaveProperty('data');
            expect(response.data.data).toBeDefined(); 
    
            // Verify if the response contains the links
            expect(response.data).toHaveProperty('links');
            const links = response.data.links;
            expect(links).toHaveLength(5); 
            links.forEach(link => {
                expect(link).toHaveProperty('rel');
                expect(link).toHaveProperty('href');
                expect(link).toHaveProperty('method');
            });
    
        } catch (error) {
            // If an error occurs, throw it to fail the test
            throw error;
        }
    });

    test('should retrieve a list of users applying a name search filter', async () => {
        try {
            // Define the name filter
            const nameFilter = 'Michael Johnson'; // Example name to search for
    
            // Send a GET request to retrieve the user list with the name search filter
            const response = await axios.get(`http://127.0.0.1:3000/users?name=${nameFilter}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
    
            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);
    
            // Verify if the response contains the expected data structure
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('pagination');
            expect(response.data).toHaveProperty('data');
            expect(response.data).toHaveProperty('links');
    
            // Verify if the pagination data is correct
            expect(response.data.pagination).toEqual({
                total: 1,
                pages: 1,
                current: 1,
                limit: 10 
            });
    
            // Verify if the data contains the expected user
            expect(response.data.data).toHaveLength(1); 
            const user = response.data.data[0];
            expect(user.name).toBe('Michael Johnson');
            expect(user.email).toBe('michael.johnson@example.com');
    
            // Verify if the links structure is correct
            expect(response.data.links).toHaveLength(5); 
        } catch (error) {
            // If an error occurs, throw it to fail the test
            throw error;
        }
    });

    test('should retrieve a list of users applying a filter for blocked status', async () => {
        try {
            // Define the blocked filter
            const blockedFilter = 1; // Example blocked status to search for
    
            // Send a GET request to retrieve the user list with the blocked status filter
            const response = await axios.get(`http://127.0.0.1:3000/users?blocked=${blockedFilter}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
    
            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);
    
            // Verify if the response contains the expected data structure
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('pagination');
            expect(response.data).toHaveProperty('data');
            expect(response.data).toHaveProperty('links');

            // Verify if the data contains the expected users with the specified blocked status
            const users = response.data.data;
            for (const user of users) {
                expect(user).toHaveProperty('blocked', true);
            }
        } catch (error) {
            console.log(error);
            // If an error occurs, throw it to fail the test
            throw error;
        }
    });

    test('should retrieve a list of users applying filters for name and blocked status', async () => {
        try {
            // Define the filters
            const nameFilter = 'John'; // Example name to search for
            const blockedFilter = 1; // Example blocked status to search for
    
            // Send a GET request to retrieve the user list with the name and blocked status filters
            const response = await axios.get(`http://127.0.0.1:3000/users?name=${nameFilter}&blocked=${blockedFilter}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
    
            // Verify if the response status is 200, indicating success
            expect(response.status).toBe(200);
    
            // Verify if the response contains the expected data structure
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('pagination');
            expect(response.data).toHaveProperty('data');
            expect(response.data).toHaveProperty('links');
    
            // Verify if the data contains the expected users with the specified name and blocked status
            const users = response.data.data;
            for (const user of users) {
                // Check if the user's name contains the specified name filter
                expect(user.name.toLowerCase()).toContain(nameFilter.toLowerCase());
                // Check if the user's blocked status matches the specified blocked filter
                expect(user.blocked).toBe(true);
            }
        } catch (error) {
            // If an error occurs, throw it to fail the test
            throw error;
        }
    });
    
    
    
    
    
    
    
    
    
});


