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
        // const result = await queries.getSouvenrisCount({
        //     country: 'Италия', rating: 2, price: 2000
        // });
        // const result = await queries.getDisscusedSouvenirs(new Date(2002, 1, 1));
        // const result = await queries.getCartSum('superman');
        // const result = await queries.getAllSouvenirs();
        // const result = await queries.searchSouvenirs('Река чайник мандарин кофе');
        // const result = await queries.getSouvenirsByTag('чай');
        const result = await queries.addReview('5abe65514d0c9d02c12eaf91', {
            login: 'kekmachine', text: 'ololosha', rating: 1
        });
        // const result = await queries.getCartSum('justice');
        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
