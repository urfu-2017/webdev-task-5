'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема сувенира тут
            _id: mongoose.Schema.Types.ObjectId,
            tags: [String],
            name: String,
            reviews: [mongoose.Schema({ // eslint-disable-line new-cap
                _id: mongoose.Schema.Types.ObjectId,
                login: String,
                date: Date,
                text: String,
                rating: Number,
                isApproved: Boolean
            })],
            image: String,
            price: Number,
            amount: Number,
            country: { type: String, index: true },
            rating: Number,
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема корзины тут
            _id: mongoose.Schema.Types.ObjectId,
            items: [mongoose.Schema({ // eslint-disable-line new-cap
                souvenirId: { type: mongoose.Schema.Types.ObjectId, ref: 'Souvenir' },
                amount: Number
            })],
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
        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir.find(
            {
                tags: tag
            },
            {
                _id: 0,
                name: 1,
                image: 1,
                price: 1
            });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price
        return this._Souvenir
            .find({
                country,
                rating: { $gte: rating },
                price: { $lte: price }
            })
            .count();

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
        const DATE = new Date(date);

        return this._Souvenir.find({ 'reviews.0.date': { $gte: DATE } });
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
        await this._Souvenir.update(
            { _id: souvenirId },
            {
                $set: { rating: newRating },
                $push: { reviews: {
                    login,
                    rating,
                    text,
                    date: new Date(),
                    isApproved: false
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

        // Прохожу по каждому товару, узнаю его цену и коплю
        return items.reduce(async (acc, { souvenirId, amount }) => {
            const { price } = await this._Souvenir.findOne({ _id: souvenirId });

            return acc + price * amount;
        }, 0);
    }
};
