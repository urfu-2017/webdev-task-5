'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

module.exports = class Queries {
    // eslint-disable-next-line no-shadow
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема сувенира тут
            _id: Schema.ObjectId,
            tags: [String],
            reviews: [mongoose.Schema({ // eslint-disable-line new-cap
                id: String,
                login: String,
                date: {
                    type: Date,
                    default: Date.now
                },
                text: String,
                rating: Number,
                isApproved: {
                    type: Boolean,
                    default: false
                }
            })],
            name: String,
            image: String,
            price: {
                type: Number,
                index: true
            },
            amount: Number,
            country: {
                type: String,
                index: true
            },
            rating: {
                type: Number,
                index: true
            },
            isRecent: false
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема корзины тут
            _id: Schema.ObjectId,
            items: [{
                souvenirId: Schema.ObjectId,
                amount: Number
            }],
            login: {
                type: String,
                unique: true
            }
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
        // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
        return this._Souvenir.find({ price: { $lte: price } });
    }

    getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir.find({ tags: tag }, { _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir.find({
            country,
            rating: { $gte: rating },
            price: { $lte: price }
        }).count();
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir.find({
            name: { $regex: new RegExp(substring, 'i') }
        });
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        return this._Souvenir.find(
            { 'reviews.0.date': { $gte: date } }
        );
    }

    deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)

        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
        return this._Souvenir.remove({ amount: { $eq: 0 } });

    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        let souvenir = await this._Souvenir.findOne({ _id: souvenirId });
        let summaryRating = souvenir.reviews
            .reduce((summary, review) => summary + review.rating, 0);
        let newRating = ((summaryRating + rating) / (souvenir.reviews.length + 1)).toFixed(1);
        souvenir.reviews.push({ login, rating, text });

        return this._Souvenir.update({ _id: souvenirId }, {
            rating: newRating,
            reviews: souvenir.reviews
        });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        let cart = await this._Cart.findOne({ login });
        let res = cart.items.reduce((sum, current) => sum + current.amount, 0);

        return res;
    }
};
