require('dotenv').config();
const { axiosInstance } = require("../controller/lib/axios.js");
const variables = require("../controller/lib/variables.js");
const { insertCryptoData } = require("../database/database.js");

let alertThreshold = 0.2; // Percentage change to trigger an alert
const cryptoArray = []

fetchCryptoData().then(data => {
    console.log({ data: data.data["NEAR Protocol"] });
    populateCryptoDataAndHandleResult(cryptoArray, data, axiosInstance.sendToGroovy)
})

setInterval(() => {
    fetchCryptoData().then(data => {
        populateCryptoDataAndHandleResult(cryptoArray, data, axiosInstance.sendToGroovy)
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

function populateCryptoDataAndHandleResult(cryptoArray, cryptoObjet, sendMessageCallback) {
    if (!cryptoObjet) return sendMessageCallback('Aucune donnée disponible dans l\'objet cryptoObjet')
    if (cryptoObjet.length > 60 * 10) cryptoArray.shift()
    console.log('DEBUG',cryptoObjet.data['bitcoin']);
    insertCryptoData(cryptoObjet.data['bitcoin'], 'bitcoin')
    insertCryptoData(cryptoObjet.data['ethereum'], 'ethereum')
    insertCryptoData(cryptoObjet.data['cardano'], 'cardano')
    insertCryptoData(cryptoObjet.data['vechain'], 'vechain')
    insertCryptoData(cryptoObjet.data['The Graph'], 'The Graph')
    insertCryptoData(cryptoObjet.data['Internet Computer'], 'Internet Computer')
    insertCryptoData(cryptoObjet.data['solana'], 'solana')
    insertCryptoData(cryptoObjet.data['apecoin'], 'apecoin')
    insertCryptoData(cryptoObjet.data['NEAR Protocol'], 'NEAR Protocol')

    cryptoArray.push({
        bitcoin: cryptoObjet.data['bitcoin'],
        ethereum: cryptoObjet.data['ethereum'],
        cardano: cryptoObjet.data['cardano'],
        vechain: cryptoObjet.data['vechain'],
        graph: cryptoObjet.data['The Graph'],
        icp: cryptoObjet.data['Internet Computer'],
        solana: cryptoObjet.data['solana'],
        ape: cryptoObjet.data['apecoin'],
        near: cryptoObjet.data['NEAR Protocol'],
    })
    //console.log({cryptoObjet: cryptoObjet.data.bitcoin});
    console.log({ cryptoArray });

    handleCryptoPrice(cryptoArray, sendMessageCallback)
}

function handleCryptoPrice(cryptoArray, sendMessageCallback) {
    cryptoArray.forEach((element, index) => {
        if (index === cryptoArray.length - 1) {
            if (element.bitcoin) variables.pricesAndVariation.btc.prices.push(element.bitcoin.price)
            if (element.ethereum) variables.pricesAndVariation.eth.prices.push(element.ethereum.price)
            if (element.cardano) variables.pricesAndVariation.ada.prices.push(element.cardano.price)
            if (element.vechain) variables.pricesAndVariation.vet.prices.push(element.vechain.price)
            if (element.graph) variables.pricesAndVariation.graph.prices.push(element.graph.price)
            if (element.icp) variables.pricesAndVariation.icp.prices.push(element.icp.price)
            if (element.solana) variables.pricesAndVariation.sol.prices.push(element.solana.price)
            if (element.ape) variables.pricesAndVariation.ape.prices.push(element.ape.price)
            if (element.near) variables.pricesAndVariation.near.prices.push(element.near.price)
        }
    })

    variables.pricesAndVariation.btc.variation = computePercentageVariation(variables.pricesAndVariation.btc.prices).toFixed(2)
    variables.pricesAndVariation.eth.variation = computePercentageVariation(variables.pricesAndVariation.eth.prices).toFixed(2)
    variables.pricesAndVariation.ada.variation = computePercentageVariation(variables.pricesAndVariation.ada.prices).toFixed(2)
    variables.pricesAndVariation.vet.variation = computePercentageVariation(variables.pricesAndVariation.vet.prices).toFixed(2)
    variables.pricesAndVariation.graph.variation = computePercentageVariation(variables.pricesAndVariation.graph.prices).toFixed(2)
    variables.pricesAndVariation.icp.variation = computePercentageVariation(variables.pricesAndVariation.icp.prices).toFixed(2)
    variables.pricesAndVariation.sol.variation = computePercentageVariation(variables.pricesAndVariation.sol.prices).toFixed(2)
    variables.pricesAndVariation.ape.variation = computePercentageVariation(variables.pricesAndVariation.ape.prices).toFixed(2)
    variables.pricesAndVariation.near.variation = computePercentageVariation(variables.pricesAndVariation.near.prices).toFixed(2)

    for (const [key, value] of Object.entries(variables.pricesAndVariation)) {
        // console.log({prices: value.prices});
        // const valuesToCompute = value.prices.slice(value.prices.length - 5, value.prices.length);
        // console.log({ valuesToCompute });
        if(value.prices.length >= 5){
            if (Math.abs(value.variation) >= alertThreshold) {
                const valuesToCompute = value.prices.slice(value.prices.length - 5, value.prices.length);
                console.log({ valuesToCompute });
                const highestCryptoPrice = Math.max(...valuesToCompute);
                const lowestCryptoPrice = Math.min(...valuesToCompute);
                console.log({ highestCryptoPrice, lowestCryptoPrice });
                const trend = Math.sign(value.variation) === 1 ? 'Augmentaion' : 'Baisse';
                const tempMessage = [
                    `<strong>${trend ? trend : 'N/A'} du prix du ${key}.</strong>`,
                    `Au cours des 5 dernières minutes`,
                    `Valeur la plus haute: ${highestCryptoPrice.toFixed(2)}$.`,
                    `Valeur la plus basse: ${lowestCryptoPrice.toFixed(2)}$.`,
                    `Diff: ${(highestCryptoPrice - lowestCryptoPrice).toFixed(2)}$.`,
                    `Taux de variation: ${value.variation}%.`,
                ]
                const message = tempMessage.map(item => item).join('\n');
                sendMessageCallback(message)
            }
        } 
    }
}

function retreiveCryptoPrices(sendMessageCallback) {
    console.log({ cryptoObject: variables.pricesAndVariation });
    let message = '';
    const ownedValues = []
    if (variables.pricesAndVariation.btc.prices.length === 0) return sendMessageCallback('Aucune donnée disponible pour le moment.')
    for (const [key, value] of Object.entries(variables.pricesAndVariation)) {
        message += `${key}: ${value.prices[value.prices.length - 1].toFixed(2)}$ (${value.variation}%)\n`
        const valueOwned = value.prices[value.prices.length - 1] * value.quantity;
        ownedValues.push(valueOwned)
        message += `Valeur possédée: ${valueOwned.toFixed(2)}$\n`
    }
    message += `Valeur totale: ${ownedValues.reduce((acc, curr) => acc + curr).toFixed(2)}$`
    sendMessageCallback(message)
}

function computePercentageVariation(arrayOfPrices) {
    const firstElement = arrayOfPrices[0];
    const elementType = typeof firstElement;
    if (elementType === 'object') {
        console.log({ arrayOfPrices });
        const diff = arrayOfPrices[arrayOfPrices.length - 1].price - arrayOfPrices[0].price;
        const variation = diff / arrayOfPrices[0].price * 100;
        return variation;
    } else {
        const diff = arrayOfPrices[arrayOfPrices.length - 1] - arrayOfPrices[0];
        const variation = diff / arrayOfPrices[0] * 100;
        return variation;
    }
}

const getPercentChange5mn = (coin) => {
    return {
        percentChange: computePercentageVariation(variables.pricesAndVariation[coin].prices.slice(variables.pricesAndVariation[coin].prices.length - 5, variables.pricesAndVariation[coin].prices.length)).toFixed(2),
        minutes: 5
    }
};

const getPercentChangePerMinutes = (coin, minutes) => {
    // retreive the last 60 values from btcLastHoursPrices 
    const lastPrices = variables.pricesAndVariation[coin].prices.slice(variables.pricesAndVariation[coin].prices.length - minutes, variables.pricesAndVariation[coin].prices.length);
    return {
        percentChange1h: computePercentageVariation(lastPrices).toFixed(2),
        time: lastPrices.length
    }
};

const getAlertThreshold = () => alertThreshold;
const setAlertThreshold = (newThreshold) => {
    alertThreshold = newThreshold;
}

module.exports = {
    getPercentChange5mn,
    getPercentChangePerMinutes,
    getAlertThreshold,
    setAlertThreshold,
    retreiveCryptoPrices
}