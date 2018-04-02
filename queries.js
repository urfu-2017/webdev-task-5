'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [mongoose.Schema.Types.Mixed],
            name: String,
            image: String,
            price: Number,
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [
                {
                    souvenirId: mongoose.Schema.Types.ObjectId,
                    amount: Number
                }
            ],
            login: { type: String, unique: true }
        });

        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }


    /**
     * Возвращает все сувениры
     * @returns {Query}
     */
    getAllSouvenirs() {
        return this._Souvenir.find();
    }


    /**
     * Возвращает все сувениры, цена которых меньше или равна price
     * @param {Number} price
     * @returns {Query}
     */
    getCheapSouvenirs(price) {
        return this._Souvenir.find({ price: { $lte: price } });
    }


    /**
     * Возвращает топ n сувениров с самым большим рейтингом
     * @param {Number} n
     * @returns {Query}
     */
    getTopRatingSouvenirs(n) {
        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }


    /**
     * Возвращает все сувениры, в тегах которых есть tag
     * В ответе только поля name, image и price
     * @param {String} tag
     * @returns {Query}
     */
    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: { $elemMatch: { $eq: tag } } },
            { name: 1, image: 1, price: 1, _id: 0 });
    }


    /**
     * Возвращает количество сувениров, из страны country, с рейтингом больше или равной rating,
     * и ценой меньше или равной price
     * @param {String} country
     * @param {String} rating
     * @param {String} price
     * @returns {Query}
     */
    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.count(
            {
                country,
                rating: { $gte: rating },
                price: { $lte: price }
            }
        );
    }


    /**
     * Возвращает все сувениры, в название которых входит подстрока substring.
     * Поиск регистронезависимый
     * @param {String} substring
     * @returns {Query}
     */
    searchSouvenirs(substring) {
        return this._Souvenir.find({ name: { $regex: `.*${substring}.*`, $options: 'i' } });
    }


    /**
     * Возвращает все сувениры, первый отзыв на которые был оставлен не раньше даты date
     * @param {Date} date
     * @returns {Query}
     */
    getDisscusedSouvenirs(date) {
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }


    /**
     * Удаляет все сувениры, которых нет в наличии
     * @returns {Query}
     */
    deleteOutOfStockSouvenirs() {
        return this._Souvenir.remove({ amount: 0 });
    }


    /**
     * Добавляет отзыв к сувениру souvenirId, отзыв добавляется в конец массива
     * (чтобы сохранить упорядоченность по дате),
     * содержит login, rating, text - из аргументов,
     * date - текущая дата и isApproved - false
     * При добавлении отзыва рейтинг сувенира пересчитывается
     * @param {ObjectId} souvenirId
     * @param {String} login
     * @param {Number} rating
     * @param {String} text
     * @returns {Query}
     */
    async addReview(souvenirId, { login, rating, text }) {
        return this._Souvenir
            .findById(souvenirId)
            .then(souvenir => {
                if (!souvenir) {
                    return;
                }
                souvenir.reviews.push(
                    {
                        login,
                        rating,
                        text,
                        date: new Date(),
                        isApproved: false
                        // id: 'some random id'
                    }
                );
                let overallRating = 0;
                /* eslint-disable-next-line no-return-assign*/
                souvenir.reviews.forEach(review => overallRating += review.rating);
                souvenir.rating = overallRating / souvenir.reviews.length;

                return souvenir.save();
            });
    }

    /**
     * Считает общую стоимость корзины пользователя login
     * @param {String} login
     * @returns {Query}
     */
    async getCartSum(login) {
        return this._Cart
            .findOne({ login })
            .then(cart => {
                if (!cart) {
                    return 0;
                }
                const promises = cart.items.reduce((accumulator, cartItem) => {
                    const promise = this._Souvenir.findById(cartItem.souvenirId)
                        .then(souvenir => (souvenir) ? souvenir.price * cartItem.amount : 0);
                    accumulator.push(promise);

                    return accumulator;
                }, []);

                return Promise.all(promises).then(prices => {
                    return prices.reduce((accumulator, souvenirPrice) => {
                        return accumulator + souvenirPrice;
                    }, 0);
                });
            });
    }
};
