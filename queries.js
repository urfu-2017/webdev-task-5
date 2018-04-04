/* eslint-disable new-cap */
'use strict';

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
            price: Number,
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            items: [mongoose.Schema({
                souvenirId: mongoose.Schema.Types.ObjectId,
                amount: Number
            })],
            login: String
        });

        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    /*
    * Данный метод должен возвращать все сувениры
    */
    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    /*
    * Данный метод должен возвращать все сувениры, цена которых меньше или равна price
    */
    getCheapSouvenirs($lte) {
        return this._Souvenir.find({ price: { $lte } });
    }

    /*
    * Данный метод должен возвращать топ n сувениров с самым большим рейтингом
    */
    getTopRatingSouvenirs(n) {
        return this._Souvenir.find()
            .sort({ rating: -1 })
            .limit(n);
    }

    /*
    * Данный метод должен возвращать все сувениры, в тегах которых есть tag
    * Кроме того, в ответе должны быть только поля name, image и price
    */
    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    /*
    * Данный метод должен возвращать количество сувениров,
    * из страны country, с рейтингом больше или равной rating,
    * и ценой меньше или равной price
    */
    getSouvenrisCount({ country, rating: $gte, price: $lte }) {
        return this._Souvenir.find({ country, rating: { $gte }, price: { $lte } }).count();
    }

    /*
    * Данный метод должен возвращать все сувениры, в название которых входит
    * подстрока substring. Поиск должен быть регистронезависимым
    */
    searchSouvenirs(substring) {
        return this._Souvenir.find({ name: { $regex: new RegExp(substring, 'i') } });
    }

    /*
    * Данный метод должен возвращать все сувениры,
    * первый отзыв на которые был оставлен не раньше даты date
    */
    getDisscusedSouvenirs($gte) {
        return this._Souvenir.find({ 'reviews.0.date': { $gte } });
    }

    /*
    * Данный метод должен удалять все сувениры, которых нет в наличии
    * (то есть amount = 0)
    * Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
    * в случае успешного удаления
    */
    deleteOutOfStockSouvenirs() {
        return this._Souvenir.find({ amount: 0 }).remove();
    }

    /*
    * Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
    * в конец массива (чтобы сохранить упорядоченность по дате),
    * содержит login, rating, text - из аргументов,
    * date - текущая дата и isApproved - false
    * Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
    */
    async addReview(souvenirId, { login, rating, text }) {
        const entity = await this._Souvenir.findOne({ _id: souvenirId });
        const reviewsCount = entity.reviews.length;
        const currentRating = entity.rating;

        return entity.update({
            $push: { reviews: { login, date: new Date(), text, rating, isApproved: false } },
            $set: { rating: (reviewsCount * currentRating + rating) / (reviewsCount + 1) }
        });
    }

    /*
    * Данный метод должен считать общую стоимость корзины пользователя login
    * У пользователя может быть только одна корзина, поэтому это тоже можно отразить
    * в схеме
    */
    async getCartSum(login) {
        const ids = (await this._Cart.findOne({ login })).items.map(x => x.souvenirId);

        return (await this._Souvenir.find({ _id: { $in: ids } }, { price: 1 }))
            .map(x => x.price).reduce((a, b) => a + b, 0);
    }
};
