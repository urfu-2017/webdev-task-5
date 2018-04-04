'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
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
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            login: String,
            items: [{ souvenirId: String, amount: Number }]
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Далее идут методы, которые вам необходимо реализовать:

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
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.find({ country, rating: { $gte: rating }, price: { $lte: price } })
            .count();
    }

    searchSouvenirs(substring) {
        return this._Souvenir.find({ name: { $regex: substring, $options: 'i' } });
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir.find({ amount: { $eq: 0 } }).remove();
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)

        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
    }

    async addReview(souvenirId, { login, rating, text }) {
        let reviewsCount = 1;
        let ratingSum = rating;
        await this._Souvenir.find({ _id: souvenirId })
            .then(souvenir => souvenir[0].reviews
                .forEach(review => {
                    reviewsCount++;
                    ratingSum += review.rating;
                })
            );

        let review = {
            login,
            rating,
            text,
            date: new Date(),
            isApproved: false
        };
        await this._Souvenir.findOneAndUpdate({ _id: souvenirId }, {
            $push: { reviews: review },
            $set: { rating: ratingSum / reviewsCount }
        });
        // await
    }

    async getCartSum(login) {
        const cart = ((await this._Cart.find({ login }, { items: 1, _id: 0 }))[0]).items;

        let sum = 0;
        for (let orderedSouvenir of cart) {
            const souvenir = (await this._Souvenir.find({ _id: orderedSouvenir.souvenirId }))[0];
            sum += souvenir.price * orderedSouvenir.amount;
        }

        return sum;
    }
};
