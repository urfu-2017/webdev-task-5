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

        // работает правильно
        // const allSouvenirs = await queries.getAllSouvenirs();
        // console.info('allSouvenirs', allSouvenirs);

        // если 1000 все прав, если 0 то []. Если ничего не передать, то выходит ошибка
        // const cheapSouvenirs = await queries.getCheapSouvenirs(1000);
        // console.info('cheapSouvenirs', cheapSouvenirs);

        // сортировка правильная
        // от 1 до n нормально, при 0 выводит все. Если ничего не передано, то выводит все
        // const topRatingSouvenirs = await queries.getTopRatingSouvenirs();
        // console.info('topRatingSouvenirs', topRatingSouvenirs);

        // отбор происходит верно
        // если передана пустая строка или ничего, то возвращается []
        // если неполное название тега то []
        // const souvenirsByTag = await queries.getSouvenirsByTag('рак');
        // console.info('souvenirsByTag', souvenirsByTag);

        // для { country: 'Италия', rating: 3, price: 3000 } = 11 - верно
        // если ничего не передано, то ошибка
        // для { country: 'Италия', rating: 0, price: 3000 } = 13 - верно
        // если не передан хоть один параметр то ошибка
        // const souvenrisCount = await queries.getSouvenrisCount({
        //    country: 'Италия', rating: 3, price: 3000 });
        // console.info('souvenrisCount', souvenrisCount);

        // Для 'Мода' - верно
        // Для 'мода' - верно
        // Для 'мод' - верно
        // Для '' - выводит все
        // Без параметра, ошибка
        // const searchSouvenirs = await queries.searchSouvenirs();
        // console.info('searchSouvenirs', searchSouvenirs);

        // для '2018-01-09' - верно
        // для '2018-01-09 10:13:04.343' - верно
        // в каком формате должна быть дата ???
        // const disscusedSouvenirs = await queries.getDisscusedSouvenirs('2018-01-09');
        // console.info('disscusedSouvenirs', disscusedSouvenirs);

        // удалилось
        // const deleteOutOfStockSouvenirs = await queries.deleteOutOfStockSouvenirs();
        // console.info('deleteOutOfStockSouvenirs', deleteOutOfStockSouvenirs);

        const addReview = await queries.addReview('5abe65514d0c9d02c12eaf55', {
            login: 'traveler', rating: 5, text: 'Просто класс!'
        });
        console.info('addReview', addReview);

        // работает
        const сartSum = await queries.getCartSum('steve');
        console.info('сartSum', сartSum);

    } catch (error) {
        console.error(error);
    }

    await mongoose.disconnect();
})();
