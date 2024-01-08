require('dotenv').config();
const { axiosInstance } = require("../controller/lib/axios.js");
const variables = require("../controller/lib/variables.js");
const { insertCryptoData, getCryptoLast5Prices, dbRequestLastprices, getQuantities } = require("../database/database.js");
const { exchangeInstance } = require("./currency.js");

let alertThreshold = 0.5; // Percentage change to trigger an alert
let alertThresholdShitcoin = 2; // Percentage change to trigger an alert

fetchCryptoData().then(data => {
    populateCryptoDataAndHandleResult(data, axiosInstance.sendToGroovy)
})

setInterval(() => {
    fetchCryptoData().then(data => {
        populateCryptoDataAndHandleResult(data, axiosInstance.sendToGroovy)
    })
}, 60000);

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

function handleCryptoPrice(sendMessageCallback) {
    const cryptos = ['bitcoin', 'ethereum', 'cardano', 'vechain', 'The Graph', 'Internet Computer', 'solana', 'apecoin', 'NEAR Protocol'];
    cryptos.forEach(crypto => {
        getCryptoLast5Prices(crypto).then(data => {
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

function sendAlertMessage(crypto, percentChange, prices, sendMessageCallback) {
    const highestCryptoPrice = Math.max(...prices);
    const lowestCryptoPrice = Math.min(...prices);
    const trend = Math.sign(percentChange) === 1 ? 'Augmentaion' : 'Baisse';
    const tempMessage = [
        `<strong>${trend ? trend : 'N/A'} du prix du ${crypto}.</strong>`,
        `Au cours des 5 dernières minutes`,
        `Valeur la plus haute: ${highestCryptoPrice.toFixed(2)}$.`,
        `Valeur la plus basse: ${lowestCryptoPrice.toFixed(2)}$.`,
        `Diff: ${(highestCryptoPrice - lowestCryptoPrice).toFixed(2)}$.`,
        `Taux de variation: ${percentChange}%.`,
    ]
    const message = tempMessage.map(item => item).join('\n');
    sendMessageCallback(message)
}


async function retreiveCryptoPrices(sendMessageCallback) {
    try {
        const coins = ['bitcoin', 'ethereum', 'cardano', 'vechain', 'The Graph', 'Internet Computer', 'solana', 'apecoin', 'NEAR Protocol'];
        const data = await Promise.all(coins.map(coin => getCryptoLast5Prices(coin)));
        let message = ''
        let valueOwned = 0
        const allValuesOwned = []

        await Promise.all(data.map(async (pricesData, index) => {
            const prices = pricesData.map(item => item.price);
            const percentChange = computePercentageVariation(prices).toFixed(2);
            const coinQuantity = await getQuantities(coins[index]);
            valueOwned = Number(coinQuantity[0].quantity) * Number(prices[0]);
            allValuesOwned.push(valueOwned);
            message += `<strong>${coins[index]}</strong>: ${Number(prices[0]).toFixed(2)}$ (${percentChange}%, ${valueOwned.toFixed(2)}$)\n`;
        }));

        const totalValueOwned = allValuesOwned.reduce((a, b) => a + b, 0)
        const totalInEuro = await exchangeInstance.convertToEuro(totalValueOwned)
        message += `Total: ${totalValueOwned.toFixed(2)}$`
        message += ` (${totalInEuro}€)`
        sendMessageCallback(message);
    } catch (err) {
        console.log('retreiveCryptoPrices', { err });
        sendMessageCallback(`Erreur: ${err}`);
    }
}

function computePercentageVariation(arrayOfPrices) {
    if(!arrayOfPrices) return 'Le tableau passé en paramètre est vide.(function computePercentageVariation)'
    const firstElement = arrayOfPrices[0];
    const elementType = typeof firstElement;
    if (elementType === 'object') {
        const diff = arrayOfPrices[arrayOfPrices.length - 1].price - arrayOfPrices[0].price;
        const variation = diff / arrayOfPrices[0].price * 100;
        return variation;
    } else {
        const diff = arrayOfPrices[arrayOfPrices.length - 1] - arrayOfPrices[0];
        const variation = diff / arrayOfPrices[0] * 100;
        return variation;
    }
}

const getPercentChange5mn = async (coin) => {
    let prices
    await getCryptoLast5Prices(coin).then(data => {
        data.forEach(element => {
            element.timestamp = new Date(element.timestamp).toLocaleString().slice(12, 17);
        });
        prices = data.map(item => item.price);
    })
    if(!prices) return axiosInstance.sendToGroovy('Le tableau "prices" est vide. (function getPercentChange5mn)')
    const percentChange = computePercentageVariation(prices).toFixed(2)
    return {
        percentChange,
        minutes: prices.length,
        coin
    }
};

const getPercentChangePerMinutes = async (coin, minutes) => {
    let prices
    await dbRequestLastprices(coin, minutes).then(data => {
        data.forEach(element => {
            element.timestamp = new Date(element.timestamp).toLocaleString().slice(12, 17);
        });
        prices = data.map(item => item.price);
    })
    if(!prices) return axiosInstance.sendToGroovy('Le tableau "prices" est vide. (function getPercentChangePerMinutes)')
    const percentChange = computePercentageVariation(prices).toFixed(2)
    return {
        percentChange,
        time: minutes
    }
};

const getAlertThreshold = () => alertThreshold;
const getAlertThresholdShitcoin = () => alertThresholdShitcoin;
const setAlertThreshold = (newThreshold) => {
    alertThreshold = newThreshold;
}
const setAlertThresholdShitcoin = (newThreshold) => {
    alertThresholdShitcoin = newThreshold;
}


module.exports = {
    getPercentChange5mn,
    getPercentChangePerMinutes,
    getAlertThreshold,
    setAlertThreshold,
    retreiveCryptoPrices,
    getAlertThresholdShitcoin,
    setAlertThresholdShitcoin
}