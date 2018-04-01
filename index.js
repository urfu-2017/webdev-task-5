/* eslint-disable */
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
        // const result = await queries.getAllSouvenirs();
        // const result = await queries.getSouvenirsByTag('магнит');
        const result = await queries.getSouvenrisCount({ country: 'Италия', rating: 1, price: 2000 });
        // const result = await queries.searchSouvenirs('рука');
        // const result = await queries.getDisscusedSouvenirs(new Date('2018-03-15T17:17:39.020Z'));
        // const result = await queries.deleteOutOfStockSouvenirs();
        // const comment = { login: 'ftlka', rating: 10, text: 'hey thats pretty nice' };
        // await queries.addReview('5abe65514d0c9d02c12eafb3', comment);
        // const result = await queries.getCartSum('funnyguy');

        console.log(result);
    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
