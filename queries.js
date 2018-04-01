'use strict';

module.exports = class Queries {
    constructor(mongoose, { souvenirsCollection, cartsCollection }) {
        const souvenirSchema = mongoose.Schema({ // eslint-disable-line new-cap
            tags: [String],
            reviews: [
                {
                    id: String,
                    login: String,
                    date: Date,
                    text: String,
                    rating: Number,
                    isApproved: Boolean
                }
            ],
            name: String,
            image: String,
            price: { type: Number, index: true },
            amount: Number,
            country: { type: String, index: true },
            rating: { type: Number, index: true },
            isRecent: Boolean,
            __v: Number
        });

        const cartSchema = mongoose.Schema({ // eslint-disable-line new-cap
            items: [
                {
                    souvenirId: mongoose.Schema.Types.ObjectId,
                    amount: Number
                }
            ],
            login: { type: String, unique: true },
            __v: Number
        });

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
        return this._Souvenir
            .find()
            .sort({ rating: -1 })
            .limit(n);
    }

    getSouvenirsByTag(tag) {
        return this._Souvenir.find({ tags: { $elemMatch: { $eq: tag } } },
            { name: 1, image: 1, price: 1, _id: 0 });
    }

    getSouvenrisCount({ country, rating, price }) {
        return this._Souvenir.count(
            {
                country,
                rating: { $gte: rating },
                price: { $lte: price }
            }
        );
    }

    searchSouvenirs(substring) {
        return this._Souvenir.find({ name: { $regex: `.*${substring}.*`, $options: 'i' } });
    }

    getDisscusedSouvenirs(date) {
        return this._Souvenir.find({ 'reviews.0.date': { $gte: date } });
    }

    deleteOutOfStockSouvenirs() {
        return this._Souvenir.remove({ amount: 0 });
    }

    async addReview(souvenirId, { login, rating, text }) {
        return this._Souvenir
            .findById(souvenirId)
            .then(souvenir => {
                souvenir.reviews.push(
                    {
                        login,
                        rating,
                        text,
                        date: new Date(),
                        isApproved: false
                    }
                );
                let overallRating = 0;
                /* eslint-disable-next-line no-return-assign*/
                souvenir.reviews.forEach(review => overallRating += review.rating);
                souvenir.rating = overallRating / souvenir.reviews.length;

                return souvenir.save();
            });
    }

    async getCartSum(login) {
        return this._Cart
            .findOne({ login })
            .then(cart => {
                const promises = cart.items.reduce((accumulator, cartItem) => {
                    const promise = this._Souvenir.findById(cartItem.souvenirId)
                        .then(souvenir => souvenir.price * cartItem.amount);
                    accumulator.push(promise);

                    return accumulator;
                }, []);

                return Promise.all(promises).then(prices => {
                    return prices.reduce((accumulator, souvenirPrice) => {
                        return accumulator + souvenirPrice;
                    }, 0);
                });
            });
    }
};
