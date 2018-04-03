'use strict';

const { Types } = require('mongoose');

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: { type: mongoose.Schema.Types.ObjectId },
            tags: { type: [String], required: true },
            reviews: { type: Array, $items: {
                id: { type: String, required: true },
                login: { type: String, required: true },
                date: { type: Date, required: true },
                text: { type: String, required: true },
                rating: { type: Number, required: true },
                isApproved: { type: Boolean, required: true }
            }, required: true },
            name: { type: String, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            amount: { type: Number, required: true },
            country: { type: String, required: true },
            rating: { type: Number, required: true },
            isRecent: { type: Boolean, required: true }
        });

        souvenirSchema.index({ _id: 1, price: -1, rating: 1 });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: { type: mongoose.Schema.Types.ObjectId, require: true },
            items: { type: Array, $items: {
                souvenirId: { type: mongoose.Schema.Types.ObjectId, required: true },
                amount: { type: Number, required: true }
            }, required: true },
            login: { type: String, required: true, unique: true }
        });

        cartSchema.index({ login: 1 });

        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    getAllSouvenirs() {

        return this._Souvenir
            .find({});
    }

    getCheapSouvenirs(price) {

        return this._Souvenir
            .find({ price: { $lte: price } });
    }

    getTopRatingSouvenirs(n) {

        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {

        return this._Souvenir
            .find({ tags: tag }, { _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {

        return this._Souvenir
            .count({ country: country, rating: { $gte: rating }, price: { $lte: price } });
    }

    searchSouvenirs(substring) {

        return this._Souvenir
            .find({ 'name': { $regex: new RegExp(substring, 'i') } });

    }

    getDisscusedSouvenirs(date) {

        return this._Souvenir
            .find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir
            .remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        const souvenir = await this._Souvenir
            .find({ _id: new Types.ObjectId(souvenirId) }, { _id: 0, reviews: 1 });
        let sum = rating;
        souvenir[0].reviews.forEach(review => {
            sum += review.rating;
        });
        let newRating = sum / souvenir[0].reviews.length;
        await this._Souvenir.update(
            { _id: new Types.ObjectId(souvenirId) },
            { $set: { rating: newRating }, $push: { reviews: {
                login: login,
                date: new Date(),
                text: text,
                rating: rating,
                isApproved: false
            } } }
        );
    }

    async getCartSum(login) {
        let cart = await this._Cart.find({ login: login });
        var sum = 0;
        var promises = [];
        for (var i = 0; i < cart[0].items.length; i++) {
            promises.push(this._Souvenir.find({ _id: cart[0].items[i].souvenirId }, { price: 1 }));
        }
        await Promise.all(promises).then(values => {
            values.forEach(value => {
                sum += value[0].price;
            });
        });

        return sum;
    }
};
