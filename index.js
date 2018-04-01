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
        const result = await queries.addReview(
            '5abe65514d0c9d02c12eaf56',
            {
                login: 'a',
                text: 'b',
                rating: 3
            });
            // '5abe65514d0c9d02c12eaf55',
            // {
            //     login: 'check',
            //     rating: 4,
            //     text: 'gooo'
            // });

        console.info(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
