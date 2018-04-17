'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {

        const reviewSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            login: String,
            date: { type: Date, default: Date.now },
            text: String,
            rating: { type: Number, min: 0, max: 5 },
            isApproved: { type: Boolean, default: false }
        });

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [reviewSchema],
            name: String,
            image: String,
            price: { type: Number, index: true, min: 0 },
            amount: { type: Number, min: 0 },
            country: { type: String, index: true },
            rating: { type: Number, min: 0, max: 5 },
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            login: { type: String, unique: true },
            items: [{
                souvenirId: { type: mongoose.Schema.ObjectId, ref: 'Souvenir' },
                amount: { type: Number, min: 0 }
            }]
        });

        this._Review = mongoose.model('Review', reviewSchema);
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

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
            .select({ name: 1, price: 1, image: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем

        return this._Souvenir.find()
            .where('country')
            .equals(country)
            .where('rating')
            .gte(rating)
            .where('price')
            .lte(price)
            .count();
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

        const souvenir = await this._Souvenir.findById(souvenirId);
        const oldRating = souvenir.rating;
        const length = souvenir.reviews.length;

        const newRating = (oldRating * length + rating) / (length + 1);

        const review = new this._Review({ login, rating, text });

        souvenir.reviews.push(review);
        souvenir.rating = newRating;

        return await souvenir.save();
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const cart = await this._Cart.findOne({ login }).populate('items.souvenirId', 'price');

        return cart.items.reduce((previous, item) => {
            return previous + item.souvenirId.price * item.amount;
        }, 0);
    }
};
