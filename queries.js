'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema({ // eslint-disable-line new-cap
            login: { type: String, required: true },
            text: { type: String, required: true },
            rating: { type: Number, required: true },
            isApproved: { type: Boolean, required: true, default: false }
        }, { timestamps: { createdAt: 'date' } });

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [reviewSchema],
            name: { type: String, required: true },
            image: String,
            price: { type: Number, required: true, index: true },
            amount: { type: Number, required: true, default: 0 },
            country: { type: String, required: true, index: true },
            rating: { type: Number, required: true, index: true },
            isRecent: { type: Boolean, required: true }
        });

        const itemSchema = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Souvenir' },
            amount: { type: Number, required: true, default: 1 }
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [itemSchema],
            login: { type: String, required: true, unique: true }
        });

        // Модели в таком формате нужны для корректного запуска тестов
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
        return this._Souvenir
            .find()
            .limit(n)
            .sort({ rating: -1 });
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.count({ country, rating: { $gte: rating }, price: { $lte: price } });
    }

    searchSouvenirs(substring) {
        return this._Souvenir.find({ name: new RegExp(`${substring}`, 'i') });
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir.deleteMany({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        const { reviews } = await this._Souvenir.findById(souvenirId, { reviews: 1, _id: 0 });
        const newRating = (reviews.reduce((currentRating, review) =>
            (currentRating += review.rating), 0) + rating) / (reviews.length + 1);

        return this._Souvenir.update({ _id: souvenirId }, {
            $set: { rating: newRating },
            $push: { reviews: { login, rating, text } }
        });
    }

    async getCartSum(login) {
        const cart = await this._Cart.findOne({ login }).populate('items.souvenirId');

        return cart.items.reduce(
            (cartSum, souvenir) => (cartSum + souvenir.souvenirId.price * souvenir.amount), 0);
    }
};
