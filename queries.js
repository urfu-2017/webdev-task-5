'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema({ // eslint-disable-line new-cap
            id: String,
            login: String,
            date: Date,
            text: String,
            rating: Number,
            isApproved: Boolean
        });

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            tags: [String],
            reviews: [reviewSchema],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean,
            __v: Number
        });

        const cartItemSchema = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: { type: mongoose.Schema.Types.ObjectId, ref: 'Souvenir' },
            amount: Number
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            items: [cartItemSchema],
            login: { type: String, index: true, unique: true }
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Далее идут методы, которые вам необходимо реализовать:

    getAllSouvenirs() {
        // Данный метод должен возвращать все сувениры
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
        return this._Souvenir
            .find()
            .where('price')
            .lte(price);
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
            .find({ tags: tag })
            .select({ _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir
            .find({ country, rating: { $gte: rating }, price: { $lte: price } })
            .count();
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir
            .find({ name: { $regex: substring, $options: 'i' } });
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
        const souvenir = await this._Souvenir.findByIdAndUpdate(souvenirId);
        souvenir.reviews.push({
            login,
            rating,
            text,
            date: Date.now(),
            isApproved: false
        });
        const ratings = souvenir.reviews.map(review => review.rating);
        souvenir.rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        await souvenir.save();
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const cart = await this._Cart
            .findOne({ login })
            .populate('items.souvenirId');

        return cart.items
            .map(item => item.souvenirId ? item.souvenirId.price * item.amount : 0)
            .reduce((a, b) => a + b, 0);
    }
};
