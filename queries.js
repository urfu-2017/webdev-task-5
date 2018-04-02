'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema({ // eslint-disable-line new-cap
            login: String,
            date: Date,
            text: String,
            rating: Number,
            isApproved: Boolean
        });

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [reviewSchema],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: String,
            rating: { type: Number, index: true },
            isRecent: Boolean
            // Ваша схема сувенира тут
        });

        const itemSchema = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: String,
            amount: Number
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема корзины тут
            items: [itemSchema],
            login: { type: String, unique: true }
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getSouvenirByID(id) {
        return this._Souvenir.find({ _id: id });
    }

    getCheapSouvenirs(price) {
        return this._Souvenir.find({ price: { $lte: price } });
    }

    getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
        return this._Souvenir.find().sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir
            .count({ country, rating: { $gte: rating }, price: { $lte: price } });
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir.find({ name: new RegExp(substring, 'i') });
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)
        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
        return this._Souvenir.remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        let updatedReviews = [];
        let updatedRating = 0;
        await this._Souvenir.find({ _id: souvenirId })
            .then(entryArr => {
                const reviews = entryArr[0].reviews;
                reviews.push({
                    login, date: new Date(), text, rating, isApproved: false
                });
                updatedReviews = reviews;
                updatedRating = reviews.reduce((acc, entry, idx) => {
                    return (acc * idx + entry.rating) / (idx + 1);
                }, 0);
            });
        await this._Souvenir.update({ _id: souvenirId },
            { $set: { rating: updatedRating, reviews: updatedReviews } });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        let total = 0;
        const ids = [];
        const amounts = [];
        await this._Cart.find({ login }).then(res => {
            res[0].items.forEach(souvenir => {
                ids.push(souvenir.souvenirId);
                amounts.push(souvenir.amount);
            });
        });
        await this._Souvenir.find({ _id: { $in: ids } }).then(res => {
            amounts.reverse();
            total = res.reduce((acc, souvenir, idx) => {
                return acc + souvenir.price * amounts[idx];
            }, 0);
        });

        return total;
    }
};
