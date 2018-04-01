'use strict';

const mongoose = require('mongoose');
const Queries = require('./queries');

/* eslint-disable no-unused-vars */

(async () => {
    await mongoose.connect('mongodb://localhost/webdev-task-5');

    const queries = new Queries(mongoose, {
        souvenirsCollection: 'souvenirs',
        cartsCollection: 'carts'
    });

    try {
        // Здесь можно делать запросы, чтобы проверять, что они правильно работают
        // const result = await queries.getAllSouvenirs();
        // result = await queries.getCheapSouvenirs(2900);
        // result = await queries.getTopRatingSouvenirs(10);
        // result = await queries.getSouvenirsByTag('техника');
        // result = await queries.getSouvenrisCount(
        //     { country: 'Испания',
        //         rating: 1,
        //         price: 3000 }
        // );
        // result = await queries.searchSouvenirs('рука');
        // result = await queries.getDisscusedSouvenirs(Date());
        // result = await queries.deleteOutOfStockSouvenirs();
        // result = await queries.addReview('5abe65524d0c9d02c12eafb8',
        // { login: 'spt30', rating: '4.2q', text: 'Спасибо, все отлично (нет4)' });
        // result = await queries.getCartSum('punisher');

        // console.log(result);

    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
