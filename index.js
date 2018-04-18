'use strict';

const mongoose = require('mongoose');
const Queries = require('./queries');

(async () => {
    await mongoose.connect('mongodb://localhost/webdev-task-5');

    const queries = new Queries(mongoose, {
        souvenirsCollection: 'souvenirs',
        cartsCollection: 'carts'
    });

    try {
        // Здесь можно делать запросы, чтобы проверять, что они правильно работают
        let result = await queries.getAllSouvenirs();
        result = await queries.getTopRatingSouvenirs(3);
        result = await queries.getSouvenirsByTag('хит продаж');
        result = await queries.searchSouvenirs('пИРАмИДа');
        result = await queries.getDisscusedSouvenirs(new Date(2017, 11, 22));
        result = await queries.getCartSum('superman');
        result = await queries.getSouvenrisCount({
            country: 'Япония',
            rating: 4.5,
            price: 100000
        });

        result = await queries.addReview(
            new mongoose.Types.ObjectId('5abe65524d0c9d02c12eafb8'),
            {
                login: 'just me',
                rating: 5,
                text: 'it\'s incredible!'
            }
        );

        result = await queries.deleteOutOfStockSouvenirs();

        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
