const axios = require('axios');

describe('Edit a user', () => {
    let userIdToUpdate;
    let userAuthToken;

    beforeAll(async () => {
        // Crie um novo usuário para editar seus detalhes
        const userData = {
            name: 'John Doe',
            email: 'example3@mail.com',
            password: 'Password123!',
            nationality: 'portuguese',
            vat_number: '12345678912343134' 
        };

        try {
            const response = await axios.post('http://127.0.0.1:3000/users', userData);
            userIdToUpdate = response.data.data.user_id;

            // Faça login para obter o token de autenticação
            const loginData = {
                email: 'example3@mail.com',
                password: 'Password123!',
            };
            const responseLogin = await axios.post('http://127.0.0.1:3000/users/login', loginData);
            userAuthToken = responseLogin.data.accessToken;
        } catch (error) {
            console.error('Error setting up test:', error);
        }
    });

    test('Send a request without authentication token in Authorization header', async () => {
        try {
            // Send a request to edit user details without authentication token
            const response = await axios.patch(`http://127.0.0.1:3000/users/current`, {
                name: 'Simão', 
            });

            
        } catch (error) {
            // Expect a 401 Unauthorized or 403 Forbidden response
            expect(error.response.status).toBe(401);
            expect(error.response.data.msg).toBe('No access token provided');
        }
    });

    test('Send a request with an expired authentication token', async () => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1vbXBlZHJvMUBnbWFpbC5jb20iLCJ0eXBlIjoiYWRtaW4iLCJ1c2VyX2lkIjoxOTYsImlhdCI6MTcxODE4MzM1MiwiZXhwIjoxNzE4MTgzMzY3fQ.7ekbrSjIsxFEuKfx5ctZsLtmjKzahPm773vq0idcukM'; 

        try {
            // Send a request to edit user details with an expired authentication token
            const response = await axios.patch(`http://127.0.0.1:3000/users/current`, {
                name: 'Simão', 
            }, {
                headers: {
                    'Authorization': `Bearer ${expiredToken}`
                }
            });

        } catch (error) {
            // Expect a 401 Unauthorized response
            expect(error.response.status).toBe(401);
            expect(error.response.data.msg).toBe('Your token has expired. Please login again.');
        }
    });

    test('Send a request with a correct authentication token', async () => {
        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/current`, {
                name: 'Updated Name', 
            }, {
                headers: {
                    'Authorization': `Bearer ${userAuthToken}`
                }
            });

            expect(response.status).toBe(200);
            expect(response.data.msg).toBe(`User with ID ${userIdToUpdate} was updated successfully.`);

        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; 
        }
    });

    afterAll(async () => {
        try {
            await axios.delete(`http://127.0.0.1:3000/users/${userIdToUpdate}`, {
                headers: {
                    'Authorization': `Bearer ${userAuthToken}`
                }
            });
        } catch (error) {
            console.error('Error cleaning up test:', error);
        }
    });
});

describe('Verify administrator role', () => {
    let userIdToUpdate;
    let userAuthToken; 

    beforeAll(async () => {
        const userData = {
            name: 'John Doe',
            email: 'example4@mail.com',
            password: 'Password123!',
            nationality: 'portuguese',
            vat_number: '12345678912343134' 
        };

        try {
            const response = await axios.post('http://127.0.0.1:3000/users', userData);
            userIdToUpdate = response.data.data.user_id;

            const loginData = {
                email: 'example4@mail.com',
                password: 'Password123!',
            };
            const responseLogin = await axios.post('http://127.0.0.1:3000/users/login', loginData);
            userAuthToken = responseLogin.data.accessToken;
        } catch (error) {
            console.error('Error setting up test:', error);
        }
    });

    test('Send a request with a non-administrator user', async () => {
        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/${userIdToUpdate}`, {
                name: 'Updated Name',
            }, {
                headers: {
                    'Authorization': `Bearer ${userAuthToken}`
                }
            });

            throw new Error('Supposed to fail')
        } catch (error) {
            // Expect a 401 Unauthorized response
            expect(error.response.status).toBe(403);
            expect(error.response.data.msg).toBe('Only administrators can perfom this action');
            
        }
    });

    afterAll(async () => {
        try {
            await axios.delete(`http://127.0.0.1:3000/users/${userIdToUpdate}`, {
                headers: {
                    'Authorization': `Bearer ${userAuthToken}`
                }
            });
        } catch (error) {
            console.error('Error cleaning up test:', error);
        }
    });
});

describe('Send a request correctly with valid authentication token', () => {
    let userIdToUpdate;
    let adminAuthToken; 

    beforeAll(async () => {
        try {
            const userData = {
                name: 'John Doe',
                email: 'example4@mail.com',
                password: 'Password123!',
                nationality: 'portuguese',
                vat_number: '12345678912343134' 
            };
            const response = await axios.post('http://127.0.0.1:3000/users', userData);
            userIdToUpdate = response.data.data.user_id;

            const authResponse = await axios.post('http://127.0.0.1:3000/users/login', {
                email: "mompedro1@gmail.com",
                password: "simao123$"
            });
    
            adminAuthToken = authResponse.data.accessToken;
        } catch (error) {
            console.error('Error setting up test:', error);
        }
    });

    test('Send a request correctly with valid admin authentication token', async () => {
        try {
            const updateData = {
                name: 'Updated Name',
            };

            const response = await axios.patch(`http://127.0.0.1:3000/users/${userIdToUpdate}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });

            expect(response.status).toBe(200);
            expect(response.data.msg).toBe(`User with ID ${userIdToUpdate} was updated successfully.`);

        } catch (error) {
            console.error('Error during test execution:', error);
            throw error; 
        }
    });

    afterAll(async () => {
        try {
            await axios.delete(`http://127.0.0.1:3000/users/${userIdToUpdate}`, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });
        } catch (error) {
            console.error('Error cleaning up test:', error);
        }
    });
});

describe('Edit a specific user', () => {
    let userIdToUpdate;
    let adminAuthToken; 

    beforeAll(async () => {
        try {
            const userData = {
                name: 'John Doe',
                email: 'example4@mail.com',
                password: 'Password123!',
                nationality: 'portuguese',
                vat_number: '12345678912343134' 
            };
            const response = await axios.post('http://127.0.0.1:3000/users', userData);
            userIdToUpdate = response.data.data.user_id; 

            const authResponse = await axios.post('http://127.0.0.1:3000/users/login', {
                email: "mompedro1@gmail.com",
                password: "simao123$"
            });
    
            adminAuthToken = authResponse.data.accessToken;
        } catch (error) {
            console.error('Error setting up test:', error);
        }
    });

    test('Send a request with a non-existent user_id', async () => {
        const nonExistentUserId = 9999; 

        const updateData = {
            name: 'Updated Name',
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/${nonExistentUserId}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });

            throw new Error('Supposed to fail')
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.msg).toBe(`User with ID ${nonExistentUserId} not found.`);
        }
    });

    test('Send a request with an empty password', async () => {
        const updateData = {
            password: '', 
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/${userIdToUpdate}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });

            throw new Error('Supposed to fail')
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.msg[0]).toBe(`Password must contain at least one number and one special character`);
            expect(error.response.data.msg[1]).toBe(`Password cannot be empty`);
            expect(error.response.data.msg[2]).toBe(`Password must be at least 8 characters long`);
        }
    });

    test('Send a request with an empty name', async () => {
        const updateData = {
            name: '', 
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/${userIdToUpdate}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });

            throw new Error('Supposed to fail')

        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.msg).toEqual(expect.arrayContaining(["Name cannot be empty"]));
        }
    });

    test('Send a request to update user image with invalid URL', async () => {
        const updateData = {
            url_avatar: 'not_a_valid_url'
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/${userIdToUpdate}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });

            throw new Error('Supposed to fail')

        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.msg).toEqual(expect.arrayContaining([ 'Invalid avatar URL' ]));
        }
    });

    test('Send a request to update user information without changing anything', async () => {
        const updateData = {
            name: 'John Doe', 
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/${userIdToUpdate}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });

            expect(response.status).toBe(200);
            expect(response.data.msg).toBe(`No updates were made to user with ID ${userIdToUpdate}.`);
        } catch (error) {
            console.error('Error during test execution:', error);
            throw error;
        }
    });

    test.only('Send a request to update user password with a valid new password', async () => {
        const updateData = {
            password: 'NewPassword456!'
        };

        try {
            const response = await axios.patch(`http://127.0.0.1:3000/users/${userIdToUpdate}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });

            expect(response.status).toBe(200);
            expect(response.data.msg).toBe(`User with ID ${userIdToUpdate} was updated successfully.`);

        } catch (error) {
            console.error('Error during test execution:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            await axios.delete(`http://127.0.0.1:3000/users/${userIdToUpdate}`, {
                headers: {
                    'Authorization': `Bearer ${adminAuthToken}`
                }
            });
        } catch (error) {
            console.error('Error cleaning up test:', error);
        }
    });
});
