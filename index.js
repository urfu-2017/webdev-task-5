'use strict';

const mongoose = require('mongoose');
const Queries = require('./queries');

(async () => {
    // await mongoose.connect('mongodb://localhost/webdev-task-5');
    await mongoose.connect('mongodb://localhost/task');

    const queries = new Queries(mongoose, {
        souvenirsCollection: 'souvenirs',
        cartsCollection: 'carts'
    });

    try {
        // Здесь можно делать запросы, чтобы проверять, что они правильно работают
        const result = await queries.addReview('', {
            login: 'test',
            rating: 5,
            text: 'test text'
        });

        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
