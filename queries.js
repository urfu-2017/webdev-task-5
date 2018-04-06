'use strict';

const uuidv1 = require('uuid/v1');

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            name: String,
            image: String,
            price: {
                type: Number,
                min: 0
            },
            amount: {
                type: Number,
                min: 0
            },
            country: String,
            rating: Number,
            isResent: Boolean,
            tags: [String],
            reviews: [{
                _id: false,
                id: {
                    type: String,
                    index: true
                },
                login: String,
                date: {
                    type: Date,
                    default: Date.now
                },
                text: String,
                rating: Number,
                isApproved: {
                    type: Boolean,
                    default: false
                }
            }]

        });

        souvenirSchema.index({ rating: 1, price: 1 });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            login: {
                type: String,
                index: true
            },
            items: [{
                amount: {
                    type: Number,
                    min: 0
                },
                souvenirId: mongoose.Schema.Types.ObjectId
            }]
        });

        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        return this._Souvenir.find()
            .where('price')
            .lte(price);
    }

    getTopRatingSouvenirs(souvenirsNumber) {
        return this._Souvenir.find()
            .sort({ rating: 'desc' })
            .limit(souvenirsNumber);
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.find({ country,
            'rating': { $gte: rating },
            'price': { $lte: price } })
            .count();
    }

    searchSouvenirs(substring) {
        return this._Souvenir.find({ name: { $regex: `/${substring}/i` } });
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir.deleteMany({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        const newReview = { login, rating, text, id: uuidv1() };

        const souvenir = await this._Souvenir.findOne({ _id: souvenirId });
        souvenir.rating =
            (souvenir.rating * souvenir.reviews.length + rating) / (souvenir.reviews.length + 1);
        souvenir.reviews.push(newReview);

        return await souvenir.save();
    }

    async getCartSum(login) {
        const cart = await this._Cart.findOne({ login })
            .populate({ path: 'items.souvenirId', model: 'Souvenir' });

        return cart.items.map(item => item.souvenirId.price * item.amount)
            .reduce((a, b) => a + b, 0);
    }
};
