'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema( // eslint-disable-line new-cap
            {
                login: String,
                text: { type: String, required: true },
                rating: Number,
                isApproved: { type: Boolean, default: false }
            },
            {
                timestamps: { createdAt: 'date', updatedAt: false },
                _id: false
            }
        );

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [reviewSchema],
            name: { type: String, required: true },
            image: String,
            price: { type: Number, index: true, required: true },
            amount: { type: Number, default: 0 },
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean
        });

        const cartItemSchema = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: { type: mongoose.Schema.Types.ObjectId, required: true },
            amount: { type: Number, default: 1 }
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [cartItemSchema],
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
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
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
        return this._Souvenir.find({ name: { $regex: new RegExp(`.*${substring}.*`, 'i') } });
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
        const souvenir = await this._Souvenir.findById(souvenirId);
        souvenir.reviews.push({ login, rating, text });
        const overallRating = souvenir.reviews.reduce((accumulator, review) => {
            return accumulator + review.rating;
        }, 0);
        souvenir.rating = overallRating / souvenir.reviews.length;

        return souvenir.save();
    }

    /**
     * Считает общую стоимость корзины пользователя login
     * @param {String} login
     * @returns {Query}
     */
    async getCartSum(login) {
        const cart = await this._Cart.findOne({ login });
        const souvenirsIds = cart.items.map(item => item.souvenirId);
        const souvenirs = await this._Souvenir.find({ _id: { $in: souvenirsIds } });

        return cart.items.reduce((accumulator, cartItem) => {
            const appropriateSouvenir = souvenirs.find(souvenir => {
                return souvenir._id.equals(cartItem.souvenirId);
            });

            return accumulator + appropriateSouvenir.price * cartItem.amount;
        }, 0);
    }
};
