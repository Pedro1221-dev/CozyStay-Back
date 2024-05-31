// Importing all the models
const db = require("../models/index.js");

//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError, Sequelize, where, QueryTypes, sequelize } = require('sequelize');

/**
 * Find all facilities.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.findAll = async (req, res) => {
    try {
        // Fetch all facilities from the database
        const facilities = await db.facility.findAll();
        
        // Send a 200 response with the facilities data
        res.status(200).json({
            success: true,
            data: facilities
        });

    }
    catch (err) {
        // If an error occurs, return a 500 response with an error message
        res.status(500).json({
            success: false,
            msg: err.message || "Some error occurred while getting the facilities."
        });
        
    };
};