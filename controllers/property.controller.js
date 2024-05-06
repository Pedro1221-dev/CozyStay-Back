const bcrypt = require('bcrypt');
const db = require("../models/index.js");
// Define a variable Property to represent the Property model in the database
const Property = db.property;

//"Op" necessary for LIKE operator
const { Op, ValidationError, UniqueConstraintError } = require('sequelize');


exports.findAll = async (req, res) => {
    try {
        // Busque todas as propriedades
        const properties = await Property.findAll();

        // Se não houver propriedades encontradas, retorne uma mensagem
        if (!properties || properties.length === 0) {
            return res.status(404).json({ success: false, msg: 'No properties found.' });
        }

        // Se as propriedades forem encontradas, retorne-as
        res.status(200).json({ success: true, data: properties });
    } catch (err) {
        // Se ocorrer um erro, retorne uma mensagem de erro
        console.error(err);
        res.status(500).json({ success: false, msg: 'Error fetching properties.' });
    }
};