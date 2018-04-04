'use strict';

const uuid4 = require('uuid/v4');

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = new mongoose.Schema({
            tags: [String],
            reviews: [{
                id: { type: String, default: uuid4 },
                login: String,
                date: { type: Date, default: Date.now },
                text: String,
                rating: Number,
                isApproved: { type: Boolean, default: false }
            }],
            name: { type: String, unique: true },
            image: String,
            price: Number,
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean
        });

        const cartSchema = new mongoose.Schema({
            login: { type: String, unique: true },
            items: [{
                souvenirId: mongoose.Schema.Types.ObjectId,
                amount: Number
            }]
        });

        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        return this._Souvenir.find({ price: { $lte: price } });
    }

    getTopRatingSouvenirs(n) {
        return this._Souvenir.find()
            .sort('rating', -1)
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: tag }, 'name image price -_id');
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.count({ country, rating: { $gte: rating }, price: { $lte: price } });
    }

    searchSouvenirs(substring) {
        return this._Souvenir.find({ name: { $regex: substring, $options: 'i' } });
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir.remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        return this._Souvenir.findById(souvenirId)
            .then(souvenir => {
                souvenir.rating = (souvenir.rating * souvenir.reviews.length + rating) /
                    (souvenir.reviews.length + 1);
                souvenir.reviews.push({ login, rating, text });

                return souvenir.save();
            });
    }

    async getCartSum(login) {
        return this._Cart.findOne({ login })
            .populate({ path: 'items.souvenirId', select: 'price', model: this._Souvenir })
            .then(cart => cart
                ? cart.items.map(i => i.amount * i.souvenirId.price).reduce((i, j) => i + j) : 0);
    }
};
