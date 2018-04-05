'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        // const souvenirReviewSchema = new mongoose.Schema({
        //     login: String,
        //     date: Date,
        //     text: String,
        //     rating: Number,
        //     isApproved: Boolean
        // });

        const souvenirSchema = new mongoose.Schema({
            tags: [String],
            reviews: [mongoose.Schema.Types.Mixed],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean
        });

        const cartItemSchema = new mongoose.Schema({
            souvenirId: { type: mongoose.Schema.Types.ObjectId, ref: 'Souvenir' },
            amount: Number
        });

        const cartSchema = new mongoose.Schema({
            items: [cartItemSchema],
            login: { type: String, unique: true }
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
        return this._Souvenir
            .find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir
            .count({ country, rating: { $gte: rating }, price: { $lte: price } });
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
    }

    searchSouvenirs(substring) {
        return this._Souvenir
            .find({ name: { $regex: substring, $options: 'i' } });
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir
            .find({ 'reviews.0.date': { $gte: date } });
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
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
        const souvenir = await this._Souvenir.findOne({ _id: souvenirId });
        souvenir.reviews.push({
            login,
            rating,
            text,
            date: new Date(),
            isApproved: false
        });
        souvenir.rating = souvenir.reviews
            .map(review => review.rating)
            .reduce((total, currentRating) => total + currentRating, 0) / souvenir.reviews.length;

        return await souvenir.save();
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
    }

    async getCartSum(login) {
        const cart = await this._Cart
            .findOne({ login })
            .populate('items.souvenirId');

        return cart.items
            .map(item => item.souvenirId ? item.souvenirId.price * item.amount : 0)
            .reduce((total, price) => total + price, 0);
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
    }
};
