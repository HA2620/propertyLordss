
const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({

    sellerId: {
        type: String,
        required: true
    },

    sellerEmail: {
        type: String
    },
    sellerPass: {
        type: String,
    }
});

const Seller = new mongoose.model("Seller", sellerSchema);
module.exports = Seller;