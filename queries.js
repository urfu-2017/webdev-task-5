'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [{
                id: String,
                login: String,
                date: {
                    type: Date,
                    default: Date.now
                },
                text: String,
                rating: Number,
                isApproved: {
                    type: Boolean,
                    default: false
                }
            }],
            name: String,
            image: String,
            price: Number,
            amount: Number,
            country: String,
            rating: Number,
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [{
                souvenirId: mongoose.Schema.ObjectId,
                amount: Number
            }],
            login: {
                type: String,
                unique: true,
                index: true
            }
        });

        // Модели в таком формате нужны для корректного запуска тестов
        this._Souvenir = mongoose.model('Souvenir', souvenirSchema, souvenirsCollection);
        this._Cart = mongoose.model('Cart', cartSchema, cartsCollection);
    }

    // Далее идут методы, которые вам необходимо реализовать:

    async getAllSouvenirs() {
        return this._Souvenir.find();
    }

    getCheapSouvenirs(price) {
        return this._Souvenir.find({
            price: {
                $lte: price
            }
        });
    }

    getTopRatingSouvenirs(n) {
        return this._Souvenir
            .find()
            .sort({
                rating: -1
            })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        // Данный метод должен возвращать все сувениры, в тегах которых есть tag
        // Кроме того, в ответе должны быть только поля name, image и price
        return this._Souvenir
            .find({
                tags: {
                    $all: [tag]
                }
            }, {
                name: 1,
                image: 1,
                price: 1
            });
    }

    getSouvenrisCount({ country, rating, price }) {
        // Данный метод должен возвращать количество сувениров,
        // из страны country, с рейтингом больше или равной rating,
        // и ценой меньше или равной price

        // ! Важно, чтобы метод работал очень быстро,
        // поэтому учтите это при определении схем
        return this._Souvenir
            .find({
                country,
                rating: {
                    $gte: rating
                },
                price: {
                    $lte: price
                }
            }).count();
    }

    searchSouvenirs(substring) {
        // Данный метод должен возвращать все сувениры, в название которых входит
        // подстрока substring. Поиск должен быть регистронезависимым
        return this._Souvenir
            .find({
                name: new RegExp(substring, 'i')
            });
    }

    getDisscusedSouvenirs(date) {
        // Данный метод должен возвращать все сувениры,
        // первый отзыв на которые был оставлен не раньше даты date
        return this._Souvenir
            .find({
                'reviews.0.date': {
                    $gte: date
                }
            });
    }

    deleteOutOfStockSouvenirs() {
        // Данный метод должен удалять все сувениры, которых нет в наличии
        // (то есть amount = 0)

        // Метод должен возвращать объект формата { ok: 1, n: количество удаленных сувениров }
        // в случае успешного удаления
        return this._Souvenir.deleteMany({
            amount: 0
        }).exec();
    }

    async addReview(souvenirId, { login, rating, text }) {
        // Данный метод должен добавлять отзыв к сувениру souvenirId, отзыв добавляется
        // в конец массива (чтобы сохранить упорядоченность по дате),
        // содержит login, rating, text - из аргументов,
        // date - текущая дата и isApproved - false
        // Обратите внимание, что при добавлении отзыва рейтинг сувенира должен быть пересчитан
        const souvenir = await this._Souvenir.findOne({
            _id: souvenirId
        });
        const newRating = (souvenir
            .reviews
            .reduce((sum, next) => sum + next.rating, 0) + rating) /
            (souvenir.reviews.length + 1);

        return this._Souvenir
            .update({
                _id: souvenirId,
                rating: newRating,
                $push: {
                    reviews: {
                        login,
                        rating,
                        text
                    }
                }
            }).exec();
    }

    async getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в схеме
        const cart = await this._Cart.findOne({
            login
        });

        const itemsObj = cart.items.reduce((obj, next) => {
            obj[next.souvenirId] = next;

            return obj;
        }, {});

        const souvenirs = await this._Souvenir.find({
            _id: {
                $in: Object.keys(itemsObj)
            }
        });

        return souvenirs.reduce((sum, next) => sum + itemsObj[next._id].amount * next.price, 0);
    }
};
