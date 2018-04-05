'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема сувенира тут
            _id: mongoose.Schema.Types.ObjectId,
            tags: Array,
            reviews: [{
                login: String,
                rating: Number,
                text: String,
                date: { type: Date, default: Date.now },
                isApproved: Boolean }],
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
                { souvenirId: mongoose.Schema.Types.ObjectId, amount: Number }
            ],
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

        return this._Souvenir.find({});
    }

    getCheapSouvenirs(price) {
        // Данный метод должен возвращать все сувениры, цена которых меньше или равна price

        return this._Souvenir.find({ price: { $lte: price } });
    }

    getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом

        return this._Souvenir.find({})
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price

        return this._Souvenir.find(
            { tags: tag },
            { _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        return this._Souvenir.count({
            country: country,
            rating: { $gte: rating },
            price: { $lte: price }
        });

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым

        return this._Souvenir.find({ name: { '$regex': substring, $options: 'i' } });
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date

        return this._Souvenir.find({ 'reviews.0.date': { $gte: new Date(date) } });
    }

    deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)

        return this._Souvenir.remove({ amount: 0 });

        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан

        const note = await this._Souvenir.findOne({ _id: souvenirId }, { rating: 1, reviews: 1 });

        const noteRating = (note.rating * note.reviews.length + rating) / (note.reviews.length + 1);

        await this._Souvenir.update(
            { _id: souvenirId },
            {
                $set: { rating: noteRating },
                $push: { reviews: {
                    login,
                    rating,
                    text,
                    date: new Date(),
                    isApproved: false
                } }
            }
        );

        return true;
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме

        let fullPrice = 0;
        const user = await this._Cart.findOne({ login: login });
        for (let i = 0; i < user.items.length; i++) {
            const note = await this._Souvenir.findOne(
                { _id: user.items[i].souvenirId },
                { price: 1 });
            fullPrice += note.price * user.items[i].amount;
        }

        return fullPrice;
    }
};
