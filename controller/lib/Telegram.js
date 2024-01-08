require('dotenv').config();

const { axiosInstance } = require("./axios");
const { sendMessagetoGpt } = require("../../chatGPT/communication.js");
const crypto = require("../../market/crypto.js");
const variables = require("./variables.js");
const { exchangeInstance } = require("../../market/currency.js");

let MODEL = "gpt-3.5-turbo";
let NB_OF_MESSAGES_TO_KEEP = 5;

async function handleMessage(messageObj) {

    if (!isAuthorizedUser(messageObj)) {
        axiosInstance.respondToUser(messageObj, `Vous n\'êtes pas autorisé à utiliser ce bot. Vous pouvez contacter un admin en lui remettant votre identifiant Telegram: ${messageObj.chat.id}.`);
        return;
    }

    const content = messageObj?.text;

    if (content) {
        const isCommand = await handleCommands(content, messageObj);
        const isSpecialCommand = await handleSpecialCommands(content, messageObj);

        if (!isCommand && !isSpecialCommand) {
            if (MODEL === "gpt-3.5-turbo") {
                if (variables.messages.length >= NB_OF_MESSAGES_TO_KEEP + 15) {
                    variables.messages.splice(15, 1);
                    variables.messages.push({ role: "user", content })
                } else {
                    variables.messages.push({ role: "user", content })
                }
                try {
                    const response = await sendMessagetoGpt(variables.messages, MODEL);
                    variables.messages.push({ role: "assistant", content: response })
                    return axiosInstance.respondToUser(messageObj, response);
                } catch (error) {
                    console.error(error);
                    return "An error occurred";
                }
            } else if (MODEL === "gpt-4") {
                if (variables.messagesGPT4.length >= NB_OF_MESSAGES_TO_KEEP) {
                    variables.messagesGPT4.splice(0, 1);
                    variables.messagesGPT4.push({ role: "user", content })
                } else {
                    variables.messagesGPT4.push({ role: "user", content })
                }
                try {
                    const response = await sendMessagetoGpt(variables.messagesGPT4, MODEL);
                    variables.messagesGPT4.push({ role: "assistant", content: response })
                    return axiosInstance.respondToUser(messageObj, response);
                } catch (error) {
                    console.error(error);
                    return "An error occurred";
                }
            }
        }
    }
}

module.exports = { handleMessage };


async function handleCommands(content, messageObj) {
    let messageString
    switch (content) {
        // MENU / HELP
        case '/help':
            axiosInstance.respondToUser(messageObj, `Voici les commandes disponibles: ${variables.availableCommands.map(command => `\n${command}`)}`);
            return true
        case '/menu':
            axiosInstance.sendKeyboard('Choisissez une catégorie:', variables.menuOptions, process.env.CHAT_ID);
            return true
        case '@Modèle':
            axiosInstance.respondToUser(messageObj, `Voici les commandes disponibles pour le modèle: ${variables.availableCommandsGPT.map(command => `\n${command}`)}`);
            return true
        case '@Crypto':
            axiosInstance.respondToUser(messageObj, `Voici les commandes disponibles pour le Bitcoin: ${variables.availableCommandsCrypto.map(command => `\n${command}`)}`);
            return true
        case '@Currency':
            axiosInstance.respondToUser(messageObj, `Voici les commandes disponibles pour les devises: ${variables.availableCommandsCurrency.map(command => `\n${command}`)}`);
            return true
        case '@Various':
            axiosInstance.respondToUser(messageObj, `Voici les commandes disponibles restantes: ${variables.availableCommandsVarious.map(command => `\n${command}`)}`);
            return true
        case '@In Progress':
            axiosInstance.respondToUser(messageObj, `Commandes non fonctionnelles: ${variables.availableCommandsInProgress.map(command => `\n${command}`)}`);
            return true

        // MODEL
        case '/setmodel':
            axiosInstance.sendKeyboard('Choisissez un modèle :', variables.modelOptions, process.env.CHAT_ID);
            return true
        case 'Modèle: GPT-3':
            MODEL = "gpt-3.5-turbo";
            axiosInstance.respondToUser(messageObj, 'Vous avez choisi GPT-3. Le modèle est mis à jour.');
            return true
        case 'Modèle: GPT-4':
            MODEL = "gpt-4";
            axiosInstance.respondToUser(messageObj, 'Vous avez choisi GPT-4. Le modèle est mis à jour.');
            return true
        case '/getmodel':
            axiosInstance.respondToUser(messageObj, `Le modèle actuel est: ${MODEL}`);
            return true
        case '/clear':
            clearMessages(messageObj)
            return true
        case '/getlimit':
            axiosInstance.respondToUser(messageObj, `La limite de mémoire est de ${NB_OF_MESSAGES_TO_KEEP} messages.`);
            return true
        case '/getmessages':
            getStoredMessages(messageObj, messageString)
            return true
        case '/getallmessages':
            if (MODEL === "gpt-3.5-turbo") {
                messageString = variables.messages.map(message => `<strong>\n${message.role}</strong>: ${message.content}`)
                axiosInstance.respondToUser(messageObj, `Voici toutes les données en mémoire:\n${messageString.join('\n')}`);
                return true
            } else if (MODEL === "gpt-4") {
                messageString = variables.messagesGPT4.map(message => `<strong>\n${message.role}</strong>: ${message.content}`)
                axiosInstance.respondToUser(messageObj, `Voici toutes les données en mémoire:\n${messageString.join('\n')}`);
                return true
            }
        case '/setlimit':
            axiosInstance.sendKeyboard('Choisissez une limite :', variables.limitOptions, process.env.CHAT_ID);
            return true
        case 'Limite: 5':
            if (NB_OF_MESSAGES_TO_KEEP === 5) return axiosInstance.respondToUser(messageObj, 'La limite de mémoire est déjà de 5 messages.');
            NB_OF_MESSAGES_TO_KEEP = 5;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj);
        case 'Limite: 10':
            if (NB_OF_MESSAGES_TO_KEEP === 10) return axiosInstance.respondToUser(messageObj, 'La limite de mémoire est déjà de 10 messages.');
            NB_OF_MESSAGES_TO_KEEP = 10;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj)
        case 'Limite: 3':
            if (NB_OF_MESSAGES_TO_KEEP === 3) return axiosInstance.respondToUser(messageObj, 'La limite de mémoire est déjà de 3 messages.');
            NB_OF_MESSAGES_TO_KEEP = 3;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj)
        case 'Limite: 15':
            if (NB_OF_MESSAGES_TO_KEEP === 15) return axiosInstance.respondToUser(messageObj, 'La limite de mémoire est déjà de 15 messages.');
            NB_OF_MESSAGES_TO_KEEP = 15;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj);
        // case '/graph5minutes':
        //     await createNumericCurveWithAxes(crypto.btcLast5Prices)
        //     axiosInstance.sendPicture(imageUrl, process.env.CHAT_ID);
        //     return true
        // case '/graph1hour':
        //     await createNumericCurveWithAxes(crypto.btcLastHourPrices)
        //     axiosInstance.sendPicture(imageUrl, process.env.CHAT_ID);
        //     return true

        // CRYPTO
        case '/getprice':
            crypto.retreiveCryptoPrices(axiosInstance.sendToGroovy);
            return true
        case '/getrate':
            const rate = crypto.getAlertThreshold();
            axiosInstance.respondToUser(messageObj, `Le taux de suerveillance est: ${rate}`);
            return true
        case '/setrate':
            axiosInstance.sendKeyboard('Choisissez un taux :', variables.rateOptions, process.env.CHAT_ID);
            return true
        case 'Taux: 0.2%':
            if (crypto.getAlertThreshold() === 0.2) return axiosInstance.respondToUser(messageObj, 'Le taux de surveillance est déjà de 0.2%.');
            crypto.setAlertThreshold(0.2)
            axiosInstance.respondToUser(messageObj, 'Vous avez choisi 0.2%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 0.5%':
            if (crypto.getAlertThreshold() === 0.5) return axiosInstance.respondToUser(messageObj, 'Le taux de surveillance est déjà de 0.5%.');
            crypto.setAlertThreshold(0.5)
            axiosInstance.respondToUser(messageObj, 'Vous avez choisi 0.5%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 0.01%':
            if (crypto.getAlertThreshold() === 0.01) return axiosInstance.respondToUser(messageObj, 'Le taux de surveillance est déjà de 0.01%.');
            crypto.setAlertThreshold(0.01)
            axiosInstance.respondToUser(messageObj, 'Vous avez choisi 0.01%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 1%':
            if (crypto.getAlertThreshold() === 1) return axiosInstance.respondToUser(messageObj, 'Le taux de surveillance est déjà de 1%.');
            crypto.setAlertThreshold(1)
            axiosInstance.respondToUser(messageObj, 'Vous avez choisi 1%. Le taux de surveillance est mis à jour.');
            return true
        case '/getrateshitcoin':
            const rateShitcoin = crypto.getAlertThresholdShitcoin();
            axiosInstance.respondToUser(messageObj, `Le taux de suerveillance pour les shitcoins est: ${rateShitcoin}`);
            return true
        case '/setrateshitcoin':
            axiosInstance.sendKeyboard('Choisissez un taux :', variables.rateOptionsShitcoins, process.env.CHAT_ID);
            return true
        case 'SC-Taux: 0.2%':
            modifyAlertThreshold(messageObj, 0.2, crypto.getAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 0.5%':
            modifyAlertThreshold(messageObj, 0.5, crypto.getAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 1%':
            modifyAlertThreshold(messageObj, 1, crypto.getAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 2%':
            modifyAlertThreshold(messageObj, 2, crypto.getAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 3%':
            modifyAlertThreshold(messageObj, 3, crypto.getAlertThresholdShitcoin)
            return true
        case '/getpercentchange5mn':
            const { percentChange, minutes, coin } = await crypto.getPercentChange5mn('bitcoin');
            axiosInstance.respondToUser(messageObj, `Le taux de variation du ${coin} sur ${minutes} minutes est de ${percentChange}%.`);
            return true
        case '/getpercentchange1h':
            getPercentChangePerMinutesForAllCoins(60, messageObj)
            return true
        case '/getpercentchange2h':
            getPercentChangePerMinutesForAllCoins(120, messageObj)
            return true
        case '/getpercentchange3h':
            getPercentChangePerMinutesForAllCoins(180, messageObj)
            return true
        case '/getpercentchange4h':
            getPercentChangePerMinutesForAllCoins(240, messageObj)
            return true
        // CURRENCY
        case '/getchange':
            const message = await exchangeInstance.getExchangeRate();
            axiosInstance.respondToUser(messageObj, message);
            return true

        default:
            return false
    }
}

function modifyAlertThreshold(messageObj, rate, getterCallback) {
    if(getterCallback() === rate) return axiosInstance.respondToUser(messageObj, `Le taux de surveillance est déjà de ${rate}%.`);
    crypto.setAlertThreshold(rate)
    axiosInstance.respondToUser(messageObj, `Le taux de surveillance est mis à jour à ${rate}%.`);
}

function getPercentChangePerMinutesForAllCoins(minutes, messageObj) {
    getpercentChangePerMinutes('bitcoin', minutes, messageObj)
    getpercentChangePerMinutes('ethereum', minutes, messageObj)
    getpercentChangePerMinutes('cardano', minutes, messageObj)
    getpercentChangePerMinutes('vechain', minutes, messageObj)
    getpercentChangePerMinutes('The Graph', minutes, messageObj)
    getpercentChangePerMinutes('Internet Computer', minutes, messageObj)
    getpercentChangePerMinutes('solana', minutes, messageObj)
    getpercentChangePerMinutes('apecoin', minutes, messageObj)
    getpercentChangePerMinutes('NEAR Protocol', minutes, messageObj)
}

async function getpercentChangePerMinutes(coin, minutes, messageObj) {
    const { percentChange, time } = await crypto.getPercentChangePerMinutes(coin, minutes);
    axiosInstance.respondToUser(messageObj, `Le taux de variation du ${coin} sur ${time / 60} heure(s) est de ${percentChange}%.`);
}

// Adjust memory limit
function adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4, messageObj) {
    if (MODEL === "gpt-3.5-turbo") {
        const messagesToKeep = NB_OF_MESSAGES_TO_KEEP + 15;
        if (messages.length > messagesToKeep) messages.splice(messagesToKeep);
        axiosInstance.respondToUser(messageObj, `Vous avez choisi ${NB_OF_MESSAGES_TO_KEEP}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
        return true
    } else if (MODEL === "gpt-4") {
        if (messagesGPT4.length > NB_OF_MESSAGES_TO_KEEP) messagesGPT4.splice(NB_OF_MESSAGES_TO_KEEP);
        axiosInstance.respondToUser(messageObj, `Vous avez choisi ${NB_OF_MESSAGES_TO_KEEP}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
        return true
    }
}

// Check if the user is authorized
function isAuthorizedUser(messageObj) {
    return messageObj && messageObj.chat.username === process.env.TELEGRAM_USERNAME && messageObj.chat.id === Number(process.env.CHAT_ID);
}

// Clear stored messages
function clearMessages(messageObj) {
    if (MODEL === "gpt-3.5-turbo") {
        variables.messages.splice(15);
    } else if (MODEL === "gpt-4") {
        variables.messagesGPT4.splice(0);
    }
    axiosInstance.respondToUser(messageObj, 'Les messages en mémoire ont été effacés.');
}

// Get stored messages
function getStoredMessages(messageObj, messageString) {
    let storedMessages;
    if (MODEL === "gpt-3.5-turbo") {
        storedMessages = [...variables.messages];
        storedMessages.splice(0, 15);
    } else if (MODEL === "gpt-4") {
        storedMessages = [...variables.messagesGPT4];
    }

    if (storedMessages.length === 0) {
        axiosInstance.respondToUser(messageObj, 'Aucun message en mémoire');
        return;
    }

    messageString = storedMessages.map(message => `<u><strong>\n${message.role}</strong></u>: ${message.content}`);
    axiosInstance.respondToUser(messageObj, `Voici les messages en mémoire:\n${messageString.join('')}`);
}

async function handleSpecialCommands(content, messageObj) {
    if (content.startsWith('/change=')) {
        const amount = content.split('=')[1];
        const amountNumber = Number(amount);
        if (amountNumber) {
            const change = await exchangeInstance.getExchangeRateForAmount(amountNumber);
            axiosInstance.respondToUser(messageObj, change);
            return true
        } else {
            axiosInstance.respondToUser(messageObj, 'Veuillez entrer un nombre valide.');
            return true
        }
    }
    if (content.startsWith('/getpercentchange=')) {
        const time = content.split('=')[1];
        const timeNumber = Number(time);
        if (timeNumber) {
            const { percentChange, minutes } = crypto.getPercentChangePerMinutes(timeNumber);
            axiosInstance.respondToUser(messageObj, `Le taux de variation sur ${minutes} minutes est de ${percentChange}%.`);
            return true
        } else {
            axiosInstance.respondToUser(messageObj, 'Veuillez entrer un nombre valide.');
            return true
        }
    }
}
