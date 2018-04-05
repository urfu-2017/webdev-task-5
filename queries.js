'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const review = mongoose.Schema({ // eslint-disable-line new-cap
            login: { type: String, required: true },
            date: { type: Date, required: true },
            text: { type: String, required: true },
            rating: { type: Number, required: true },
            isApproved: { type: Boolean, required: true }
        });

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [review],
            name: { type: String, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true, index: true },
            amount: { type: Number, required: true },
            country: { type: String, required: true, index: true },
            rating: { type: Number, required: true, index: true },
            isRecent: { type: Boolean, required: true },
            _v: { type: Number, required: true }
        });

        const item = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: { type: mongoose.Schema.Types.ObjectId, required: true },
            amount: { type: Number, required: true }
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [item],
            login: { type: String, required: true, unique: true },
            _v: { type: Number, required: true }
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
        return this._Souvenir.count({ country: country,
            rating: { $gte: rating },
            price: { $lte: price } });
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
        const { reviews } =
            await this._Souvenir.findById(souvenirId, { reviews: 1, _id: 0 });
        const newRating = (reviews.reduce((currentRating, review) =>
            (currentRating += review.rating), 0) + rating) / (reviews.length + 1);

        return this._Souvenir.update({ _id: souvenirId }, {
            $set: { rating: newRating },
            $push: { reviews:
            { login: login, rating: rating, text: text, date: Date.now(), isApproved: false } } });
    }

    async getCartSum(login) {
        let cartSum = 0;
        const { items } = await this._Cart.findOne({ login: login }, { items: 1, _id: 0 });
        for (let i = 0; i < items.length; i++) {
            cartSum += (await this._Souvenir.findById(
                items[i].souvenirId, { price: 1, _id: 0 })).price;
        }

        return cartSum;
    }
};
