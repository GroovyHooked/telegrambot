require('dotenv').config();
const { axiosInstance } = require("../controller/lib/axios.js");
const { insertCryptoData,
    dbRequestLastprices,
    getQuantities,
    getAlertThresholdShitcoinDb,
    setAlertThresholdShitcoinDb,
    getAlertThresholdDb,
    setAlertThresholdDb, } = require("../database/database.js");
const { exchangeInstance } = require("./currency.js");
const { portfolio } = require("../controller/lib/variables.js");

let alertThreshold; // Percentage change to trigger an alert  ALERT_THRESHOLD
let alertThresholdShitcoin; // Percentage change to trigger an alert ALERT_THRESHOLD_SHITCOIN
const NB_OF_API_REQUESTS_PER_SECOND = 4;

fetchCryptoData().then(data => {
    populateCryptoDataAndHandleResult(data, axiosInstance.sendToGroovy)
})

setInterval(() => {
    fetchCryptoData().then(data => {
        populateCryptoDataAndHandleResult(data, axiosInstance.sendToGroovy)
    })
}, 15000);

async function fetchCryptoData() {
    try {
        const data = await axiosInstance.fetchDataFromModulaApiMultiCoins()
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
    if (!cryptoObjet) return sendMessageCallback('Aucune donnée disponible dans l\'objet cryptoObjet')
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
    await getAlertThresholdDb().then(data => {
        if (typeof data.data === 'object') {
            alertThreshold = Number(data.value)
        } else {
            alertThreshold = Number(data[0].value)
        }
    })
    await getAlertThresholdShitcoinDb().then(data => {
        if (typeof data.data === 'object') {
            alertThresholdShitcoin = Number(data.value)
        } else {
            alertThresholdShitcoin = Number(data[0].value)
        }
    })
    portfolio.forEach(crypto => {
        dbRequestLastprices(crypto, NB_OF_API_REQUESTS_PER_SECOND * 5).then(data => {
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
    })
}

const trendEmoji = (percentChange) => Math.sign(percentChange) === 0 ? '🇨🇭' : Math.sign(percentChange) === 1 ? '📈' : '📉';


function sendAlertMessage(crypto, percentChange, prices, sendMessageCallback) {
    const highestCryptoPrice = Math.max(...prices);
    const lowestCryptoPrice = Math.min(...prices);
    const trend = Math.sign(percentChange) === 0 ? 'Neutre' : Math.sign(percentChange) === 1 ? 'Augmentaion' : 'Baisse';
    const tempMessage = [
        `${trendEmoji(percentChange)} <strong>${trend ? trend : 'N/A'} du prix du ${crypto}.</strong>`,
        `Au cours des 5 dernières minutes`,
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
        const data = await Promise.all(portfolio.map(coin => dbRequestLastprices(coin, NB_OF_API_REQUESTS_PER_SECOND * 5)));
        let message = ''
        let valueOwned = 0
        const allValuesOwned = []

        await Promise.all(data.map(async (pricesData, index) => {
            const prices = pricesData.map(item => item.price);
            const percentChange = computePercentageVariation(prices).toFixed(2);
            const coinQuantity = await getQuantities(portfolio[index]);
            valueOwned = Number(coinQuantity[0].quantity) * Number(prices[0]);
            allValuesOwned.push(valueOwned);
            message += `${trendEmoji(percentChange)} <strong>${portfolio[index]}</strong>: ${Number(prices[0]).toFixed(2)}$ (${percentChange}%, ${valueOwned.toFixed(2)}$)\n`;
        }));

        const totalValueOwned = allValuesOwned.reduce((a, b) => a + b, 0)
        let totalInEuro = await exchangeInstance.convertToEuro(totalValueOwned)
        totalInEuro = Number(totalInEuro).toFixed(2)
        message += `Total: ${totalValueOwned.toFixed(2)}$`
        message += ` (${totalInEuro}€)`
        sendMessageCallback(message);
    } catch (err) {
        console.log('retreiveCryptoPrices', { err });
        sendMessageCallback(`Erreur: ${err}`);
    }
}

const getPercentChange5mn = async (coin) => {
    let prices
    await dbRequestLastprices(coin, NB_OF_API_REQUESTS_PER_SECOND * 5).then(data => {
        data.forEach(element => {
            element.timestamp = new Date(element.timestamp).toLocaleString().slice(12, 17);
        });
        prices = data.map(item => item.price);
    })
    if (!prices) return axiosInstance.sendToGroovy('Le tableau "prices" est vide. (function getPercentChange5mn)')
    const percentChange = computePercentageVariation(prices).toFixed(2)
    return {
        percentChange,
        minutes: prices.length,
        coin
    }
};

const getPercentChangePerMinutes = async (coin, minutes) => {
    let prices
    await dbRequestLastprices(coin, minutes * 4).then(data => {
        data.forEach(element => {
            element.timestamp = new Date(element.timestamp).toLocaleString().slice(12, 17);
        });
        prices = data.map(item => item.price);
    })
    if (!prices) return axiosInstance.sendToGroovy('Le tableau "prices" est vide. (function getPercentChangePerMinutes)')
    const percentChange = computePercentageVariation(prices).toFixed(2)
    return {
        percentChange,
        time: minutes
    }
};

const getAlertThreshold = async () => {
    await getAlertThresholdDb().then(data => {
        if (typeof data.data === 'object') {
            alertThreshold = Number(data.value)
        } else {
            alertThreshold = Number(data[0].value)
        }
    })
    return alertThreshold
};

const getAlertThresholdShitcoin = async () => {
    await getAlertThresholdShitcoinDb().then(data => {
        if (typeof data.data === 'object') {
            alertThresholdShitcoin = Number(data.value)
        } else {
            alertThresholdShitcoin = Number(data[0].value)
        }
    })
    return alertThresholdShitcoin
};

const setAlertThreshold = async (newThreshold) => {
    await setAlertThresholdDb(newThreshold)
}

const setAlertThresholdShitcoin = async (newThreshold) => {
    await setAlertThresholdShitcoinDb(newThreshold)
}


module.exports = {
    getPercentChange5mn,
    getPercentChangePerMinutes,
    getAlertThreshold,
    setAlertThreshold,
    retreiveCryptoPrices,
    getAlertThresholdShitcoin,
    setAlertThresholdShitcoin,
    trendEmoji,
}