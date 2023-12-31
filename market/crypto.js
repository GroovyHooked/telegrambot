require('dotenv').config();
const { axiosInstance } = require("../controller/lib/axios.js");
// const { exchangeInstance } = require("./currency.js");

let lastPrice = null;
let lastVolume = null;
let detectOverboughtOversoldMessage = null;
let current24hTrend = null;
const btcLast10Prices = []
const btcLastHourPrices = [];
const ethereumLast10Prices = [];
const ethereumLastHourPrices = [];
const adaLast10Prices = [];
const adaLastHourPrices = [];
const apeLast10Prices = [];
const apeLastHourPrices = [];
const solLast10Prices = [];
const solLastHourPrices = [];
const bonkLast10Prices = [];
const bonkLastHourPrices = [];
const graphLast10Prices = [];
const graphLastHourPrices = [];
const ipcLast10Prices = [];
const ipcLastHourPrices = [];
const vetLast10Prices = [];
const vetLastHourPrices = [];

let alertThreshold = 0.2; // Percentage change to trigger an alert
const lowPriceAlert = 42500;
const highPriceAlert = 45300;


function analyzeBitcoinData(data, sendMessageCallback) {
    if (!data.quote) return
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
    if(!data.quote) return
    const btcPrice = data.quote.USD.price;
    const { usdEthPrice, usdSolPrice, usdVetPrice, usdAdaPrice, usdIpcPrice, usdApePrice, usdBonkPrice, usdGraphPrice } = data.quote.USD.prices;
    // if(btcPrice <= lowPriceAlert || btcPrice >= highPriceAlert){
    //     const message = `Alert! Prix du Bitcoin: ${Number(btcPrice).toFixed(2)}$.`;
    //     sendMessageCallback(message)
    // }
    const date = new Date();
    const localTime = date.toLocaleTimeString();
    const formattedLocalTime = localTime.slice(0, 5);
    if (btcLast10Prices.length < 10) {
        btcLast10Prices.push({
            price: btcPrice,
            time: formattedLocalTime
        });
        ethereumLast10Prices.push({
            price: usdEthPrice,
            time: formattedLocalTime
        });
        adaLast10Prices.push({
            price: usdAdaPrice,
            time: formattedLocalTime
        });
        apeLast10Prices.push({
            price: usdApePrice,
            time: formattedLocalTime
        });
        solLast10Prices.push({
            price: usdSolPrice,
            time: formattedLocalTime
        });
        bonkLast10Prices.push({
            price: usdBonkPrice,
            time: formattedLocalTime
        });
        graphLast10Prices.push({
            price: usdGraphPrice,
            time: formattedLocalTime
        });
        ipcLast10Prices.push({
            price: usdIpcPrice,
            time: formattedLocalTime
        });
        vetLast10Prices.push({
            price: usdVetPrice,
            time: formattedLocalTime
        });

    } else {
        btcLast10Prices.shift();
        btcLast10Prices.push({
            price: btcPrice,
            time: formattedLocalTime
        });
        let lastBtcPrices = btcLast10Prices.slice(0, 10);

        ethereumLast10Prices.shift();
        ethereumLast10Prices.push({
            price: usdEthPrice,
            time: formattedLocalTime
        });
        let lastEthPrices = ethereumLast10Prices.slice(0, 10);

        adaLast10Prices.shift();
        adaLast10Prices.push({
            price: usdAdaPrice,
            time: formattedLocalTime
        });
        let lastAdaPrices = adaLast10Prices.slice(0, 10);

        apeLast10Prices.shift();
        apeLast10Prices.push({
            price: usdApePrice,
            time: formattedLocalTime
        });
        let lastApePrices = apeLast10Prices.slice(0, 10);

        solLast10Prices.shift();
        solLast10Prices.push({
            price: usdSolPrice,
            time: formattedLocalTime
        });
        let lastSolPrices = solLast10Prices.slice(0, 10);

        bonkLast10Prices.shift();
        bonkLast10Prices.push({
            price: usdBonkPrice,
            time: formattedLocalTime
        });
        let lastBonkPrices = bonkLast10Prices.slice(0, 10);

        graphLast10Prices.shift();
        graphLast10Prices.push({
            price: usdGraphPrice,
            time: formattedLocalTime
        });
        let lastGraphPrices = graphLast10Prices.slice(0, 10);

        ipcLast10Prices.shift();
        ipcLast10Prices.push({
            price: usdIpcPrice,
            time: formattedLocalTime
        });
        let lastIpcPrices = ipcLast10Prices.slice(0, 10);

        vetLast10Prices.shift();
        vetLast10Prices.push({
            price: usdVetPrice,
            time: formattedLocalTime
        });
        let lastVetPrices = vetLast10Prices.slice(0, 10);



        lastBtcPrices = lastBtcPrices.map(item => item.price);
        const highestBtcPrice = Math.max(...lastBtcPrices);
        const lowestBtcPrice = Math.min(...lastBtcPrices);

        lastEthPrices = lastEthPrices.map(item => item.price);
        const highestEthPrice = Math.max(...lastEthPrices);
        const lowestEthPrice = Math.min(...lastEthPrices);

        lastAdaPrices = lastAdaPrices.map(item => item.price);
        const highestAdaPrice = Math.max(...lastAdaPrices);
        const lowestAdaPrice = Math.min(...lastAdaPrices);

        lastApePrices = lastApePrices.map(item => item.price);
        const highestApePrice = Math.max(...lastApePrices);
        const lowestApePrice = Math.min(...lastApePrices);

        lastSolPrices = lastSolPrices.map(item => item.price);
        const highestSolPrice = Math.max(...lastSolPrices);
        const lowestSolPrice = Math.min(...lastSolPrices);

        lastBonkPrices = lastBonkPrices.map(item => item.price);
        const highestBonkPrice = Math.max(...lastBonkPrices);
        const lowestBonkPrice = Math.min(...lastBonkPrices);

        lastGraphPrices = lastGraphPrices.map(item => item.price);
        const highestGraphPrice = Math.max(...lastGraphPrices);
        const lowestGraphPrice = Math.min(...lastGraphPrices);

        lastIpcPrices = lastIpcPrices.map(item => item.price);
        const highestIpcPrice = Math.max(...lastIpcPrices);
        const lowestIpcPrice = Math.min(...lastIpcPrices);

        lastVetPrices = lastVetPrices.map(item => item.price);
        const highestVetPrice = Math.max(...lastVetPrices);
        const lowestVetPrice = Math.min(...lastVetPrices);

        const data = [
            {
                lastBtcPrices, highestBtcPrice, lowestBtcPrice
            },
            {
                lastEthPrices, highestEthPrice, lowestEthPrice
            },
            {
                lastAdaPrices, highestAdaPrice, lowestAdaPrice
            },
            {
                lastApePrices, highestApePrice, lowestApePrice
            },
            {
                lastSolPrices, highestSolPrice, lowestSolPrice
            },
            {
                lastBonkPrices, highestBonkPrice, lowestBonkPrice
            },
            {
                lastGraphPrices, highestGraphPrice, lowestGraphPrice
            },
            {
                lastIpcPrices, highestIpcPrice, lowestIpcPrice
            },
            {
                lastVetPrices, highestVetPrice, lowestVetPrice
            },
        ]



        if (lastPrice !== null) {
            data.forEach(item => {
                analyzeCryptoData(item.lastBtcPrices, item.highestBtcPrice, item.lowestBtcPrice)
            })
        }
    }
    if (btcLastHourPrices.length < 30) {
        btcLastHourPrices.push({
            price: btcPrice,
            time: formattedLocalTime
        });
        ethereumLastHourPrices.push({
            price: usdEthPrice,
            time: formattedLocalTime
        });
        adaLastHourPrices.push({
            price: usdAdaPrice,
            time: formattedLocalTime
        });
        apeLastHourPrices.push({
            price: usdApePrice,
            time: formattedLocalTime
        });
        solLastHourPrices.push({
            price: usdSolPrice,
            time: formattedLocalTime
        });
        bonkLastHourPrices.push({
            price: usdBonkPrice,
            time: formattedLocalTime
        });
        graphLastHourPrices.push({
            price: usdGraphPrice,
            time: formattedLocalTime
        });
        ipcLastHourPrices.push({
            price: usdIpcPrice,
            time: formattedLocalTime
        });
        vetLastHourPrices.push({
            price: usdVetPrice,
            time: formattedLocalTime
        });

    } else {
        btcLastHourPrices.shift();
        btcLastHourPrices.push({
            price: btcPrice,
            time: formattedLocalTime
        });
        ethereumLastHourPrices.shift();
        ethereumLastHourPrices.push({
            price: usdEthPrice,
            time: formattedLocalTime
        });
        adaLastHourPrices.shift();
        adaLastHourPrices.push({
            price: usdAdaPrice,
            time: formattedLocalTime
        });
        apeLastHourPrices.shift();
        apeLastHourPrices.push({
            price: usdApePrice,
            time: formattedLocalTime
        });
        solLastHourPrices.shift();
        solLastHourPrices.push({
            price: usdSolPrice,
            time: formattedLocalTime
        });
        bonkLastHourPrices.shift();
        bonkLastHourPrices.push({
            price: usdBonkPrice,
            time: formattedLocalTime
        });
        graphLastHourPrices.shift();
        graphLastHourPrices.push({
            price: usdGraphPrice,
            time: formattedLocalTime
        });
        ipcLastHourPrices.shift();
        ipcLastHourPrices.push({
            price: usdIpcPrice,
            time: formattedLocalTime
        });
        vetLastHourPrices.shift();
        vetLastHourPrices.push({
            price: usdVetPrice,
            time: formattedLocalTime
        });
    }

    lastPrice = btcPrice;
}

function analyzeCryptoData(cryptoLast10Prices, highestCryptoPrice, lowestCryptoPrice) {

    const cryptoPercentChange = computePercentageVariation(cryptoLast10Prices);

    if (Math.abs(cryptoPercentChange) >= alertThreshold) {
        const trend = Math.sign(cryptoPercentChange) === 1 ? 'Augmentaion' : 'Baisse';
        const tempMessage = [
            `<strong>${trend ? trend : 'N/A'} du prix du ${cryptoLast10Prices[0].crypto}.</strong>`,
            `Au cours des 20 dernières minutes`,
            `Valeur la plus haute: ${highestCryptoPrice.toFixed(2)}$.`,
            `Valeur la plus basse: ${lowestCryptoPrice.toFixed(2)}$.`,
            `Diff: ${(highestCryptoPrice - lowestCryptoPrice).toFixed(2)}$.`,
            `Taux de variation: ${cryptoPercentChange.toFixed(2)}%.`,
        ]

        const message = tempMessage.map(item => item).join('\n');

        sendMessageCallback(message)
        detectOverboughtOversold(data, sendMessageCallback)
        analyzeBitcoinData(data, sendMessageCallback)
    }

}


function detectOverboughtOversold(data, sendMessageCallback) {
    if (!data.quote.USD.percent_change_24h) return
    const rsi = data.quote.USD.percent_change_24h;

    if (rsi > 70) {
        const increaseMessage = `Niveau de surachat détecté. Considère une possible correction à la baisse.`;
        if (detectOverboughtOversoldMessage !== increaseMessage) {
            sendMessageCallback(message)
            detectOverboughtOversoldMessage = increaseMessage;
        }
    } else if (rsi < 30) {
        const decreaseMessage = `Niveau de survente détecté. Considère une possible correction à la hausse.`;
        if (detectOverboughtOversoldMessage !== decreaseMessage) {
            sendMessageCallback(message)
            detectOverboughtOversoldMessage = decreaseMessage;
        }
    }
}

function detectChartPatterns(data, sendMessageCallback) {
    if(!data.quote) return
    if (!data.quote.USD.percent_change_24h || !data.quote.USD.btcLastHourPrices) return
    const isHeadAndShoulders = data.quote.USD.btcLastHourPrices > 2 && data.quote.USD.percent_change_24h < -2;

    if (isHeadAndShoulders) {
        const message = `Possible motif de tête et épaules détecté. Considère une analyse approfondie. Prix du Bitcoin: ${Number(data.quote.USD.price).toFixed(2)}$`;
        sendMessageCallback(message)
    }

}

function detectPriceGaps(data, sendMessageCallback) {
    if(!data.quote) return
    if (!data.quote.USD.open_24h) return
    const previousClose = data.quote.USD.open_24h;
    const currentPrice = data.quote.USD.price;
    const priceGap = Math.abs(currentPrice - previousClose);

    if (priceGap > 50) {
        const message = `Possible gap de prix détecté. Étudie la raison de cette variation. Prix du Bitcoin: ${Number(data.quote.USD.price).toFixed(2)}$`;
        sendMessageCallback(message)
    }
}

async function retreiveBitcoinPrice(sendMessageCallback) {
    // const valueInEuro = await exchangeInstance.convertToEuro(btcLast10Prices[btcLast10Prices.length - 1].price);
    const priceString = btcLast10Prices.map(obj => `${obj.time}: ${obj.price.toFixed(2)}$`).join('\n');
    sendMessageCallback(`Évolution des ${btcLast10Prices.length * 2} dernière minutes:\n${priceString}`)
    const message = `Prix du Bitcoin: ${btcLast10Prices[btcLast10Prices.length - 1].price.toFixed(2)}$.`;
    sendMessageCallback(message)
}

async function mainCoinbaseApi(sendMessageCallback) {
    const bitcoinData = await axiosInstance.fetchCoinbaseData();
    if (bitcoinData) {
        await analyzeBitcoinPrice(bitcoinData, sendMessageCallback);
        detectChartPatterns(bitcoinData, sendMessageCallback);
        detectPriceGaps(bitcoinData, sendMessageCallback);
    }
}

async function initCoinbaseApi(sendMessageCallback) {
    const bitcoinData = await axiosInstance.fetchCoinbaseData();
    if (bitcoinData) {
        analyzeBitcoinData(bitcoinData, sendMessageCallback);
    }
}

async function mainCoinmarketcapApi(sendMessageCallback) {
    const bitcoinData = await axiosInstance.fetchDataFromCoinmarketcapApi();
    if (bitcoinData) {
        await analyzeBitcoinPrice(bitcoinData, sendMessageCallback);
        detectChartPatterns(bitcoinData, sendMessageCallback);
        detectPriceGaps(bitcoinData, sendMessageCallback);
    }
}

async function initCoinmarketcapApi(sendMessageCallback) {
    const bitcoinData = await axiosInstance.fetchDataFromCoinmarketcapApi();
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
    mainCoinmarketcapApi,
    initCoinmarketcapApi,
    retreiveBitcoinPrice,
    getAlertThreshold,
    setAlertThreshold,
    getPercentChange10mn,
    getPercentChange1h,
    btcLastHourPrices,
    btcLast10Prices,
    mainCoinbaseApi,
    initCoinbaseApi,
};