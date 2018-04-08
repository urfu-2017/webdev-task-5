'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = new mongoose.Schema({
            tags: [String],
            reviews: [mongoose.Schema.Types.Mixed],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
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
        return this._Souvenir.find()
            .where('price')
            .lte(price);
    }

    getTopRatingSouvenirs(n) {
        return this._Souvenir.find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: tag })
            .select('name image price -_id');
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.count({ country })
            .where('rating')
            .gte(rating)
            .where('price')
            .lte(price);
    }

    searchSouvenirs(substring) {
        return this._Souvenir
            .where('name')
            .regex(new RegExp(substring, 'i'));
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir
            .where('reviews.0.date')
            .gte(date);
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir.remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        const souvenir = await this._Souvenir.findById(souvenirId);
        if (!souvenir) {
            return;
        }
        const ratingSum = Math.round(souvenir.rating * souvenir.reviews.length);

        return souvenir.update({
            $set: { rating: (ratingSum + rating) / (souvenir.reviews.length + 1) },
            $push: { reviews: { login, rating, text, date: new Date(), isApproved: false } }
        });
    }

    async getCartSum(login) {
        const cart = await this._Cart.findOne({ login })
            .populate({ path: 'items.souvenirId', select: 'price', model: this._Souvenir });

        return cart ? cart.items.reduce((i, j) => i + j.amount * j.souvenirId.price, 0) : 0;
    }
};
