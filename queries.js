'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean,
            tags: [String],
            reviews: [{
                id: String,
                login: String,
                date: Date,
                text: String,
                rating: Number,
                isApproved: Boolean
            }]
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [{
                souvenirId: mongoose.Schema.Types.ObjectId,
                amount: Number
            }],
            login: { type: String, index: true, unique: true }
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
        // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
    }

    getTopRatingSouvenirs(n) {
        return this._Souvenir.find()
            .sort({ rating: -1 })
            .limit(n);
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: tag }, { _id: 0, name: 1, image: 1, price: 1 });
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.count({
            country,
            rating: { $gte: rating },
            price: { $lte: price }
        });
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
    }

    searchSouvenirs(substring) {
        const re = new RegExp(substring, 'i');

        return this._Souvenir.find({ name: re });
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
    }

    getDisscusedSouvenirs(date) {
        // this._Souvenir.find({ 'reviews.login': { $gte: date } });
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
    }

    deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)
        const result = this._Souvenir.remove({ amount: 0 });

        return result;
        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
    }

    async addReview(souvenirId, { login, rating, text }) {
        const souvenir = await this._Souvenir.findById(souvenirId);
        souvenir.reviews.push({
            login,
            text,
            rating,
            date: new Date(),
            isApproved: false
        });
        const sum = souvenir.reviews.reduce((result, current) => {
            result += current.rating;

            return result;
        }, 0);
        souvenir.rating = sum / souvenir.reviews.length;

        return souvenir.save();
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
    }

    async getCartSum(login) {
        // const cart = await this._Cart.find({ login }).exec();
        const cart = await this._Cart.findOne({ login });

        return cart.items.reduce(async (result, current) => {
            const souvenir = await this._Souvenir.findById(current.souvenirId);
            result += souvenir.price * current.amount;

            return result;
        }, 0);

        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
    }
};
