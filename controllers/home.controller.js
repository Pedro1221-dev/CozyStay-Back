// Importing all the models
const db = require("../models/index.js");

//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError, Sequelize, where, QueryTypes, sequelize } = require('sequelize');

exports.findAll = async (req, res) => {
    try {
        // Find the total number of properties with status "available"
        const totalProperties = await db.property.count({
            where: { status: 'available' }
        });

        // Find the total number of reservations
        const totalReservations = await db.booking.count();

        // Find all reviews (bookings with non-null number_stars)
        const allReviews = await db.booking.findAll({
            attributes: ['number_stars'],
            where: {
                number_stars: {
                    [Op.not]: null
                }
            }
        });

        // Calculate the total number of ratings and sum of stars
        let totalRatings = 0;
        let sumOfStars = 0;
        for (const review of allReviews) {
            totalRatings++;
            sumOfStars += review.number_stars;
        }

        // Calculate the average rating
        const totalAverageRating = totalRatings > 0 ? sumOfStars / totalRatings : 0;

        // Find the total number of properties with status "available"
        const totalUsers = await db.user.count({
            where: { type: 'user' }
        });

        // Query to find the top 3 destinations with the highest reservation counts and average ratings
        const topDestinations = await db.sequelize.query(`
            SELECT 
                p.city, 
                p.country, 
                COUNT(b.booking_id) AS 'reservation_count', 
                ROUND(AVG(b.number_stars), 1) AS 'average_rating'
            FROM 
                property p
            JOIN 
                booking b ON p.property_id = b.property_id
            GROUP BY 
                p.city, p.country
            ORDER BY 
                COUNT(b.booking_id) DESC, b.number_stars DESC
            LIMIT 
                3;
        `, {
            type: db.sequelize.QueryTypes.SELECT
        });

        // Query to find the top 6 properties with the highest reservation counts and average ratings, along with their photos
        const topProperties = await db.sequelize.query(`
            SELECT 
                p.title, 
                p.city, 
                p.country, 
                p.number_beds, 
                p.number_bedrooms, 
                ROUND(AVG(b.number_stars), 1) AS 'average_rating', 
                p.price, 
                COUNT(b.booking_id) AS 'reservation_count',
                GROUP_CONCAT(ph.url_photo) AS 'photos'
            FROM 
                property p
            JOIN 
                booking b ON p.property_id = b.property_id
            LEFT JOIN 
                photo ph ON p.property_id = ph.property_id
            GROUP BY 
                p.property_id, p.title, p.city, p.country, p.number_beds, p.number_bedrooms, p.price
            ORDER BY 
                COUNT(b.booking_id) DESC, b.number_stars DESC
            LIMIT 
                6;
        `, {
            type: db.sequelize.QueryTypes.SELECT
        });

        // Return the total number of properties, reservations, average rating, users, top destinations, and top properties
        return res.status(200).json({ 
            success: true, 
            totalProperties: totalProperties,
            totalReservations: totalReservations,
            totalAverageRating: totalAverageRating,
            totalUsers: totalUsers,
            topDestinations: topDestinations,
            topProperties: topProperties
        });

    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        res.status(500).json({
            success: false,
            msg: err.message || "Some error occurred while getting the stats."
        });
        
    };
};