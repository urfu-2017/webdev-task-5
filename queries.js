'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема сувенира тут
            tags: [String],
            reviews: [mongoose.Schema({ // eslint-disable-line new-cap
                _id: mongoose.Schema.Types.ObjectId,
                login: String,
                date: Date,
                text: String,
                rating: Number,
                isApproved: Boolean
            })],
            name: { type: String, required: true },
            image: String,
            price: {
                type: Number,
                min: 0,
                get: v => Math.round(v),
                set: v => Math.round(v),
                required: true,
                index: true
            },
            amount: {
                type: Number,
                min: 0,
                get: v => Math.round(v),
                set: v => Math.round(v),
                required: true
            },
            country: { type: String, index: true },
            rating: { type: Number, required: true, index: true },
            isRecent: Boolean
        });

        const cartItemSchema = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: { type: mongoose.Schema.Types.ObjectId, required: true },
            amount: { type: Number, required: true, min: 0 }
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема корзины тут
            login: { type: String, required: true, index: { unique: true } },
            items: { type: [cartItemSchema] }
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
        return this._Souvenir.find({ price: { $lte: price } });
    }

    getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
        return this._Souvenir.find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir.find({ tags: { $regex: tag } },
            { _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price
        return this._Souvenir.find({ $and: [
            { country: { $eq: country } },
            { rating: { $gte: rating } },
            { price: { $lte: price } }
        ] }).count();
        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
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
        let souvenir = await this._Souvenir.findById(souvenirId);
        let review = {
            login,
            rating,
            text,
            date: new Date(),
            isApproved: false
        };
        souvenir.reviews.push(review);
        souvenir.rating = Math.round(this.getNewRating(souvenir), 1);

        return souvenir.save();
    }

    getNewRating(souvenir) {
        let sum = 0;
        for (let review of souvenir.reviews) {
            sum += review.rating;
        }

        return sum / souvenir.reviews.length;
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        let cart = await this._Cart.findOne({ login: login });
        let souvenirsIdToAmount = {};
        for (let souvenir of cart.items) {
            souvenirsIdToAmount[souvenir.souvenirId] = souvenir.amount;
        }
        let souvenirs = await this._Souvenir
            .find({ _id: { $in: Object.keys(souvenirsIdToAmount) } });

        let totalPrice = 0;
        for (let souvenir of souvenirs) {
            totalPrice += souvenir.price * souvenirsIdToAmount[souvenir._id];
        }

        return totalPrice;
    }
};
