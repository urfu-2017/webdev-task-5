'use strict';
/* eslint-disable new-cap*/
module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            tags: [String],
            reviews: [mongoose.Schema({
                _id: mongoose.Schema.Types.ObjectId,
                login: String,
                date: Date,
                text: String,
                rating: Number,
                isApproved: Boolean
            })],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean,
            __v: Number
        });

        const cartSchema = mongoose.Schema({
            items: [mongoose.Schema({
                souvenirId: mongoose.Schema.Types.ObjectId,
                amount: Number
            })],
            _id: mongoose.Schema.Types.ObjectId,
            login: String,
            __v: Number
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

        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {

        return this._Souvenir
            .find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    getSouvenrisCount({ country, rating, price }) {

        return this._Souvenir
            .count({ country, rating: { $gte: rating }, price: { $lte: price } });
    }

    searchSouvenirs(substring) {

        return this._Souvenir
            .find({ name: { $regex: substring, $options: 'i' } });
    }

    getDisscusedSouvenirs(date) {

        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {

        return this._Souvenir.remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        const souvenir = await this._Souvenir.findOne({ _id: souvenirId });
        souvenir.reviews.push(
            {
                login,
                date: new Date(),
                text,
                rating,
                isApproved: false
            }
        );

        let sum = 0;
        souvenir.reviews.forEach(element => {
            sum += element.rating;
        });
        let len = souvenir.reviews.length;
        souvenir.rating = sum / len;

        return await this._Souvenir.update({ _id: souvenir._id }, { $set: {
            reviews: souvenir.reviews,
            rating: souvenir.rating
        } });
    }

    async getCartSum(login) {
        const { items } = await this._Cart.findOne({ login });
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
            const souvenir = await this._Souvenir
                .findOne({ _id: items[i].souvenirId }, { price: 1 });
            sum += souvenir.price * items[i].amount;
        }

        return sum;
    }
};
