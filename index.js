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
        const result = await queries.addReview('5abe65524d0c9d02c12eafb7', { login: 'bhh', rating: 3, text: 'jjjjj' });
        // const result = await queries.getCartSum('justice');
        // const result = await queries.searchSouvenirs('И');
        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
