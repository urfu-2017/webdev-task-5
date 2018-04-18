'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = mongoose.Schema({ // eslint-disable-line new-cap
            _id: mongoose.Schema.Types.ObjectId,
            login: { type: String, required: true },
            rating: { type: Number, min: 1, max: 5, required: true },
            text: { type: String, required: true },
            date: { type: Date, default: () => new Date() },
            isApproved: { type: Boolean, default: false }
        });

        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема сувенира тут
            _id: mongoose.Schema.Types.ObjectId,
            country: { type: String, index: true },
            name: { type: String, required: true },
            price: { type: Number, min: 0, required: true },
            amount: { type: Number, min: 0, required: true },
            image: String,
            isRecent: Boolean,
            tags: [String],
            reviews: [reviewSchema],
            rating: { type: Number, min: 1, max: 5 }
        });

        const cartItemSchema = mongoose.Schema({ // eslint-disable-line new-cap
            souvenirId: mongoose.Schema.Types.ObjectId,
            amount: { type: Number, min: 0, required: true }
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема корзины тут
            _id: mongoose.Schema.Types.ObjectId,
            login: { type: String, unique: true },
            items: [cartItemSchema]
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
        this._Review = mongoose.model('Review', reviewSchema);
    }

    // Далее идут методы, которые вам необходимо реализовать:

    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
        return this._Souvenir.find({ price: { $lte: price } });
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
            { tags: tag },
            { name: 1, image: 1, price: 1, _id: 0 }
        );
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

    async deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)

        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
        const souvenirs = await this._Souvenir.find({ amount: 0 }, { _id: 1 });
        const ids = souvenirs.map(s => s.id);

        await Promise.all([
            this._Souvenir.remove({ _id: { $in: ids } }),
            this._Cart.update(
                { 'items.souvenirId': { $in: ids } },
                { $pull: { items: { souvenirId: { $in: ids } } } }, { multi: true })
        ]);

        return { ok: 1, n: ids.length };
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        const souvenir = await this._Souvenir.findOne({ _id: souvenirId });

        const cumulativeRating = souvenir.rating * souvenir.reviews.length;
        const newRating = (cumulativeRating + rating) / (souvenir.reviews.length + 1);
        const review = new this._Review({ login, rating, text });

        return this._Souvenir.update({ _id: souvenirId }, {
            $push: { reviews: review },
            $set: { rating: newRating }
        });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const result = await this._Cart
            .aggregate()
            .match({ login })
            .unwind('items')
            .lookup({
                from: this._Souvenir.collection.name,
                localField: 'items.souvenirId',
                foreignField: '_id',
                as: 'souvenirs'
            })
            .unwind('souvenirs')
            .group({
                _id: null,
                totalPrice: {
                    $sum: { $multiply: ['$items.amount', '$souvenirs.price'] }
                }
            });

        return result.length ? result[0].totalPrice : 0;
    }
};
