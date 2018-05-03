'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [mongoose.Schema({ // eslint-disable-line new-cap
                id: mongoose.Schema.Types.ObjectId,
                login: {
                    type: String,
                    index: true,
                    unique: true
                },
                date: Date,
                text: String,
                rating: {
                    type: Number,
                    min: 0,
                    max: 5
                },
                isApproved: Boolean
            })],
            name: String,
            image: String,
            price: {
                type: Number,
                index: true
            },
            amount: Number,
            country: {
                type: String,
                index: true
            },
            rating: {
                type: Number,
                min: 0,
                max: 5
            },
            isRecent: Boolean
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [{
                souvenirId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Souvenir'
                },
                amount: Number
            }],
            login: {
                type: String,
                index: true,
                unique: true
            }
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
        return this._Souvenir
            .find({
                price: { $lte: price }
            });
    }

    getTopRatingSouvenirs(n) {
        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir
            .find({ tags: tag }, { _id: 0, name: 1, image: 1, price: 1 });
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir
            .count({
                country,
                rating: { $gte: rating },
                price: { $lte: price }
            });
    }

    searchSouvenirs(substring) {
        return this._Souvenir
            .find({
                name: { $regex: substring, $options: 'i' }
            });
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir
            .find({
                'reviews.0.date': { $gte: date }
            });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir
            .remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        const review = {
            login,
            text,
            rating,
            date: new Date(),
            isApproved: false
        };

        const souvenir = await this._Souvenir.findById(souvenirId);
        souvenir.reviews.push(review);

        souvenir.rating = souvenir.reviews
            .map(rev => rev.rating)
            .reduce((acc, cur) => acc + cur, 0) / souvenir.reviews.length;

        return await souvenir.save();
    }

    async getCartSum(login) {
        const cart = await this._Cart
            .findOne({ login })
            .populate('items.souvenirId');

        return cart.items.reduce(
            (acc, souvenir) => (acc + souvenir.souvenirId.price * souvenir.amount), 0
        );
    }
};
