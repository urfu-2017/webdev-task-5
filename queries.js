'use strict';
/* eslint-disable new-cap */
module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            login: String,
            date: Date,
            text: String,
            rating: Number,
            isApproved: Boolean
        });

        const souvenirSchema = mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            tags: [String],
            reviews: [reviewSchema],
            name: String,
            image: String,
            price: { type: Number },
            amount: Number,
            country: { type: String },
            rating: { type: Number },
            isRecent: Boolean,
            __v: Number
        });
        souvenirSchema.index({ country: 1, rating: 1, price: 1 });

        const nestedSouvenirSchema = mongoose.Schema({
            souvenirId: mongoose.Schema.Types.ObjectId,
            amount: Number
        });

        const cartSchema = mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            items: [nestedSouvenirSchema],
            login: { type: String, unique: true },
            __v: Number
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Далее идут методы, которые вам необходимо реализовать:

    getAllSouvenirs() {
        // Данный метод должен возвращать все сувениры
        return this._Souvenir
            .find();
    }

    getCheapSouvenirs(price) {
        // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
        return this._Souvenir
            .find({ price: { $lte: price } });
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
        return this._Souvenir
            .find({ tags: tag }, { _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir
            .find({ country: country, rating: { $gte: rating }, price: { $lte: price } })
            .count();
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir
            .find({ name: { $regex: new RegExp(substring, 'i') } });
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        return this._Souvenir
            .find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)

        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
        return this._Souvenir
            .remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        const souvenir = await this._Souvenir.findOne({ _id: souvenirId });

        const reviewsLength = souvenir.reviews.length;
        souvenir.rating = (souvenir.rating * reviewsLength + rating) / (reviewsLength + 1);

        souvenir.reviews.push({ login, date: new Date(), text, rating, isApproved: false });

        return souvenir.save();
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const cart = await this._Cart.findOne({ login: login });
        const amounts = cart.items.reduce((obj, cur) =>
            Object.assign(obj, { [cur.souvenirId]: cur.amount }), {});
        const prices = await this._Souvenir
            .find({ _id: { $in: Object.keys(amounts) } }, { price: 1 });

        return prices.reduce((acc, cur) =>
            acc + cur.price * amounts[cur._id], 0);
    }
};
