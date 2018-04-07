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
        // const result = await queries.getAllSouvenirs();
        let result = null;

        // result = await queries.getCheapSouvenirs(1000);
        // result = await queries.getTopRatingSouvenirs(3);
        // result = await queries.getSouvenirsByTag("редкий");
        // result = await queries.getSouvenrisCount({ country: "США", rating: 3, price: 500 });
        // result = await queries.searchSouvenirs("ИгРа");
        // result = await queries.getDisscusedSouvenirs(new Date('2018-03-22T06:37:14.742Z'));
        // result = await queries.deleteOutOfStockSouvenirs();
        // result = await queries.addReview('5abe65514d0c9d02c12eaf55',
        // { login: 'whoe', rating: 5, text: 'nice' });
        result = await queries.getCartSum('steve');

        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
