// Importing the jsonwebtoken library
const jwt = require('jsonwebtoken');

/**
 *  Middleware function to verify JWT token and extract user data
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 */
module.exports = async (req, res, next) => {
    try {
        // Extracting the token from the Authorization header
        const token = req.headers.authorization.split(" ")[1]; // split is used to remove Bearer from the header and the [1], to get the second part after the blank space
        //console.log(token);

        // Verifying the token and decoding its payload
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        // Storing the decoded user data in the request object for future use
        req.userData = decoded;

        // Passing control to the next middleware function
        next();
    } catch (error) {
        // Handling errors related to token verification
        if (error.name === 'TokenExpiredError') {
            // Responding with a 401 status and a message for expired tokens
            return res.status(401).json({
                msg: 'Your token has expired. Please login again.'
            });
        } else {
            // Responding with a 401 status and a message for missing or invalid tokens
            return res.status(401).json({
                msg: 'No access token provided'
            });
        }
    }
};


