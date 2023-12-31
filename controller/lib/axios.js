require('dotenv').config();
const axios = require("axios");
const FormData = require('form-data');
const fs = require("fs");

const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_KEY}`

const BITCOIN_URL = "https://api.coingecko.com/api/v3/coins/bitcoin"
const APECOIN_URL = "https://api.coingecko.com/api/v3/coins/apecoin"
const BONK_URL = "https://api.coingecko.com/api/v3/coins/bonk-token"
const ETHEREUM_URL = "https://api.coingecko.com/api/v3/coins/ethereum"
const SOLANA_URL = "https://api.coingecko.com/api/v3/coins/solana"
const VECHAIN_URL = "https://api.coingecko.com/api/v3/coins/vechain"
const IPCOIN_URL = "https://api.coingecko.com/api/v3/coins/ipcoin"
const ADA_URL = "https://api.coingecko.com/api/v3/coins/cardano"
const THEGRAPH_URL = "https://api.coingecko.com/api/v3/coins/the-graph"
const COINMARKETCAP_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest'

function getAxiosInstance() {

    const get = (method, params) => {
        return axios.get(`/${method}`, {
            baseURL: BASE_URL,
            params,
        })
    }

    const sendToGroovy =  (messageText) => {
        return get("sendMessage", {
            chat_id: process.env.CHAT_ID,
            text: messageText,
            parse_mode: "HTML",
        });
    };

    const respondToUser = (messageObj, messageText) => {
        return get("sendMessage", {
            chat_id: messageObj.chat.id,
            text: messageText,
            parse_mode: "HTML",
        });
    }

    const post = (method, data) => {
        return axios({
            method: "post",
            url: `/${method}`,
            baseURL: BASE_URL,
            data,
        })
    }

    const sendKeyboard = async (message, options, CHAT_ID, getMethod) => {
        const innerOptions = {
            method: "sendMessage",
            chat_id: CHAT_ID,
            text: message,
            reply_markup: JSON.stringify({
                keyboard: options,
                one_time_keyboard: true,
            }),
        }
        try {
            const response = await axios.post(`${BASE_URL}/sendMessage`, innerOptions);
            console.log(response.data);
        } catch (error) {
            const errorMessage = `Erreur lors de l'envoi du clavier. Statut: ${error.response.status}. Message: ${error.response.data}`;
            sendToGroovy(errorMessage)
            console.error('Erreur lors de l\'envoi du clavier. Statut:', error.response.status, 'Message:', error.response.data);
        }
    }

    const sendPicture = async (imageUrl, CHAT_ID) => {
        console.log(imageUrl, CHAT_ID);
        if (fs.existsSync(imageUrl)) {
            const formData = new FormData();
            formData.append('chat_id', CHAT_ID);
            formData.append('photo', fs.createReadStream(imageUrl));

            try {
                const response = await axios.post(`${BASE_URL}/sendPhoto`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    //timeout: 10000, // Augmente le délai d'attente à 10 secondes (en millisecondes)
                });
                console.log(response.data);
            } catch (error) {
                const errorMessage = `Erreur lors de l'envoi de la photo. Statut: ${error.response.status}. Message: ${error.response.data}`;
                sendToGroovy(errorMessage);
                console.error('Erreur lors de l\'envoi de la photo. Statut:', error.response.status, 'Message:', error.response.data);
            }
        }
    }

    const fetchCoinbaseData = async () => {
        const usdBtcPrices = []
        const usdEthPrices = []
        const usdSolPrices = []
        const usdVetPrices = []
        const usdAdaPrices = []
        const usdIpcPrices = []
        const usdApePrices = []
        const usdBonkPrices = []
        const usdGraphPrices = []
        //const { bitcoinData } = await axios.get(BITCOIN_URL)
        // const { ethData } = await axios.get(ETHEREUM_URL)
        // const { solData } = await axios.get(SOLANA_URL)
        // const { vetData } = await axios.get(VECHAIN_URL)
        // const { adaData } = await axios.get(ADA_URL)
        // const { ipcData } = await axios.get(IPCOIN_URL)
        // const { apeData } = await axios.get(APECOIN_URL)
        // const { bonkData } = await axios.get(BONK_URL)
        // const { graphData } = await axios.get(THEGRAPH_URL)
        // console.log(bitcoinData);
        // bitcoinData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "BTC" && ticker.target === "USD") {
        //         usdBtcPrices.push(ticker.last);
        //     }
        // })
        // const usdBtcPrice = usdBtcPrices.reduce((acc, curr) => acc + curr, 0) / usdBtcPrices.length;

        // ethData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "ETH" && ticker.target === "USD") {
        //         usdEthPrices.push(ticker.last);
        //     }
        // }
        // )
        // const usdEthPrice = usdEthPrices.reduce((acc, curr) => acc + curr, 0) / usdEthPrices.length;

        // solData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "SOL" && ticker.target === "USD") {
        //         usdSolPrices.push(ticker.last);
        //     }
        // }
        // )
        // const usdSolPrice = usdSolPrices.reduce((acc, curr) => acc + curr, 0) / usdSolPrices.length;

        // vetData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "VET" && ticker.target === "USD") {
        //         usdVetPrices.push(ticker.last);
        //     }
        // }
        // )

        // const usdVetPrice = usdVetPrices.reduce((acc, curr) => acc + curr, 0) / usdVetPrices.length;

        // adaData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "ADA" && ticker.target === "USD") {
        //         usdAdaPrices.push(ticker.last);
        //     }
        // }
        // )

        // const usdAdaPrice = usdAdaPrices.reduce((acc, curr) => acc + curr, 0) / usdAdaPrices.length;

        // ipcData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "IPC" && ticker.target === "USD") {
        //         usdIpcPrices.push(ticker.last);
        //     }
        // }
        // )

        // const usdIpcPrice = usdIpcPrices.reduce((acc, curr) => acc + curr, 0) / usdIpcPrices.length;

        // apeData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "APE" && ticker.target === "USD") {
        //         usdApePrices.push(ticker.last);
        //     }
        // }
        // )

        // const usdApePrice = usdApePrices.reduce((acc, curr) => acc + curr, 0) / usdApePrices.length;

        // bonkData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "BONK" && ticker.target === "USD") {
        //         usdBonkPrices.push(ticker.last);
        //     }
        // }
        // )

        // const usdBonkPrice = usdBonkPrices.reduce((acc, curr) => acc + curr, 0) / usdBonkPrices.length;

        // graphData['tickers'].forEach((ticker) => {
        //     if (ticker.base == "GRT" && ticker.target === "USD") {
        //         usdGraphPrices.push(ticker.last);
        //     }
        // }
        // )

        // const usdGraphPrice = usdGraphPrices.reduce((acc, curr) => acc + curr, 0) / usdGraphPrices.length;


        return [] || {
            quote: {
                USD: {
                    price: usdBtcPrice,
                    prices: {usdEthPrice, usdSolPrice, usdVetPrice, usdAdaPrice, usdIpcPrice, usdApePrice, usdBonkPrice, usdGraphPrice}
                }
            }
        }
    }

    const fetchDataFromCoinmarketcapApi = async () => {
        try {
            const response = await axios.get(COINMARKETCAP_URL, {
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
                },
            });
    
            return response.data.data.find(item => item.name.toLowerCase() === 'bitcoin');
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    return {
        respondToUser,
        sendKeyboard,
        sendPicture,
        fetchCoinbaseData,
        fetchDataFromCoinmarketcapApi,
        sendToGroovy,
    }
}

module.exports = { axiosInstance: getAxiosInstance() }


//     return {
//         get(method, params) {
//             return axios.get(`/${method}`, {
//                 baseURL: BASE_URL,
//                 params,
//             })
//         },
//         respondToUser(messageText, CHAT_ID) {
//             return this.get("sendMessage", {
//                 chat_id: CHAT_ID,
//                 text: messageText,
//                 parse_mode: "HTML",
//             });
//         },
//         post(method, data) {
//             return axios({
//                 method: "post",
//                 url: `/${method}`,
//                 baseURL: BASE_URL,
//                 data,
//             })
//         },
//         async sendKeyboard(message, options, CHAT_ID, getMethod) {
//             const innerOptions = {
//                 method: "sendMessage",
//                 chat_id: CHAT_ID,
//                 text: message,
//                 reply_markup: JSON.stringify({
//                     keyboard: options,
//                     one_time_keyboard: true,
//                 }),
//             }
//             try {
//                 const response = await axios.post(`${BASE_URL}/sendMessage`, innerOptions);
//                 console.log(response.data);
//             } catch (error) {
//                 const errorMessage = `Erreur lors de l'envoi du clavier. Statut: ${error.response.status}. Message: ${error.response.data}`;
//                 sendToGroovy(errorMessage)
//                 console.error('Erreur lors de l\'envoi du clavier. Statut:', error.response.status, 'Message:', error.response.data);
//             }
//         },
//         async sendPicture(imageUrl, CHAT_ID) {
//             console.log(imageUrl, CHAT_ID);
//             if (fs.existsSync(imageUrl)) {
//                 const formData = new FormData();
//                 formData.append('chat_id', CHAT_ID);
//                 formData.append('photo', fs.createReadStream(imageUrl));

//                 try {
//                     const response = await axios.post(`${BASE_URL}/sendPhoto`, formData, {
//                         headers: {
//                             ...formData.getHeaders(),
//                         },
//                         //timeout: 10000, // Augmente le délai d'attente à 10 secondes (en millisecondes)
//                     });
//                     console.log(response.data);
//                 } catch (error) {
//                     const errorMessage = `Erreur lors de l'envoi de la photo. Statut: ${error.response.status}. Message: ${error.response.data}`;
//                     sendToGroovy(errorMessage);
//                     console.error('Erreur lors de l\'envoi de la photo. Statut:', error.response.status, 'Message:', error.response.data);
//                 }
//             }
//         },
//         async fetchCoinbaseData() {
//             const usdBtcPrices = []
//             const { data } = await axios.get(BITCOIN_URL)
//             data['tickers'].forEach((ticker) => {
//                 if (ticker.base == "BTC" && ticker.target === "USD") {
//                     usdBtcPrices.push(ticker.last);
//                 }
//             })
//             const usdBtcPrice = usdBtcPrices.reduce((acc, curr) => acc + curr, 0) / usdBtcPrices.length;
//             return {
//                 quote: {
//                     USD: {
//                         price: usdBtcPrice
//                     }
//                 }
//             }
//         },
//         async fetchDataFromCoinmarketcapApi() {
//             try {
//                 const response = await axios.get(COINMARKETCAP_URL, {
//                     headers: {
//                         'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
//                     },
//                 });
        
//                 return response.data.data.find(item => item.name.toLowerCase() === 'bitcoin');
//             } catch (error) {
//                 console.error(error);
//                 return null;
//             }
//         },
//         sendToGroovy,
//     }
// }



