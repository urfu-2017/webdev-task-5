'use strict';

class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewSchema = new mongoose.Schema({
            login: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: () => new Date()
            },
            text: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            isApproved: {
                type: Boolean,
                default: false
            }
        }, { _id: false });

        const souvenirSchema = new mongoose.Schema({
            name: {
                type: String,
                required: true
            },
            image: {
                type: String,
                match: new RegExp('^https://picsum.photos/')
            },
            price: {
                type: Number,
                required: true
            },
            amount: {
                type: Number,
                default: 1
            },
            country: String,
            rating: {
                type: Number,
                default: 0
            },
            isRecent: {
                type: Boolean,
                default: true
            },
            tags: [{
                type: String,
                lowercase: true
            }],
            reviews: [reviewSchema]
        });

        const cartSchema = new mongoose.Schema({
            login: {
                type: String,
                required: true
            },
            items: [{
                souvenirId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },
                amount: {
                    type: Number,
                    required: true
                }
            }]
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Далее идут методы, которые вам необходимо реализовать:

    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
        return this._Souvenir.where('price').lte(price);
    }

    getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
        return this._Souvenir
            .find()
            .sort('-rating')
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir
            .find({ tags: { $elemMatch: { $eq: tag } } })
            .select('name image price -_id');
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir.count({
            country: { $eq: country },
            rating: { $gte: rating },
            price: { $lte: price }
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
        return this._Souvenir.where('reviews.0.date').gte(date);
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

        const reviews = (await this._Souvenir.findById(souvenirId, 'reviews rating')).reviews;
        const ratingSum = reviews.reduce((prev, review) => prev + review.rating, 0) + rating;
        const newRating = ratingSum / (reviews.length + 1);

        const newReview = {
            login,
            rating,
            text
        };

        await this._Souvenir.findByIdAndUpdate(souvenirId, {
            rating: newRating,
            $push: {
                reviews: newReview
            }
        });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме

        const items = (await this._Cart.findOne({ login })).items;
        let sum = 0;

        for (const item of items) {
            sum += (await this._Souvenir.findById(item.souvenirId)).price * item.amount;
        }

        return sum;
    }
}

module.exports = Queries;
