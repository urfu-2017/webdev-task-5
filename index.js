const mongoose = require('mongoose');
const Queries = require('./queries');

(async function () {
    await mongoose.connect('mongodb://localhost/webdev-task-5');

    const queries = new Queries(mongoose, {
        souvenirsCollection: 'souvenirs',
        cartsCollection: 'carts'
    });

    try {
        // Здесь можно делать запросы, чтобы проверять, что они правильно работают
        const result = await queries.getAllSouvenirs();

        console.log(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
