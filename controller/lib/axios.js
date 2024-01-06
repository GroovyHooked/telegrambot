require('dotenv').config();
const axios = require("axios");
const FormData = require('form-data');
const fs = require("fs");

const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_KEY}`

const BITCOIN_URL = "https://api.coingecko.com/api/v3/coins/bitcoin"

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
        const { bitcoinData } = await axios.get(BITCOIN_URL)
        bitcoinData['tickers'].forEach((ticker) => {
            if (ticker.base == "BTC" && ticker.target === "USD") {
                usdBtcPrices.push(ticker.last);
            }
        })
        const usdBtcPrice = usdBtcPrices.reduce((acc, curr) => acc + curr, 0) / usdBtcPrices.length;

        return {
            quote: {
                USD: {
                    price: usdBtcPrice,
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

    const fetchDataFromMobulaApi = async (coin) => {

        try {
            const { data } = await axios.get(`https://api.mobula.io/api/1/market/data?asset=${coin}`,
            {
                headers: {
                    'X-API-KEY': process.env.MOBULA_API_KEY,
                },
                method: 'GET',
            })
            return data
        } catch (error) {
            sendToGroovy(error)
        }
    }

    const fetchDataFromModulaApiMultiCoins = async () => {
        try {
            const { data } = await axios.get(`https://api.mobula.io/api/1/market/multi-data?assets=bitcoin,ethereum,cardano,vechain,solana,apecoin,The Graph,Internet Computer,NEAR Protocol`,
            // cardano,vechain,solana,bonk-token,apecoin,ipcoin,the-graph 
            {
                headers: {
                    'X-API-KEY': process.env.MOBULA_API_KEY,
                },
                method: 'GET',
            })
            // console.log(data);
            // sendToGroovy(`fetchDataFromModulaApiMultiCoins data: ${JSON.stringify(data)}`)
            return data
        } catch (error) {
            sendToGroovy(`fetchDataFromModulaApiMultiCoins data: ${error}`)
        }
    }

    return {
        respondToUser,
        sendKeyboard,
        sendPicture,
        fetchDataFromCoinmarketcapApi,
        sendToGroovy,
        fetchDataFromMobulaApi,
        fetchDataFromModulaApiMultiCoins,
    }
}

module.exports = { axiosInstance: getAxiosInstance() }

// const APECOIN_URL = "https://api.coingecko.com/api/v3/coins/apecoin"
// const BONK_URL = "https://api.coingecko.com/api/v3/coins/bonk-token"
// const ETHEREUM_URL = "https://api.coingecko.com/api/v3/coins/ethereum"
// const SOLANA_URL = "https://api.coingecko.com/api/v3/coins/solana"
// const VECHAIN_URL = "https://api.coingecko.com/api/v3/coins/vechain"
// const IPCOIN_URL = "https://api.coingecko.com/api/v3/coins/ipcoin"
// const ADA_URL = "https://api.coingecko.com/api/v3/coins/cardano"
// const THEGRAPH_URL = "https://api.coingecko.com/api/v3/coins/the-graph"

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



