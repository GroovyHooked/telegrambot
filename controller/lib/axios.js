require('dotenv').config();
const axios = require("axios");

const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_KEY}`
const MODULA_API_URL = `https://api.mobula.io/api/1/market/multi-data?assets=bitcoin,ethereum,cardano,vechain,solana,apecoin,The Graph,Internet Computer,NEAR Protocol`

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
        } catch (error) {
            const errorMessage = `Erreur lors de l'envoi du clavier. Statut: ${error.response.status}. Message: ${error.response.data}`;
            sendToGroovy(errorMessage)
            console.error('Erreur lors de l\'envoi du clavier. Statut:', error.response.status, 'Message:', error.response.data);
        }
    }

    const fetchDataFromModulaApi = async () => {
        // https://docs.mobula.io/api-reference/docs/market-asset-query
        // https://docs.mobula.io/api-reference/endpoint/market-multi-data
        // https://docs.mobula.io/api-reference/endpoint/all
        try {
            const { data } = await axios.get( MODULA_API_URL,
            {
                headers: {
                    'X-API-KEY': process.env.MOBULA_API_KEY,
                },
                method: 'GET',
            })
            return data
        } catch (error) {
            sendToGroovy(`Error in axios.js/fetchDataFromModulaApi: ${error}`)
        }
    }

    return {
        sendKeyboard,
        sendToGroovy,
        fetchDataFromModulaApi,
    }
}

module.exports = { axiosInstance: getAxiosInstance() }


