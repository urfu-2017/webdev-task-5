'use strict';

const sum = arr => arr.reduce((a, b) => a + b, 0);

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema({ // eslint-disable-line new-cap
            date: { type: Date, default: Date.now },
            id: String,
            isApproved: { type: Boolean, default: false },
            login: String,
            rating: Number,
            text: String
        });

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            amount: { type: Number, min: 0 },
            country: String,
            image: String,
            isRecent: Boolean,
            name: String,
            price: { type: Number, min: 0 },
            rating: { type: Number, min: 0, max: 5 },
            reviews: [reviewSchema],
            tags: [String]
        });

        souvenirSchema.index({ country: 1 });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема корзины тут
            login: String,
            items: [{
                amount: { type: Number, min: 0 },
                souvenirId: mongoose.Schema.Types.ObjectId
            }]
        });

        cartSchema.index({ login: 1 }, { unique: true });

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
        return this._Souvenir
            .find()
            .where({ price: { $lte: price } });
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
            .select({ name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir.count({
            country,
            rating: { $gte: rating },
            price: { $lte: price }
        });
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir.find({ name: { $regex: substring, $options: 'i' } });
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
        const review = { login, rating, text };

        await this._Souvenir.findByIdAndUpdate(souvenirId, souvenir => {
            const raitingSum = souvenir.rating * souvenir.reviews.length + rating;

            souvenir.reviews.push(review);
            souvenir.rating = raitingSum / souvenir.reviews.length;
        });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const cart = await this._Cart.findOne({ login });

        return sum(cart.items.map(async item => {
            const souvenir = await this._Cart.findById(item.souvenirId);

            return souvenir.price * item.amount;
        }));
    }
};
