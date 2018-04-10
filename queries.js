'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = new mongoose.Schema({
            tags: [String],
            reviews: [{
                id: String,
                login: String,
                date: Date,
                text: String,
                rating: Number,
                isApproved: Boolean
            }],
            name: String,
            image: String,
            price: Number,
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean
        });

        const cartSchema = new mongoose.Schema({
            items: [{
                souvenirId: { type: mongoose.Schema.Types.ObjectId, ref: 'Souvenir' },
                amount: Number
            }],
            login: { type: String, unique: true }
        });

        souvenirSchema.index({ name: 'text' });
        souvenirSchema.index({ rating: -1, country: 1, price: 1 });

        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    getAllSouvenirs() {
        return this._Souvenir.find();
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
            .find({ tags: tag }, 'name image price');
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir
            .count({
                country,
                rating: { $gte: rating },
                price: { $lte: price }
            });
    }

    searchSouvenirs(substring) {
        return this._Souvenir
            .find({ $text: { $search: substring, $caseSensitive: false } });
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir
            .find({ 'revies.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir
            .remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        const souvenir = await this._Souvenir.findById(souvenirId);

        const reviewCount = souvenir.reviews.length;
        const sumOfRatings = souvenir.rating * reviewCount;

        souvenir.rating = (sumOfRatings + rating) / (reviewCount + 1);
        souvenir.reviews.push({ login, rating, text, date: new Date(), isApproved: false });

        return await souvenir.save();
    }

    async getCartSum(login) {
        const cart = await this._Cart
            .findOne({ login })
            .populate('items.souvenirId');

        return cart.items
            .reduce((sum, item) => sum + item.souvenirId.price * item.amount, 0);
    }
};
