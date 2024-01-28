require('dotenv').config();
const cron = require('node-cron');

const { axiosInstance } = require("../controller/lib/axios.js");
const { 
    insertCryptoData,
    dbRequestLastprices,
    dbRequestExchangeRate,
    dbRequestQuantities,
    dbRequestAlertThresholdShitcoinDb,
    dbSetAlertThresholdShitcoinDb,
    dbRequestAlertThresholdDb,
    dbSetAlertThresholdDb,
    dbUpdateExchangeRate 
} = require("../database/database.js");
const { exchangeInstance } = require("./currency.js");
const { portfolio } = require("../controller/lib/variables.js");

let alertThreshold; 
let alertThresholdShitcoin; 
const NB_OF_API_REQUESTS_PER_MINUTE = 4;

cron.schedule('0 * * * *', async () => {
    const rate = await exchangeInstance.getExchangeRateValue();
    await dbUpdateExchangeRate(rate);
});

cron.schedule('*/15 * * * * *', async () => {
    const data = await fetchCryptoData()
    populateCryptoDataAndHandleResult(data, axiosInstance.sendToGroovy)
});


async function fetchCryptoData() {
    try {
        const data = await axiosInstance.fetchDataFromModulaApi()
        if (!data) {
            axiosInstance.sendToGroovy('Aucune donnée disponible pour le moment.')
        } else {
            return data
        }
    } catch (err) {
        axiosInstance.sendToGroovy(`Erreur: ${err}`)
        throw err;
    }
}

function populateCryptoDataAndHandleResult(cryptoObjet, sendMessageCallback) {
    if (!cryptoObjet) return sendMessageCallback('crypto.js/populateCryptoDataAndHandleResult: Aucune donnée récupérée depuis l\'API.')
    insertCryptoData(cryptoObjet.data['bitcoin'], 'bitcoin')
    insertCryptoData(cryptoObjet.data['ethereum'], 'ethereum')
    insertCryptoData(cryptoObjet.data['cardano'], 'cardano')
    insertCryptoData(cryptoObjet.data['vechain'], 'vechain')
    insertCryptoData(cryptoObjet.data['The Graph'], 'The Graph')
    insertCryptoData(cryptoObjet.data['Internet Computer'], 'Internet Computer')
    insertCryptoData(cryptoObjet.data['solana'], 'solana')
    insertCryptoData(cryptoObjet.data['apecoin'], 'apecoin')
    insertCryptoData(cryptoObjet.data['NEAR Protocol'], 'NEAR Protocol')

    handleCryptoPrice(sendMessageCallback)
}

async function handleCryptoPrice(sendMessageCallback) {
    const [data1,] = await dbRequestAlertThresholdDb()
    alertThreshold = Number(data1.value)

    const [data2,] = await dbRequestAlertThresholdShitcoinDb()
    alertThresholdShitcoin = Number(data2.value)

    portfolio.forEach(async crypto => {
        const data = await dbRequestLastprices(crypto, NB_OF_API_REQUESTS_PER_MINUTE * 10)
        data.forEach(element => {
            element.timestamp = new Date(element.timestamp).toLocaleString().slice(12, 17);
        });
        const prices = data.map(item => item.price);
        const percentChange = computePercentageVariation(prices).toFixed(2);
        if (crypto === 'bitcoin' && Math.abs(percentChange) >= alertThreshold || crypto === 'ethereum' && Math.abs(percentChange) >= alertThreshold) {
            sendAlertMessage(crypto, percentChange, prices, sendMessageCallback)
        } else if (Math.abs(percentChange) >= alertThresholdShitcoin) {
            sendAlertMessage(crypto, percentChange, prices, sendMessageCallback)
        }
    })
}

const trendEmoji = (percentChange) => Math.sign(percentChange) === 0 ? '🇨🇭' : Math.sign(percentChange) === 1 ? '📈' : '📉';


function sendAlertMessage(crypto, percentChange, prices, sendMessageCallback) {
    const highestCryptoPrice = Math.max(...prices);
    const lowestCryptoPrice = Math.min(...prices);
    const trend = Math.sign(percentChange) === 0 ? 'Neutre' : Math.sign(percentChange) === 1 ? 'Augmentaion' : 'Baisse';
    const tempMessage = [
        `${trendEmoji(percentChange)} <strong>${trend ? trend : 'N/A'} du prix du ${crypto}.</strong>`,
        `Au cours des 10 dernières minutes`,
        `Valeur la plus haute: ${highestCryptoPrice.toFixed(2)}$.`,
        `Valeur la plus basse: ${lowestCryptoPrice.toFixed(2)}$.`,
        `Diff: ${(highestCryptoPrice - lowestCryptoPrice).toFixed(2)}$.`,
        `Taux de variation: ${percentChange}%.`,
    ]
    const message = tempMessage.map(item => item).join('\n');
    sendMessageCallback(message)
}

function computePercentageVariation(arrayOfPrices) {
    if (!arrayOfPrices) return 'Le tableau passé en undefined ou null est vide.(function computePercentageVariation)'
    const diff = arrayOfPrices[0] - arrayOfPrices[arrayOfPrices.length - 1];
    const variation = diff / arrayOfPrices[arrayOfPrices.length - 1] * 100;
    return variation;
}

async function retreiveCryptoPrices(sendMessageCallback) {
    try {
        let [exchangeRate,] = await dbRequestExchangeRate();
        exchangeRate = Number(exchangeRate.value);
        const data = await Promise.all(portfolio.map(coin => dbRequestLastprices(coin, NB_OF_API_REQUESTS_PER_MINUTE * 10)));
        let message = ''
        let valueOwned = 0
        const allValuesOwned = []

        await Promise.all(data.map(async (pricesData, index) => {
            const prices = pricesData.map(item => item.price);
            const percentChange = computePercentageVariation(prices).toFixed(2);
            const [coinQuantity,] = await dbRequestQuantities(portfolio[index]);
            valueOwned = Number(coinQuantity.quantity) * Number(prices[0]);
            allValuesOwned.push(valueOwned);
            message += `${trendEmoji(percentChange)} <strong>${coinQuantity.short_name}</strong>: ${(Number(prices[0]) * exchangeRate).toFixed(2)}€ (${percentChange}%, ${(valueOwned * exchangeRate).toFixed(2)}€)\n`;
        }));
        const totalValueOwned = allValuesOwned.reduce((a, b) => a + b, 0)

        let totalInEuro = Number(totalValueOwned) * exchangeRate;
        totalInEuro = totalInEuro.toFixed(2)

        message += `Total: ${totalInEuro}€`
        sendMessageCallback(message);
    } catch (err) {
        console.error('retreiveCryptoPrices', { err });
        sendMessageCallback(`Erreur: ${err}`);
    }
}

const getPercentChangePerMinutes = async (coin, minutes) => {
    let prices = []
    const data = await dbRequestLastprices(coin, NB_OF_API_REQUESTS_PER_MINUTE * minutes)
    for (const [, value] of Object.entries(data)) {
        value.timestamp = new Date(value.timestamp).toLocaleString().slice(12, 17);
        prices.push(value.price)
    }
    if (!prices) return axiosInstance.sendToGroovy('Le tableau "prices" est vide. (function getPercentChangePerMinutes)')
    const percentChange = computePercentageVariation(prices).toFixed(2)
    return {
        percentChange,
        time: minutes
    }
};

const getAlertThreshold = async () => {
    const [{ value },] = await dbRequestAlertThresholdDb()
    alertThreshold = Number(value)
    return alertThreshold
};

const getAlertThresholdShitcoin = async () => {
    const [{ value },] = await dbRequestAlertThresholdShitcoinDb()
    alertThresholdShitcoin = Number(value)
    return alertThresholdShitcoin
};

const setAlertThreshold = async (newThreshold) => {
    await dbSetAlertThresholdDb(newThreshold)
}

const setAlertThresholdShitcoin = async (newThreshold) => {
    await dbSetAlertThresholdShitcoinDb(newThreshold)
}

module.exports = {
    getPercentChangePerMinutes,
    getAlertThreshold,
    setAlertThreshold,
    retreiveCryptoPrices,
    getAlertThresholdShitcoin,
    setAlertThresholdShitcoin,
    trendEmoji,
}