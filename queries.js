/* eslint-disable */
'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            login: String,
            date: Date,
            text: String,
            rating: Number,
            isApproved: Boolean
        });

        const souvenirSchema = mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            tags: [String],
            reviews: [reviewSchema],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean,
            __v: Number
        });

        const itemsSchema = mongoose.Schema({
            souvenirId: { type: mongoose.Schema.Types.ObjectId, ref: 'Souvenir' },
            amount: Number
        });

        const cartSchema = mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            items: [itemsSchema],
            login: { type: String, unique: true },
            __v: Number
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
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir.find(
            { tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.count(
            { country, rating: { $gte: rating }, price: { $lte: price } });
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
        const souvenir = await this._Souvenir.findOne({ _id: souvenirId });
        souvenir.rating =
            (souvenir.rating * souvenir.reviews.length + rating) / (souvenir.reviews.length + 1);
        souvenir.reviews.push({ login, rating, text, date: Date.now(), isApproved: false });

        return await souvenir.save();

    }

    async getCartSum(login) {
        const cart = await this._Cart.findOne({ login }).populate('items.souvenirId', 'price');

        return cart.items.reduce((s, item) => s + item.amount * item.souvenirId.price, 0);
    }
};
