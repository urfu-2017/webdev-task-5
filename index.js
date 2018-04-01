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
        // const result = await queries.getCheapSouvenirs(2900);
        // const result = await queries.getTopRatingSouvenirs(10);
        // const result = await queries.getSouvenirsByTag('техника');
        // const result = await queries.getSouvenrisCount(
        //     { country: 'Испания',
        //         rating: 1,
        //         price: 3000 }
        // );
        // const result = await queries.searchSouvenirs('рука');
        // const result = await queries.getDisscusedSouvenirs(Date());
        // const result = await queries.deleteOutOfStockSouvenirs();
        // const result = await queries.addReview('5abe65524d0c9d02c12eafb8',
        // { login: 'spt30', rating: '4.2q', text: 'Спасибо, все отлично (нет4)' });
        // const result = await queries.getCartSum('punisher');

        // console.log(result[0]);

    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
