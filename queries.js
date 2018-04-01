'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [{ login: String, date: Date,
                text: String, rating: Number, isApproved: Boolean }],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: String,
            rating: { type: Number, index: true },
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            // Ваша схема корзины тут
            items: [{ souvenirId: String, amount: Number }],
            login: { type: String, unique: true }
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        return this._Souvenir.find({ price: { $lte: price } });
    }

    getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
        return this._Souvenir.find().sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir
            .find({
                $and:
                    [{ country }, { rating: { $gte: rating } }, { price: { $lte: price } }]
            },
            { _id: 0, amount: 1 })
            .then(res => {
                let sum = 0;
                res.forEach(entry => {
                    sum += entry.amount;
                });

                return sum;
            });
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir.find({ name: new RegExp(substring, 'i') });
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        const resArr = [];

        return this._Souvenir.find({}, { _id: 1, reviews: 1 })
            .then(res => {
                res.forEach(entry => {
                    if (entry.reviews[0] && entry.reviews[0].date >= date) {
                        resArr.push(entry._id.toString());
                    }
                });
            })
            .then(() => this._Souvenir.findOne({ _id: { $in: resArr } }));
    }

    deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)
        let deletedSouvenirs = 0;
        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления

        return this._Souvenir.find({ amount: 0 }).then(res => {
            deletedSouvenirs = res.length;
        })
            .then(() => this._Souvenir.remove({ amount: 0 }))
            .then(() => {
                return { ok: 1, n: deletedSouvenirs };
            });
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        let oldRating = 0;
        let rates = 0;
        await this._Souvenir.findOne({ _id: souvenirId })
            .then(entryArr => {
                const reviews = entryArr[0].reviews;
                reviews.forEach(comment => {
                    oldRating += comment.rating;
                    rates++;
                });
            })
            .then(() => {
                const updatedRating = (oldRating + rating) / (rates + 1);
                this._Souvenir.update({ _id: souvenirId },
                    { $set: { rating: updatedRating } })
                    .then(() => this._Souvenir.update(
                        { _id: souvenirId },
                        {
                            $push: {
                                reviews: {
                                    login, date: new Date(), text, rating, isApproved: false
                                }
                            }
                        }
                    ));
            });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        let total = 0;
        const ids = [];
        const amounts = [];
        await this._Cart.find({ login }).then(res => {
            res[0].items.forEach(souvenir => {
                ids.push(souvenir.souvenirId);
                amounts.push(souvenir.amount);
            });
        });
        await this._Souvenir.findOne({ _id: { $in: ids } }).then(res => {
            res.forEach((souvenir, idx) => {
                total += souvenir.price * amounts[idx];
            });
        });

        return total;
    }
};
