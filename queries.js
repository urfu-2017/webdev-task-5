'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема сувенира тут
            _id: mongoose.Schema.Types.ObjectId,
            tags: [String],
            reviews: [
                {
                    login: String,
                    date: Date,
                    text: String,
                    rating: Number,
                    isApproved: Boolean
                }
            ],
            name: String,
            image: String,
            price: Number,
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean,
            __v: Number
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема корзины тут
            _id: mongoose.Schema.Types.ObjectId,
            items: [
                {
                    souvenirId: mongoose.Schema.Types.ObjectId,
                    amount: Number
                }
            ],
            login: { type: String, unique: true },
            __v: Number

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
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.count({
            country,
            rating: { $gte: rating },
            price: { $lte: price }
        });
    }

    searchSouvenirs(substring) {
        return this._Souvenir.find({ $regex: new RegExp(substring, 'i') });
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir.remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        const souvenir = await this._Souvenir.findById(souvenirId);
        const reviewsCount = souvenir.reviews.length;
        souvenir.rating = (souvenir.rating * reviewsCount + rating) / (reviewsCount + 1);
        souvenir.reviews.push({ login, rating, text, date: new Date(), isApproved: false });

        return souvenir.save();

    }

    async getCartSum(login) {
        const basket = await this._Cart.findOne({ login });
        const souvenirIds = basket.items.map(item => item.souvenirId);
        const souvenir = await this._Souvenir.find({ _id: { $in: souvenirIds } });
        let cost = 0;
        for (let i = 0; i < basket.items.length; i++) {
            const price = souvenir[i].price;
            const amount = basket.items[i].amount;
            cost += price * amount;
        }

        return cost;
    }
};
