/**
 *  Middleware function to check if the user ID from the token matches the user ID from the request parameters
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 */
module.exports = (req, res, next) => {
    // Extracting the user ID from the token stored in req.userData
    const userIdFromToken = req.userData.user_id;

    // Extracting the user ID from the request parameters
    const userIdFromRequest = req.params.user_id; 

    //console.log(userIdFromToken);
    //console.log(userIdFromRequest);

    // Checking if the user ID from the token matches the user ID from the request parameters
    if (userIdFromToken == userIdFromRequest) {
        // If the IDs match, pass control to the next middleware function
        next();
    } else {
        // If the IDs don't match, respond with a 403 Forbidden status and an error message
        return res.status(403).json({
            msg: 'You are not authorized to perform this action'
        });
    }
}
    