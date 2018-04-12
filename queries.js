'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewShema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            login: String,
            date: Date,
            text: String,
            rating: Number,
            isApproved: Boolean
        });
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            tags: [String],
            reviews: [reviewShema],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean
        });

        const itemShema = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: { type: mongoose.Schema.Types.ObjectId, ref: 'Souvenir' },
            amount: Number
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            items: [itemShema],
            login: { type: String, unique: true }
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        return this._Souvenir.where('price').lte(price);
    }

    getTopRatingSouvenirs(n) {
        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir
            .where('tags', tag)
            .select({ _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir
            .where('country', country)
            .where('rating')
            .gte(rating)
            .where('price')
            .lte(price)
            .count();
    }

    searchSouvenirs(substring) {
        return this._Souvenir.where('name').regex(new RegExp(substring, 'i'));
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir.where('reviews.0.date').gte(date);
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
        const basket = await this._Cart.findOne({ login })
            .populate('items.souvenirId');

        let cost = 0;
        for (var item of basket.items) {
            cost += item.souvenirId * item.amount;
        }

        return cost;
    }
};
