require('dotenv').config();
const fs = require("fs");
const path = require('path');

const { axiosInstance } = require("./axios");
const { sendMessagetoGpt } = require("../../chatGPT/communication.js");
const { createNumericCurveWithAxes } = require("../../charts/index.js");
const crypto = require("../../market/crypto.js");
const variables = require("./variables.js");
// const { exchangeInstance } = require("../../market/currency.js");

const TELEGRAM_USERNAME = 'groovyhooked';
let MODEL = "gpt-3.5-turbo";
let NB_OF_MESSAGES_TO_KEEP = 5;

const racineDuProjet = path.join(__dirname, '../../'); // Remonte d'un répertoire
const imageUrl = path.join(racineDuProjet, 'charts', 'graph.png');
console.log(imageUrl);
console.log(fs.existsSync(imageUrl))

// crypto.init(sendToGroovy);
// crypto.main(sendToGroovy);
// setInterval(() => {
//     crypto.main(sendToGroovy)
// }, 60000);

async function handleMessage(messageObj) {

    if (!isAuthorizedUser(messageObj)) {
        respondToUser(messageObj, `Vous n\'êtes pas autorisé à utiliser ce bot. Vous pouvez contacter un admin en lui remettant votre identifiant Telegram: ${messageObj.chat.id}.`);
        return;
    }

    const content = messageObj?.text;

    if (content) {
        const isCommand = await handleCommands(content, messageObj);
        // const isChange = await handleSpecialCommands(content, messageObj);
        if (!isCommand) {
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
                    return respondToUser(messageObj, response);
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
                    return respondToUser(messageObj, response);
                } catch (error) {
                    console.error(error);
                    return "An error occurred";
                }
            }
        }
    }
}


function respondToUser(messageObj, messageText) {
    return axiosInstance.get("sendMessage", {
        chat_id: messageObj.chat.id,
        text: messageText,
        parse_mode: "HTML",
    });
}

function sendToGroovy(messageText) {
    return axiosInstance.get("sendMessage", {
        chat_id: process.env.CHAT_ID,
        text: messageText,
        parse_mode: "HTML",
    });
}

async function handleCommands(content, messageObj) {
    let messageString
    switch (content) {
        // MENU / HELP
        case '/help':
            respondToUser(messageObj, `Voici les commandes disponibles: ${variables.availableCommands.map(command => `\n${command}`)}`);
            return true
        case '/menu':
            axiosInstance.sendKeyboard('Choisissez une catégorie:', variables.menuOptions, process.env.CHAT_ID);
            return true
        case '@Modèle':
            respondToUser(messageObj, `Voici les commandes disponibles pour le modèle: ${variables.availableCommandsGPT.map(command => `\n${command}`)}`);
            return true
        case '@Bitcoin':
            respondToUser(messageObj, `Voici les commandes disponibles pour le Bitcoin: ${variables.availableCommandsCrypto.map(command => `\n${command}`)}`);
            return true
        case '@Currency':
            respondToUser(messageObj, `Voici les commandes disponibles pour les devises: ${variables.availableCommandsCurrency.map(command => `\n${command}`)}`);
            return true
        case '@Various':
            respondToUser(messageObj, `Voici les commandes disponibles restantes: ${variables.availableCommandsVarious.map(command => `\n${command}`)}`);
            return true
        case '@In Progress':
            respondToUser(messageObj, `Commandes non fonctionnelles: ${variables.availableCommandsInProgress.map(command => `\n${command}`)}`);
            return true

        // MODEL
        case '/setmodel':
            axiosInstance.sendKeyboard('Choisissez un modèle :', variables.modelOptions, process.env.CHAT_ID);
            return true
        case 'Modèle: GPT-3':
            MODEL = "gpt-3.5-turbo";
            respondToUser(messageObj, 'Vous avez choisi GPT-3. Le modèle est mis à jour.');
            return true
        case 'Modèle: GPT-4':
            MODEL = "gpt-4";
            respondToUser(messageObj, 'Vous avez choisi GPT-4. Le modèle est mis à jour.');
            return true
        case '/getmodel':
            respondToUser(messageObj, `Le modèle actuel est: ${MODEL}`);
            return true
        case '/clear':
            clearMessages()
            return true
        case '/getlimit':
            respondToUser(messageObj, `La limite de mémoire est de ${NB_OF_MESSAGES_TO_KEEP} messages.`);
            return true
        case '/getmessages':
            getStoredMessages(messageObj, messageString)
            return true
        case '/getallmessages':
            if (MODEL === "gpt-3.5-turbo") {
                messageString = variables.messages.map(message => `<strong>\n${message.role}</strong>: ${message.content}`)
                respondToUser(messageObj, `Voici toutes les données en mémoire:\n${messageString.join('\n')}`);
                return true
            } else if (MODEL === "gpt-4") {
                messageString = variables.messagesGPT4.map(message => `<strong>\n${message.role}</strong>: ${message.content}`)
                respondToUser(messageObj, `Voici toutes les données en mémoire:\n${messageString.join('\n')}`);
                return true
            }
        case '/setlimit':
            axiosInstance.sendKeyboard('Choisissez une limite :', variables.limitOptions, process.env.CHAT_ID);
            return true
        case 'Limite: 5':
            if (NB_OF_MESSAGES_TO_KEEP === 5) return respondToUser(messageObj, 'La limite de mémoire est déjà de 5 messages.');
            NB_OF_MESSAGES_TO_KEEP = 5;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj);
        case 'Limite: 10':
            if (NB_OF_MESSAGES_TO_KEEP === 10) return respondToUser(messageObj, 'La limite de mémoire est déjà de 10 messages.');
            NB_OF_MESSAGES_TO_KEEP = 10;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj)
        case 'Limite: 3':
            if (NB_OF_MESSAGES_TO_KEEP === 3) return respondToUser(messageObj, 'La limite de mémoire est déjà de 3 messages.');
            NB_OF_MESSAGES_TO_KEEP = 3;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj)
        case 'Limite: 15':
            if (NB_OF_MESSAGES_TO_KEEP === 15) return respondToUser(messageObj, 'La limite de mémoire est déjà de 15 messages.');
            NB_OF_MESSAGES_TO_KEEP = 15;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, variables.messages, variables.messagesGPT4, messageObj);
        case '/graph10minutes':
            await createNumericCurveWithAxes(crypto.btcLast10Prices)
            axiosInstance.sendPicture(imageUrl, process.env.CHAT_ID);
            return true
        case '/graph1hour':
            await createNumericCurveWithAxes(crypto.btcLastHourPrices)
            axiosInstance.sendPicture(imageUrl, process.env.CHAT_ID);
            return true

        // CRYPTO
        case '/getprice':
            crypto.retreiveBitcoinPrice(sendToGroovy);
            return true
        case '/getrate':
            const rate = crypto.getAlertThreshold();
            respondToUser(messageObj, `Le taux de suerveillance est: ${rate}`);
            return true
        case '/setrate':
            axiosInstance.sendKeyboard('Choisissez un taux :', variables.rateOptions, process.env.CHAT_ID);
            return true
        case 'Taux: 0.2%':
            if (crypto.getAlertThreshold() === 0.2) return respondToUser(messageObj, 'Le taux de surveillance est déjà de 0.2%.');
            crypto.setAlertThreshold(0.2)
            respondToUser(messageObj, 'Vous avez choisi 0.2%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 0.5%':
            if (crypto.getAlertThreshold() === 0.5) return respondToUser(messageObj, 'Le taux de surveillance est déjà de 0.5%.');
            crypto.setAlertThreshold(0.5)
            respondToUser(messageObj, 'Vous avez choisi 0.5%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 0.01%':
            if (crypto.getAlertThreshold() === 0.01) return respondToUser(messageObj, 'Le taux de surveillance est déjà de 0.01%.');
            crypto.setAlertThreshold(0.01)
            respondToUser(messageObj, 'Vous avez choisi 0.01%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 1%':
            if (crypto.getAlertThreshold() === 1) return respondToUser(messageObj, 'Le taux de surveillance est déjà de 1%.');
            crypto.setAlertThreshold(1)
            respondToUser(messageObj, 'Vous avez choisi 1%. Le taux de surveillance est mis à jour.');
            return true
        case '/getpercentchange10mn':
            const { percentChange, minutes } = crypto.getPercentChange10mn();
            respondToUser(messageObj, `Le taux de variation sur ${minutes} minutes est de ${percentChange}%.`);
            return true
        case '/getpercentchange1h':
            const { percentChange1h, time } = crypto.getPercentChange1h();
            respondToUser(messageObj, `Le taux de variation sur ${time < 60 ? time : 1} ${time < 60 ? 'minutes' : 'heure'} est de ${percentChange1h}%.`);
            return true

        // CURRENCY
        // case '/getchange':
        //     const message = await exchangeInstance.getExchangeRate();
        //     respondToUser(messageObj, message);
        //     return true

        default:
            return false
    }
}

module.exports = { handleMessage };

// Adjust memory limit
function adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4, messageObj) {
    if (MODEL === "gpt-3.5-turbo") {
        messagesToKeep = NB_OF_MESSAGES_TO_KEEP + 15;
        if (messages.length > messagesToKeep) messages.splice(messagesToKeep);
        respondToUser(messageObj, `Vous avez choisi ${NB_OF_MESSAGES_TO_KEEP}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
        return true
    } else if (MODEL === "gpt-4") {
        if (messagesGPT4.length > NB_OF_MESSAGES_TO_KEEP) messagesGPT4.splice(NB_OF_MESSAGES_TO_KEEP);
        respondToUser(messageObj, `Vous avez choisi ${NB_OF_MESSAGES_TO_KEEP}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
        return true
    }
}

// Check if the user is authorized
function isAuthorizedUser(messageObj) {
    return messageObj && messageObj.chat.username === TELEGRAM_USERNAME && messageObj.chat.id === process.env.CHAT_ID;
}

// Clear stored messages
function clearMessages() {
    if (MODEL === "gpt-3.5-turbo") {
        variables.messages.splice(15);
    } else if (MODEL === "gpt-4") {
        variables.messagesGPT4.splice(0);
    }
    respondToUser(messageObj, 'Les messages en mémoire ont été effacés.');
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
        respondToUser(messageObj, 'Aucun message en mémoire');
        return;
    }

    messageString = storedMessages.map(message => `<u><strong>\n${message.role}</strong></u>: ${message.content}`);
    respondToUser(messageObj, `Voici les messages en mémoire:\n${messageString.join('')}`);
}



// async function handleSpecialCommands(content, messageObj) {
//     if (content.startsWith('/change=')) {
//         const amount = content.split('=')[1];
//         const amountNumber = Number(amount);
//         if (amountNumber) {
//             const change = await exchangeInstance.getExchangeRateForAmount(amountNumber);
//             respondToUser(messageObj, change);
//             return true
//         } else {
//             respondToUser(messageObj, 'Veuillez entrer un nombre valide.');
//             return true
//         }
//     }
// }
