require('dotenv').config();
const axios = require("axios");
const FormData = require('form-data');
const fs = require("fs");

const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_KEY}`

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
            try {
                const response = await axios.post(`${BASE_URL}/sendMessage`, innerOptions);
                console.log(response.data);
            } catch (error) {
                this.get("sendMessage", {
                    chat_id: CHAT_ID,
                    text: `Erreur lors de l'envoi du clavier. Statut: ${error.response.status}. Message: ${error.response.data}`,
                    parse_mode: "HTML",
        
                })
                console.error('Erreur lors de l\'envoi du clavier. Statut:', error.response.status, 'Message:', error.response.data);
            }
        },
        async sendPicture(imageUrl, CHAT_ID) {
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
                    this.get("sendMessage", {
                        chat_id: CHAT_ID,
                        text: `Erreur lors de l'envoi de la photo. Statut: ${error.response.status}. Message: ${error.response.data}`,
                        parse_mode: "HTML",
            
                    })
                    console.error('Erreur lors de l\'envoi de la photo. Statut:', error.response.status, 'Message:', error.response.data);
                }
            }
        }
    }
}

module.exports = { axiosInstance: getAxiosInstance() }




