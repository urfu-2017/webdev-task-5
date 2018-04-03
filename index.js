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
        const result = await queries.addReview('5abe65514d0c9d02c12eafb0',
            { login: 'dosha', rating: 5, text: 'Невероятно' });

        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
