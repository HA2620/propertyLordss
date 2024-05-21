const { Double } = require('mongodb');
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({

    propertyId: {
        type: String,
        required: true,
        unique: true

    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    noOfRoom: {
        type: Number
    },
    noOfWashRoom: {
        type: Number
    },
    distToNearestCollege: {
        type: Number,
    },
    distToNearestHospital: {
        type: Number,
    },
    distToNearestMetro: {
        type: Number
    },
    description: {
        type: String
    },
    location: {
        type: String
    },
    photoUrl: {
        type:String
    },
    likesCount: {
        type:Number
    },
    sellerId: {
        type: String
    }
});

const Property = new mongoose.model("Property", propertySchema);
module.exports = Property;