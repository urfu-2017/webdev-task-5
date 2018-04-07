'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean,
            tags: Array,
            reviews: Array
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            login: { type: String, unique: true },
            items: Array
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
            .find({
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
        return this._Souvenir
            .find(
                {
                    tags: tag
                },
                {
                    _id: 0,
                    name: 1,
                    image: 1,
                    price: 1
                }
            );
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir
            .count(
                {
                    price: { $lte: price },
                    rating: { $gte: rating },
                    country: country
                }
            );
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir
            .find(
                {
                    name: new RegExp(substring, 'i')
                }
            );
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        return this._Souvenir
            .find({
                'reviews.0.date': { $gte: date }
            });
    }

    deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)

        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
        return this._Souvenir.remove(
            { amount: 0 }
        );
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        const souvenirRating = await this._Souvenir.findById(souvenirId)
            .then(souvenir => {
                return (souvenir.rating * souvenir.reviews.length + rating) /
                (souvenir.reviews.length + 1);
            });

        return this._Souvenir
            .update({
                _id: souvenirId
            }, {
                $set: {
                    rating: souvenirRating
                },
                $push: {
                    reviews: {
                        login,
                        rating,
                        text,
                        date: new Date(),
                        isApproved: false
                    }
                }
            });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const cart = await this._Cart
            .findOne({ login });

        const souvenirsIds = cart.items.map(item => item.souvenirId);

        const souvenirs = await this._Souvenir
            .find({
                _id: { $in: souvenirsIds }
            });

        return souvenirs.reduce((acc, souvenir) => {
            const amount = cart
                .items
                .find(i => i.souvenirId.toString() === souvenir._id.toString())
                .amount;

            return acc + (souvenir.price * amount);
        }, 0);
    }
};
