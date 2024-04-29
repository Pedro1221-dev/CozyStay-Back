/* module.exports = (sequelize, DataTypes) => {
    const Tutorial = sequelize.define("Tutorial", {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { notNull: { msg: "Title can not be empty!" } }
        },
        description: {
            type: DataTypes.STRING
        },
        published: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0,
            validate: {
                isBoolean: function (val) { // custom validation function
                    if (typeof (val) != 'boolean')
                        throw new Error('Published must contain a boolean value!');
                }
            }
        }
    }, {
        timestamps: false
    });
    return Tutorial;
    }; */