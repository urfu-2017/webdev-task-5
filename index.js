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
        // const result = await queries.getCheapSouvenirs(1000);
        // const result = await queries.getTopRatingSouvenirs(5);
        // const result = await queries.getSouvenirsByTag('редкий');
        // const result = await queries.searchSouvenirs('пирамида');
        /* const result = await queries.getSouvenrisCount({ country: 'Чехия',
            rating: 4, price: 500 });*/
        // const result = await queries.getDisscusedSouvenirs(new Date(2018, 1, 10));
        // const result = await queries.deleteOutOfStockSouvenirs();
        /* await queries.addReview('5abe65514d0c9d02c12eaf90', { login: 'test',
            rating: 3, text: "тест" });*/
        const result = await queries.getCartSum('punisher');

        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
