'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            login: String,
            date: Date,
            text: String,
            rating: Number,
            isApproved: {
                type: Boolean,
                default: false
            }
        }, { timestamps: { createdAt: 'date' } });

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            tags: [String],
            name: {
                type: String,
                required: true
            },
            reviews: [reviewSchema],
            image: String,
            price: {
                type: Number,
                required: true,
                default: 0
            },
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean
        });

        const itemSchema = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: mongoose.Schema.Types.ObjectId,
            amount: {
                type: Number,
                default: 1
            }
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [itemSchema],
            login: {
                type: String, unique: true
            }
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Далее идут методы, которые вам необходимо реализовать:

    getAllSouvenirs() {
        return this._Souvenir.find({});
    }

    getCheapSouvenirs(price) {
        // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
        return this._Souvenir.find({
            price: { $lte: price }
        });
    }

    getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
        return this._Souvenir.find().sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir.find({ tags: { $in: [tag] } },
            { _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price
        return this._Souvenir.find({
            country: country,
            rating: { $gte: rating },
            price: { $lte: price }
        }).count();

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        const reg = new RegExp(substring, 'i');

        return this._Souvenir.find({
            name: reg
        });
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        const dateNow = new Date(date);

        return this._Souvenir.find({ 'reviews.0.date': { $gte: dateNow } });
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

        // Беру сувенир, чтобы высчитать новый рейтинг
        const item = await this._Souvenir.findOne({ _id: souvenirId },
            { _id: 0, rating: 1, reviews: 1 });
        const newRating = (item.rating * item.reviews.length + rating) / (item.reviews.length + 1);

        // Обновляю
        await this._Souvenir.update({ _id: souvenirId }, {
            $set: { rating: newRating },
            $push: { reviews: {
                login,
                rating,
                text
            } }
        });

        return true;
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        // Получаю все товары в корзине
        const cart = await this._Cart.findOne({ login: login });
        const items = cart.items;
        // Массив id-ов товаров в корзине
        const ids = [];
        items.forEach(item => {
            ids.push(item.souvenirId);
        });

        // Ищу все товары подходящие запросом и дальше сопоставляю
        let sum = 0;
        const souvenirs = await this._Souvenir.find({ _id: { $in: ids } }, { price: 1 });
        souvenirs.forEach(souvenir => {
            items.forEach(item => {
                if (String(souvenir._id) === String(item.souvenirId)) {
                    sum += souvenir.price * item.amount;

                    return true;
                }
            });
        });

        return sum;
    }
};
