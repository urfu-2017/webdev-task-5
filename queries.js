'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const reviewsSchema = mongoose.Schema({ // eslint-disable-line new-cap
            login: String,
            date: { type: Date, default: Date.now },
            text: String,
            rating: { type: Number, min: 0, max: 10 },
            isApproved: Boolean
        }, { _id: false });
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [reviewsSchema],
            name: String,
            image: String,
            price: { type: Number, index: true, min: 0 },
            amount: { type: Number, min: 0 },
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            login: { type: String, unique: true },
            items: [{
                souvenirId: mongoose.Schema.Types.ObjectId,
                amount: Number
            }]
        });

        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        return this._Souvenir.where('price')
            .lte(price);
    }

    getTopRatingSouvenirs(n) {
        // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
        return this._Souvenir.where()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir.find({ tags: tag }, { name: 1, image: 1, price: 1, _id: 0 });
    }

    async getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        let souvenirs = await this._Souvenir.where('country', country)
            .where('rating')
            .gte(rating)
            .where('price')
            .lte(price);

        return souvenirs.length;
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir.find({ name: { $regex: substring, $options: 'i' } });
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        return this._Souvenir.where('reviews.0.date')
            .gte(date);
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
        return this._Souvenir.findOne({ _id: souvenirId }, { reviews: 1 })
            .then(souvenir => {
                let ratingsSum = 0;
                for (let i = 0; i < souvenir._doc.reviews.length; i++) {
                    ratingsSum += souvenir._doc.reviews[i].rating;
                }
                souvenir.reviews.push({
                    login,
                    text,
                    rating,
                    isApproved: false
                });
                let newRating = ratingsSum / souvenir.reviews.length;
                souvenir.rating = newRating;

                return souvenir.save();
            });
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const cart = await this._Cart.where('login', login);
        let goods = [];
        cart[0].items.forEach(item => {
            goods.push({ id: item._doc.souvenirId, amount: item._doc.amount });
        });
        let sum = 0;
        for (let i = 0; i < goods.length; i++) {
            let price = await this._Souvenir.find({ _id: goods[i].id }, { price: 1, _id: 0 });
            goods[i].price = price[0].price;
            sum += goods[i].price * goods[i].amount;
        }

        return sum;
    }
};
