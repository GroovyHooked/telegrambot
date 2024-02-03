require('dotenv').config();

const { axiosInstance } = require("./axios");
const { fetchOpenAI } = require("../../llm/communication.js");
const crypto = require("../../market/crypto.js");
const variables = require("./variables.js");
const { exchangeInstance } = require("../../market/fiat.js");
const { dbRequestNbOfMessagesToKeep, dbSetNbOfMessagesToKeep } = require("../../database/database.js");
let MODEL = "gpt-3.5-turbo";
let NB_OF_MESSAGES_TO_KEEP
const NB_OF_MESSAGES_SYSTEM = 18;

async function processReceivedMessage(messageObj) {
    const content = messageObj?.text;
    if (content) {
        const isCommand = await processCommands(content);
        const isSpecialCommand = await processSpecialCommands(content);

        if (isCommand || isSpecialCommand) return
        await dbRequestNbOfMessagesToKeep().then((result) => NB_OF_MESSAGES_TO_KEEP = result)
        MODEL === "gpt-4" ? await modelHandleRequest(MODEL, variables.messagesGPT4, content) : await modelHandleRequest(MODEL, variables.messages, content)
    }
}

async function modelHandleRequest(model, messages, content) {
    if (messages.length >= model === "gpt-4" ? NB_OF_MESSAGES_TO_KEEP : NB_OF_MESSAGES_TO_KEEP + NB_OF_MESSAGES_SYSTEM) {
        messages.splice(model === "gpt-4" ? 0 : NB_OF_MESSAGES_SYSTEM, 1);
        messages.push({ role: "assistant", content })
    } else {
        messages.push({ role: "assistant", content })
    }
    try {
        const response = await fetchOpenAI(messages, model);
        variables.messages.push({ role: "assistant", content: response })
        return axiosInstance.sendToGroovy(response);
    } catch (error) {
        console.error(error);
        return "An error occurred";
    }
}

module.exports = { processReceivedMessage };


async function processCommands(content) {
    let messageString
    switch (content) {
        // MENU / HELP
        case '/help':
            axiosInstance.sendToGroovy(`Voici les commandes disponibles: ${variables.availableCommands.map(command => `\n${command}`)}`);
            return true
        case '/menu':
            axiosInstance.sendKeyboard('Choisissez une catégorie:', variables.menuOptions, process.env.CHAT_ID);
            return true
        case '@Modèle':
            axiosInstance.sendToGroovy(`Voici les commandes disponibles pour le modèle: ${variables.availableCommandsGPT.map(command => `\n${command}`)}`);
            return true
        case '@Crypto':
            axiosInstance.sendToGroovy(`Voici les commandes disponibles pour le Bitcoin: ${variables.availableCommandsCrypto.map(command => `\n${command}`)}`);
            return true
        case '@Currency':
            axiosInstance.sendToGroovy(`Voici les commandes disponibles pour les devises: ${variables.availableCommandsCurrency.map(command => `\n${command}`)}`);
            return true
        case '@Help':
            axiosInstance.sendToGroovy(`Voici les commandes disponibles restantes: ${variables.availableCommandsHelp.map(command => `\n${command}`)}`);
            return true

        // MODEL
        case '/setmodel':
            axiosInstance.sendKeyboard('Choisissez un modèle :', variables.modelOptions, process.env.CHAT_ID);
            return true
        case 'Modèle: GPT-3':
            MODEL = "gpt-3.5-turbo";
            axiosInstance.sendToGroovy('Vous avez choisi GPT-3. Le modèle est mis à jour.');
            return true
        case 'Modèle: GPT-4':
            MODEL = "gpt-4";
            axiosInstance.sendToGroovy('Vous avez choisi GPT-4. Le modèle est mis à jour.');
            return true
        case '/getmodel':
            axiosInstance.sendToGroovy(`Le modèle actuel est: ${MODEL}`);
            return true
        case '/clear':
            clearMessages()
            return true
        case '/getlimit':
            await dbRequestNbOfMessagesToKeep().then((result) => NB_OF_MESSAGES_TO_KEEP = result)
            axiosInstance.sendToGroovy(`La limite de mémoire est de ${NB_OF_MESSAGES_TO_KEEP} messages.`);
            return true
        case '/getmessages':
            getStoredMessages(messageString)
            return true
        case '/getallmessages':
            if (MODEL === "gpt-3.5-turbo") {
                messageString = variables.messages.map(message => `<strong>\n${message.role}</strong>: ${message.content}`)
                axiosInstance.sendToGroovy(`Voici toutes les données en mémoire:\n${messageString.join('\n')}`);
                return true
            } else if (MODEL === "gpt-4") {
                messageString = variables.messagesGPT4.map(message => `<strong>\n${message.role}</strong>: ${message.content}`)
                axiosInstance.sendToGroovy(`Voici toutes les données en mémoire:\n${messageString.join('\n')}`);
                return true
            }
        case '/setlimit':
            axiosInstance.sendKeyboard('Choisissez une limite :', variables.limitOptions, process.env.CHAT_ID);
            return true
        case 'Limite: 5':
            adjusteMemoryLimitAndRespond(5, MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4);
            return true
        case 'Limite: 10':
            adjusteMemoryLimitAndRespond(10, MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4)
            return true
        case 'Limite: 3':
            adjusteMemoryLimitAndRespond(3, MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4)
            return true
        case 'Limite: 15':
            adjusteMemoryLimitAndRespond(15, MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4);
            return true


        // CRYPTO
        case '/getprice':
            crypto.retrieveCryptoPrices(axiosInstance.sendToGroovy);
            return true
        case '/getrate':
            const rate = await crypto.getAlertThreshold();
            axiosInstance.sendToGroovy(`Le taux de suerveillance est de ${rate}%`);
            return true
        case '/setrate':
            axiosInstance.sendKeyboard('Choisissez un taux :', variables.rateOptions, process.env.CHAT_ID);
            return true
        case 'Taux: 0.2%':
            modifyAlertThreshold(0.2, crypto.getAlertThreshold, crypto.setAlertThreshold)
            return true
        case 'Taux: 0.5%':
            modifyAlertThreshold(0.5, crypto.getAlertThreshold, crypto.setAlertThreshold)
            return true
        case 'Taux: 0.01%':
            modifyAlertThreshold(0.01, crypto.getAlertThreshold, crypto.setAlertThreshold)
            return true
        case 'Taux: 1%':
            modifyAlertThreshold(1, crypto.getAlertThreshold, crypto.setAlertThreshold)
            return true
        case '/getrateshitcoin':
            const rateShitcoin = await crypto.getAlertThresholdShitcoin();
            axiosInstance.sendToGroovy(`Le taux de suerveillance pour les shitcoins est de ${rateShitcoin}%`);
            return true
        case '/setrateshitcoin':
            axiosInstance.sendKeyboard('Choisissez un taux :', variables.rateOptionsShitcoins, process.env.CHAT_ID);
            return true
        case 'SC-Taux: 0.2%':
            modifyAlertThreshold(0.2, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 0.5%':
            modifyAlertThreshold(0.5, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 1%':
            modifyAlertThreshold(1, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 2%':
            modifyAlertThreshold(2, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case 'SC-Taux: 3%':
            modifyAlertThreshold(3, crypto.getAlertThresholdShitcoin, crypto.setAlertThresholdShitcoin)
            return true
        case '/getpercentchange10mn':
            await getPercentChangePerMinutesForAllCoins(10)
            return true
        case '/getpercentchange1h':
            await getPercentChangePerMinutesForAllCoins(60)
            return true
        case '/getpercentchange2h':
            await getPercentChangePerMinutesForAllCoins(120)
            return true
        case '/getpercentchange3h':
            await getPercentChangePerMinutesForAllCoins(180)
            return true
        case '/getpercentchange4h':
            await getPercentChangePerMinutesForAllCoins(240)
            return true

        // CURRENCY
        case '/getchange':
            const message = await exchangeInstance.getExchangeRateString();
            axiosInstance.sendToGroovy(message);
            return true

        default:
            return false
    }
}

async function modifyAlertThreshold(rate, getterCallback, setterCallback) {
    if (getterCallback() === rate) return axiosInstance.sendToGroovy(`Le taux de surveillance est déjà de ${rate}%.`);
    await setterCallback(rate)
    axiosInstance.sendToGroovy(`Le taux de surveillance est mis à jour à ${rate}%.`);
}

async function getPercentChangePerMinutesForAllCoins(minutes) {
    let messageString = '';
    for (const coin of variables.portfolio) {
        const { percentChange, time } = await crypto.getPercentChangePerMinutes(coin, minutes);
        messageString += `${crypto.trendEmoji(percentChange)} <strong>${coin}</strong> ${minutes === 10 ? '10' : time / 60} ${minutes === 10 ? 'minutes' : 'heure(s)'}: <strong>${percentChange}%</strong>\n`;
    }
    axiosInstance.sendToGroovy(messageString);
}

// Adjust memory limit
async function adjusteMemoryLimitAndRespond(limit, MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4) {
    await dbRequestNbOfMessagesToKeep().then((result) => NB_OF_MESSAGES_TO_KEEP = result)
    if (NB_OF_MESSAGES_TO_KEEP === limit) return axiosInstance.sendToGroovy(`La limite de mémoire est déjà de ${limit} messages.`);
    await dbSetNbOfMessagesToKeep(limit);
    if (MODEL === "gpt-3.5-turbo") {
        if (messages.length > limit + NB_OF_MESSAGES_SYSTEM) messages.splice(limit + NB_OF_MESSAGES_SYSTEM);
        axiosInstance.sendToGroovy(`Vous avez choisi ${limit}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
    } else if (MODEL === "gpt-4") {
        if (messagesGPT4.length > limit) messagesGPT4.splice(limit);
        axiosInstance.sendToGroovy(`Vous avez choisi ${limit}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
    }
}

// Clear stored messages
function clearMessages() {
    if (MODEL === "gpt-3.5-turbo") {
        variables.messages.splice(18);
    } else if (MODEL === "gpt-4") {
        variables.messagesGPT4.splice(0);
    }
    axiosInstance.sendToGroovy('Les messages en mémoire ont été effacés.');
}

// Get stored messages
function getStoredMessages(messageString) {
    let storedMessages;
    if (MODEL === "gpt-3.5-turbo") {
        storedMessages = [...variables.messages];
        storedMessages.splice(0, 18);
    } else if (MODEL === "gpt-4") {
        storedMessages = [...variables.messagesGPT4];
    }

    if (storedMessages.length === 0) {
        axiosInstance.sendToGroovy('Aucun message en mémoire');
        return;
    }

    messageString = storedMessages.map(message => `<u><strong>\n${message.role}</strong></u>: ${message.content}`);
    axiosInstance.sendToGroovy(`Voici les messages en mémoire:\n${messageString.join('')}`);
}

async function processSpecialCommands(content) {
    if (content.startsWith('/change=')) {
        const amount = content.split('=')[1];
        const amountNumber = Number(amount);
        if (amountNumber) {
            const change = await exchangeInstance.convertToDollar(amountNumber);
            axiosInstance.sendToGroovy(change);
            return true
        } else {
            axiosInstance.sendToGroovy('Veuillez entrer un nombre valide.');
            return true
        }
    }
    if (content.startsWith('/getpercentchange=')) {
        const time = content.split('=')[1];
        const timeNumber = Number(time);
        if (timeNumber) {
            // TODO: getPercentChangePerMinutes should take 2 parameters
            const { percentChange, minutes } = crypto.getPercentChangePerMinutes(timeNumber);
            axiosInstance.sendToGroovy(`Le taux de variation sur ${minutes} minutes est de ${percentChange}%.`);
            return true
        } else {
            axiosInstance.sendToGroovy('Veuillez entrer un nombre valide.');
            return true
        }
    }
}
