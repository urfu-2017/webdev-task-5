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
        // const result = await queries.getCheapSouvenirs(100);
        // const result = await queries.getTopRatingSouvenirs(10);
        // const result = await queries.searchSouvenirs('РАКУШКА');
        // const result = await queries.getDisscusedSouvenirs(new Date(0));
        // const result = await queries.deleteOutOfStockSouvenirs();
        const result = await queries.getCartSum('punisher');
        // const result = await queries.addReview('5abe65514d0c9d02c12eaf55', {
        //     login: 'batman',
        //     text: 'asdfsdfasdfasdfasdfasdf',
        //     rating: 5
        // });

        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
