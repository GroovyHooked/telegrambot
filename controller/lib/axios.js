const axios = require("axios");
const MY_TOKEN = '6808743908:AAFZyoPAYpJOrx-XLW1-Bu6o04IF3Qk-Ft8'

const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`

function getAxiosInstance() {
    return {
        get(method, params) {
            return axios.get(`/${method}`, {
                baseURL: BASE_URL,
                params,
            })
        },
        post(method, data) {
            return axios({
                method: "post",
                url: `/${method}`,
                baseURL: BASE_URL,
                data,
            })
        },
        async sendKeyboard(message, options, CHAT_ID) {
            const innerOptions = {
                method: "sendMessage",
                chat_id: CHAT_ID,
                text: message,
                reply_markup: JSON.stringify({
                    keyboard: options,
                    one_time_keyboard: true,
                }),
            }
            const response = await axios.post(`https://api.telegram.org/bot${MY_TOKEN}/sendMessage`, innerOptions);
            console.log(response.data);
        },
        async sendPicture(imageUrl, CHAT_ID) {
            const innerOptions = {
                method: "sendPhoto",
                chat_id: CHAT_ID,
                photo: imageUrl,
            }
            const response = await axios.post(`https://api.telegram.org/bot${MY_TOKEN}/sendPhoto`, innerOptions);
            console.log(response.data);
        },
    }
}

module.exports = { axiosInstance: getAxiosInstance() }




