/* eslint-disable newline-per-chained-call */
'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [mongoose.Schema.Types.String],
            name: mongoose.Schema.Types.String,
            reviews: [mongoose.Schema({ // eslint-disable-line new-cap
                _id: mongoose.Schema.Types.ObjectId,
                login: mongoose.Schema.Types.String,
                data: mongoose.Schema.Types.Date,
                text: mongoose.Schema.Types.String,
                rating: mongoose.Schema.Types.Number,
                isApproved: mongoose.Schema.Types.Boolean
            })],
            image: mongoose.Schema.Types.String,
            price: {
                type: mongoose.Schema.Types.Number,
                index: true,
                min: 0
            },
            amount: {
                type: mongoose.Schema.Types.Number,
                min: 0
            },
            country: { type: mongoose.Schema.Types.String, index: true },
            rating: {
                type: mongoose.Schema.Types.Number,
                index: true,
                min: 1,
                max: 5
            },
            isRecent: mongoose.Schema.Types.Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            login: { type: mongoose.Schema.Types.String, unique: true },
            items: [mongoose.Schema({ // eslint-disable-line new-cap
                souvenirId: mongoose.Schema.Types.ObjectId,
                amount: mongoose.Schema.Types.Number
            })]
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Данный метод должен возвращать все сувениры
    getAllSouvenirs() {
        return this._Souvenir.find();
    }

    // Данный метод должен возвращать все сувениры, цена которых меньше или равна price
    getCheapSouvenirs(price) {
        return this._Souvenir
            .where('price').lte(price)
            .exec();
    }

    // Данный метод должен возвращать топ n сувениров с самым большим рейтингом
    getTopRatingSouvenirs(n) {
        return this._Souvenir.find().sort('-rating').limit(n);
    }


    // Данный метод должен возвращать все сувениры, в тегах которых есть tag
    // Кроме того, в ответе должны быть только поля name, image и price
    getSouvenirsByTag(tag) {
        return this._Souvenir
            .where('tags', tag)
            .select({ name: 1, image: 1, price: 1, _id: 0 })
            .exec();
    }

    // Данный метод должен возвращать количество сувениров,
    // из страны country, с рейтингом больше или равной rating,
    // и ценой меньше или равной price
    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir
            .where('country', country)
            .where('rating').gte(rating)
            .where('price').lte(price)
            .count();
    }

    // Данный метод должен возвращать все сувениры, в название которых входит
    // подстрока substring. Поиск должен быть регистронезависимым
    searchSouvenirs(substring) {
        return this._Souvenir
            .where('name').regex(new RegExp(substring, 'i'))
            .exec();
    }

    // Данный метод должен возвращать все сувениры,
    // первый отзыв на которые был оставлен не раньше даты date
    getDisscusedSouvenirs(date) {
        return this._Souvenir
            .where('reviews.0.date').gte(date)
            .exec();
    }

    // Данный метод должен удалять все сувениры, которых нет в наличии
    // (то есть amount = 0)
    // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
    // в случае успешного удаления
    deleteOutOfStockSouvenirs() {
        return this._Souvenir
            .where('amount', 0)
            .remove();
    }

    // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
    // в конец массива (чтобы сохранить упорядоченность по дате),
    // содержит login, rating, text - из аргументов,
    // date - текущая дата и isApproved - false
    // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
    async addReview(souvenirId, { login, rating, text }) {
        const souvenir = await this._Souvenir.findById(souvenirId);

        const date = new Date();
        const isApproved = false;
        const reviewCount = souvenir.reviews.length;

        souvenir.rating = (souvenir.rating * reviewCount + rating) / (reviewCount + 1);
        souvenir.reviews.push({ login, text, rating, date, isApproved });

        return souvenir.save();
    }

    // Данный метод должен считать общую стоимость корзины пользователя login
    // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
    // в схеме
    async getCartSum(login) {
        const cart = await this._Cart.where('login', login).exec();
        const items = cart[0].items;
        const souvenirIds = items.map(item => item.souvenirId);

        const souvenirs = await this._Souvenir
            .where('_id').in(souvenirIds)
            .select('_id price amount')
            .exec();

        const souvenirsMap = souvenirs.reduce((result, souvenir) => {
            result[souvenir._id] = souvenir;

            return result;
        }, {});


        return items.reduce((total, item) => {
            const souvenir = souvenirsMap[item.souvenirId] || { price: 0, amount: 0 };
            const amount = Math.min(item.amount, souvenir.amount);

            return total + souvenir.price * amount;
        }, 0);
    }
};
