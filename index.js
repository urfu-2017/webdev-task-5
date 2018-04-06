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
        /*
        const result = await queries.addReview('5abe65514d0c9d02c12eaf58', {
            login: 'test',
            rating: 5,
            text: 'test text'
        });
        */
        const result = await queries.getSouvenrisCount({
            country: 'Египет',
            rating: 3,
            price: 2000
        });

        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
