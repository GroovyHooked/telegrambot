require('dotenv').config();

const { axiosInstance } = require("./axios");
const { sendMessagetoGpt } = require("../../chatGPT/communication.js");
const crypto = require("../../market/crypto.js");
const variables = require("./variables.js");
const { exchangeInstance } = require("../../market/currency.js");
const { getNB_OF_MESSAGES_TO_KEEP, setNB_OF_MESSAGES_TO_KEEP } = require("../../database/database.js");
let MODEL = "gpt-3.5-turbo";
let NB_OF_MESSAGES_TO_KEEP 

async function handleMessage(messageObj) {

    if (!isAuthorizedUser(messageObj)) {
        axiosInstance.respondToUser(messageObj, `Vous n\'êtes pas autorisé à utiliser ce bot. Vous pouvez contacter un admin en lui remettant votre identifiant Telegram: ${messageObj.chat.id}.`);
        return;
    }

    const content = messageObj?.text;

    if (content) {
        // Check if the message is a command
        const isCommand = await handleCommands(content, messageObj);
        const isSpecialCommand = await handleSpecialCommands(content, messageObj);

        // If the message is not a command, send it to GPT
        if (!isCommand && !isSpecialCommand) {
            await getNB_OF_MESSAGES_TO_KEEP().then((result) => NB_OF_MESSAGES_TO_KEEP = result)
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
            await getNB_OF_MESSAGES_TO_KEEP().then((result) => NB_OF_MESSAGES_TO_KEEP = result)
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
            adjusteMemoryLimitAndRespond(5, MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj);
            return true
        case 'Limite: 10':
            adjusteMemoryLimitAndRespond(10, MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj)
            return true
        case 'Limite: 3':
            adjusteMemoryLimitAndRespond(3, MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj)
            return true
        case 'Limite: 15':
            adjusteMemoryLimitAndRespond(15, MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj);
            return true


        // CRYPTO
        case '/getprice':
            crypto.retreiveCryptoPrices(axiosInstance.sendToGroovy);
            return true
        case '/getrate':
            const rate = await crypto.getAlertThreshold();
            axiosInstance.respondToUser(messageObj, `Le taux de suerveillance est de ${rate}%`);
            return true
        case '/setrate':
            axiosInstance.sendKeyboard('Choisissez un taux :', variables.rateOptions, process.env.CHAT_ID);
            return true
        case 'Taux: 0.2%':
            modifyAlertThreshold(messageObj, 0.2, crypto.getAlertThreshold, crypto.setAlertThreshold)
            return true
        case 'Taux: 0.5%':
            modifyAlertThreshold(messageObj, 0.5, crypto.getAlertThreshold, crypto.setAlertThreshold)
            return true
        case 'Taux: 0.01%':
            modifyAlertThreshold(messageObj, 0.01, crypto.getAlertThreshold, crypto.setAlertThreshold)
            return true
        case 'Taux: 1%':
            modifyAlertThreshold(messageObj, 1, crypto.getAlertThreshold, crypto.setAlertThreshold)
            return true
        case '/getrateshitcoin':
            const rateShitcoin = await crypto.getAlertThresholdShitcoin();
            axiosInstance.respondToUser(messageObj, `Le taux de suerveillance pour les shitcoins est de ${rateShitcoin}%`);
            return true
        case '/setrateshitcoin':
            axiosInstance.sendKeyboard('Choisissez un taux :', variables.rateOptionsShitcoins, process.env.CHAT_ID);
            return true
        case 'SC-Taux: 0.2%':
            modifyAlertThreshold(messageObj, 0.2, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 0.5%':
            modifyAlertThreshold(messageObj, 0.5, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 1%':
            modifyAlertThreshold(messageObj, 1, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 2%':
            modifyAlertThreshold(messageObj, 2, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 3%':
            modifyAlertThreshold(messageObj, 3, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case '/getpercentchange5mn':
            const { percentChange, minutes, coin } = await crypto.getPercentChange5mn('bitcoin');
            axiosInstance.respondToUser(messageObj, `Le taux de variation du ${coin} sur ${minutes} minutes est de ${percentChange}%.`);
            return true
        case '/getpercentchange1h':
            await getPercentChangePerMinutesForAllCoins(60, messageObj)
            return true
        case '/getpercentchange2h':
            await getPercentChangePerMinutesForAllCoins(120, messageObj)
            return true
        case '/getpercentchange3h':
            await getPercentChangePerMinutesForAllCoins(180, messageObj)
            return true
        case '/getpercentchange4h':
            await getPercentChangePerMinutesForAllCoins(240, messageObj)
            return true
        // CURRENCY
        case '/getchange':
            const message = await exchangeInstance.getExchangeRateString();
            axiosInstance.respondToUser(messageObj, message);
            return true
        
        default:
            return false
    }
}

async function modifyAlertThreshold(messageObj, rate, getterCallback, setterCallback) {
    if (getterCallback() === rate) return axiosInstance.respondToUser(messageObj, `Le taux de surveillance est déjà de ${rate}%.`);
    await setterCallback(rate)
    axiosInstance.respondToUser(messageObj, `Le taux de surveillance est mis à jour à ${rate}%.`);
}

async function getPercentChangePerMinutesForAllCoins(minutes, messageObj) {
    let messageString = '';
    for (const coin of variables.portfolio) {
        const { percentChange, time } = await crypto.getPercentChangePerMinutes(coin, minutes);
        messageString += `${crypto.trendEmoji(percentChange)} <strong>${coin}</strong> ${time / 60} heure(s): <strong>${percentChange}%</strong>\n`;
    }
    axiosInstance.respondToUser(messageObj, messageString);
}

// Adjust memory limit
async function adjusteMemoryLimitAndRespond(limit, MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4, messageObj) {
    await getNB_OF_MESSAGES_TO_KEEP().then((result) => NB_OF_MESSAGES_TO_KEEP = result)
    if (NB_OF_MESSAGES_TO_KEEP === limit) return axiosInstance.respondToUser(messageObj, `La limite de mémoire est déjà de ${limit} messages.`);
    await setNB_OF_MESSAGES_TO_KEEP(limit);
    if (MODEL === "gpt-3.5-turbo") {
        if (messages.length > limit + 15) messages.splice(limit + 15);
        axiosInstance.respondToUser(messageObj, `Vous avez choisi ${limit}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
    } else if (MODEL === "gpt-4") {
        if (messagesGPT4.length > limit) messagesGPT4.splice(limit);
        axiosInstance.respondToUser(messageObj, `Vous avez choisi ${limit}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
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
            const change = await exchangeInstance.convertToDollar(amountNumber);
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
