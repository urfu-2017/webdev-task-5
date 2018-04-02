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
        console.info(JSON.stringify(await queries.getTopRatingSouvenirs(3), null, 2));
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
