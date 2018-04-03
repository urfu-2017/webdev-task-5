'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const schema = mongoose.Schema;
        const { ObjectId } = schema;
        const PositiveNumber = { type: Number, min: 0 };

        const reviewSchema = schema({
            _id: ObjectId,
            login: String,
            date: Date,
            text: String,
            rating: PositiveNumber,
            isApproved: Boolean
        });
        const souvenirSchema = schema({
            name: String,
            tags: [String],
            reviews: [reviewSchema],
            image: String,
            price: PositiveNumber,
            amount: PositiveNumber,
            country: String,
            rating: PositiveNumber,
            isRecent: Boolean

        });
        souvenirSchema.index({ country: 1, rating: 1, price: 1 });

        const cartItemSchema = schema({
            souvenirId: ObjectId,
            amount: PositiveNumber
        });
        const cartSchema = schema({
            login: { type: String, unique: true },
            items: [cartItemSchema]
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Далее идут методы, которые вам необходимо реализовать:

    // Данный метод должен возвращать все сувениры
    getAllSouvenirs() {
        return this._Souvenir
            .find();
    }

    // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
    getCheapSouvenirs(price) {
        return this._Souvenir
            .find({ price: { $lte: price } });
    }

    // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
    getTopRatingSouvenirs(n) {
        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }

    // Данный метод должен возвращать все сувениры, в тегах которых есть tag
    // Кроме того, в ответе должны быть только поля name, image и price
    getSouvenirsByTag(tag) {
        return this._Souvenir
            .find({ tags: tag }, { _id: 0, name: 1, image: 1, price: 1 });
    }

    // Данный метод должен возвращать количество сувениров,
    // из страны country, с рейтингом больше или равной rating,
    // и ценой меньше или равной price

    // ! Важно, чтобы метод работал очень быстро,
    // поэтому учтите это при определении схем
    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir
            .count({
                country,
                rating: { $gte: rating },
                price: { $lte: price }
            });
    }

    // Данный метод должен возвращать все сувениры, в название которых входит
    // подстрока substring. Поиск должен быть регистронезависимым
    searchSouvenirs(substring) {
        return this._Souvenir
            .find({ name: { $regex: substring, $options: 'i' } });
    }

    // Данный метод должен возвращать все сувениры,
    // первый отзыв на которые был оставлен не раньше даты date
    getDisscusedSouvenirs(date) {
        return this._Souvenir
            .find({ 'reviews.0.date': { $gte: date } });
    }

    // Данный метод должен удалять все сувениры, которых нет в наличии
    // (то есть amount = 0)

    // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
    // в случае успешного удаления
    deleteOutOfStockSouvenirs() {
        return this._Souvenir
            .deleteMany({ amount: 0 });
    }


    // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
    // в конец массива (чтобы сохранить упорядоченность по дате),
    // содержит login, rating, text - из аргументов,
    // date - текущая дата и isApproved - false
    // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
    async addReview(souvenirId, { login, rating, text }) {
        const souvenir = await this._Souvenir.findOne({ _id: souvenirId });
        const review = { login, text, rating, date: new Date(), isApproved: false };

        const reviewsCount = souvenir.reviews.length;
        souvenir.rating = (souvenir.rating * reviewsCount + rating) / (reviewsCount + 1);
        souvenir.reviews.push(review);

        return souvenir.save();
    }

    // Данный метод должен считать общую стоимость корзины пользователя login
    // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
    // в схеме
    async getCartSum(login) {
        const result = await this._Cart
            .aggregate()
            .match({ login })
            .unwind('items')
            .replaceRoot('items')
            .lookup({
                from: 'souvenirs',
                localField: 'souvenirId',
                foreignField: '_id',
                as: 'souvenirs'
            })
            .unwind('souvenirs')
            .group({
                _id: null,
                cost: { $sum: { $multiply: ['$souvenirs.price', '$amount'] } }
            });


        if (result.length > 0) {
            return result[0].cost;
        }

        return 0;
    }
};
