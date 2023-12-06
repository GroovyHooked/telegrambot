const axios = require('axios');
// const { exchangeInstance } = require("./currency.js");

let lastPrice = null;
let lastVolume = null;
let detectOverboughtOversoldMessage = null;
let current24hTrend = null;
const btcLast10Prices = []
const btcLastHourPrices = [];
let alertThreshold = 0.2; // Percentage change to trigger an alert
const API_KEY = '76bedc91-abd0-41da-9196-0e7a13b24eba';

async function fetchDataFromApi() {
    try {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': API_KEY,
            },
        });

        return response.data.data.find(item => item.name.toLowerCase() === 'bitcoin');
    } catch (error) {
        console.error(error);
        return null;
    }
}

function analyzeBitcoinData(data, sendMessageCallback) {
    const percentChange24h = data.quote.USD.percent_change_24h;
    const trend24h = percentChange24h > 0 ? 'haussière' : percentChange24h < 0 ? 'baissière' : 'stable';

    if (lastVolume !== null) {
        const volumeChange = data.quote.USD.volume_24h - lastVolume;
        if (volumeChange > 0) {
            const message = `Augmentation du volume de transactions. Possibilité de mouvements de prix significatifs.`
            sendMessageCallback(message)
        }
    }

    lastVolume = data.quote.USD.volume_24h;
    if (current24hTrend !== trend24h) {
        const message = `Tendance sur 24h: ${trend24h}.`
        sendMessageCallback(message)
        current24hTrend = trend24h;
    }

}

async function analyzeBitcoinPrice(data, sendMessageCallback) {
    const date = new Date();
    const localTime = date.toLocaleTimeString();
    const formattedLocalTime = localTime.slice(0, 5);
    if (btcLast10Prices.length < 10) {
        btcLast10Prices.push({
            price: data.quote.USD.price,
            time: formattedLocalTime
        });
    } else {
        btcLast10Prices.shift();
        btcLast10Prices.push({
            price: data.quote.USD.price,
            time: formattedLocalTime
        });
        let lastPrices = btcLast10Prices.slice(0, 10);
        //const lastPricesSum = lastPrices.reduce((acc, el) => acc + Number(el.price), 0);
        // const averagePrice = lastPricesSum / lastPrices.length;
        lastPrices = lastPrices.map(item => item.price);
        const highestPrice = Math.max(...lastPrices);
        const lowestPrice = Math.min(...lastPrices);

        if (lastPrice !== null) {

            const percentChange = computePercentageVariation(btcLast10Prices);

            if (Math.abs(percentChange) >= alertThreshold) {
                const trend = Math.sign(percentChange) === 1 ? 'Augmentaion' : 'Baisse';
                // const valueInEuro = await exchangeInstance.convertToEuro(data.quote.USD.price);

                const tempMessage = [
                    `<strong>${trend} du prix du Bitcoin.</strong>`,
                    `Tendance sur 24h: ${current24hTrend}.`,
                    `<strong>Prix du Bitcoin:</strong> ${Number(data.quote.USD.price).toFixed(2)}$.`,
                    // `<strong>EUR:</strong> ${Number(valueInEuro).toFixed(2)}€.`,
                    `Au cours des 10 dernières minutes`,
                    `Valeur la plus haute: ${highestPrice.toFixed(2)}$.`,
                    `Valeur la plus basse: ${lowestPrice.toFixed(2)}$.`,
                    `Diff: ${(highestPrice.toFixed(2) - lowestPrice.toFixed(2)).toFixed(2)}$.`,
                    `Taux de variation: ${percentChange.toFixed(2)}%.`,
                ]

                const message = tempMessage.map(item => item).join('\n');

                sendMessageCallback(message)
                detectOverboughtOversold(data, sendMessageCallback)
                analyzeBitcoinData(data, sendMessageCallback)
            }
        }
    }
    if (btcLastHourPrices.length < 60) {
        btcLastHourPrices.push({
            price: data.quote.USD.price,
            time: formattedLocalTime
        });
    } else {
        btcLastHourPrices.shift();
        btcLastHourPrices.push({
            price: data.quote.USD.price,
            time: formattedLocalTime
        });
    }
    lastPrice = data.quote.USD.price;
}

function detectOverboughtOversold(data, sendMessageCallback) {
    const rsi = data.quote.USD.percent_change_24h;

    if (rsi > 70) {
        const increaseMessage = `Niveau de surachat détecté. Considère une possible correction à la baisse.`;
        if (detectOverboughtOversoldMessage !== increaseMessage) {
            sendMessageCallback(increaseMessage);
            detectOverboughtOversoldMessage = increaseMessage;
        }
    } else if (rsi < 30) {
        const decreaseMessage = `Niveau de survente détecté. Considère une possible correction à la hausse.`;
        if (detectOverboughtOversoldMessage !== decreaseMessage) {
            sendMessageCallback(decreaseMessage);
            detectOverboughtOversoldMessage = decreaseMessage;
        }
    }
}

function detectChartPatterns(data, sendMessageCallback) {
    const isHeadAndShoulders = data.quote.USD.btcLastHourPrices > 2 && data.quote.USD.percent_change_24h < -2;

    if (isHeadAndShoulders) {
        const message = `Possible motif de tête et épaules détecté. Considère une analyse approfondie. Prix du Bitcoin: ${Number(data.quote.USD.price).toFixed(2)}$`;
        sendMessageCallback(message);
    }

}

function detectPriceGaps(data, sendMessageCallback) {
    const previousClose = data.quote.USD.open_24h;
    const currentPrice = data.quote.USD.price;
    const priceGap = Math.abs(currentPrice - previousClose);

    if (priceGap > 50) {
        const message = `Possible gap de prix détecté. Étudie la raison de cette variation. Prix du Bitcoin: ${Number(data.quote.USD.price).toFixed(2)}$`;
        sendMessageCallback(message);
    }
}

async function retreiveBitcoinPrice(sendMessageCallback) {
    // const valueInEuro = await exchangeInstance.convertToEuro(btcLast10Prices[btcLast10Prices.length - 1].price);
    const priceString = btcLast10Prices.map(obj => `${obj.time}: ${obj.price.toFixed(2)}$`).join('\n');
    sendMessageCallback(`Évolution des ${btcLast10Prices.length} dernière minutes:\n${priceString}`)
    const message = `Prix du Bitcoin: ${btcLast10Prices[btcLast10Prices.length - 1].price.toFixed(2)}$.`;
    sendMessageCallback(message);
}

async function main(sendMessageCallback) {
    const bitcoinData = await fetchDataFromApi();
    if (bitcoinData) {
        await analyzeBitcoinPrice(bitcoinData, sendMessageCallback);
        detectChartPatterns(bitcoinData, sendMessageCallback);
        detectPriceGaps(bitcoinData, sendMessageCallback);
    }
}

async function init(sendMessageCallback) {
    const bitcoinData = await fetchDataFromApi();
    if (bitcoinData) {
        analyzeBitcoinData(bitcoinData, sendMessageCallback);
    }
}

const getAlertThreshold = () => alertThreshold;
const setAlertThreshold = (newThreshold) => {
    alertThreshold = newThreshold;
}

function computePercentageVariation(arrayOfPrices) {
    const diff = arrayOfPrices[arrayOfPrices.length - 1].price - arrayOfPrices[0].price;
    const variation = diff / arrayOfPrices[0].price * 100;
    return variation;
}

const getPercentChange10mn = () => {
    return {
        percentChange: computePercentageVariation(btcLast10Prices).toFixed(2),
        minutes: btcLast10Prices.length
    }
};

const getPercentChange1h = () => {
    return {
        percentChange1h: computePercentageVariation(btcLastHourPrices).toFixed(2),
        time: btcLastHourPrices.length
    }
};

module.exports = {
    main,
    init,
    retreiveBitcoinPrice,
    getAlertThreshold,
    setAlertThreshold,
    getPercentChange10mn,
    getPercentChange1h,
    btcLastHourPrices,
    btcLast10Prices,
};