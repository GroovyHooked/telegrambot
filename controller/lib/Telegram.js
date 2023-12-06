const fs = require("fs");
const { axiosInstance } = require("./axios");
// const { exchangeInstance } = require("../../market/currency.js");
const { sendMessagetoGpt } = require("../../chatGPT/communication.js");
const { main,
    init,
    retreiveBitcoinPrice,
    getAlertThreshold,
    setAlertThreshold,
    getPercentChange10mn,
    getPercentChange1h,
    btcLastHourPrices,
    btcLast10Prices,
} = require("../../market/crypto.js");
const { createNumericCurveWithAxes } = require("../../charts/index.js");

const {
    availableCommands,
    messages,
    messagesGPT4,
    modelOptions,
    limitOptions,
    rateOptions,
    menuOptions,
    availableCommandsGPT,
    availableCommandsCrypto,
    availableCommandsVarious,
    availableCommandsCurrency,
    availableCommandsInProgress,
} = require("./variables.js");

const TELEGRAM_USERNAME = 'groovyhooked';
let MODEL = "gpt-3.5-turbo";
let NB_OF_MESSAGES_TO_KEEP = 5;
const CHAT_ID = 1622615205;

init(sendToGroovy);
main(sendToGroovy);
setInterval(() => {
    main(sendToGroovy)
}, 60000);

async function handleMessage(messageObj) {

    if (messageObj && messageObj.chat.username !== TELEGRAM_USERNAME && messageObj.chat.id !== CHAT_ID) {
        sendMessage(messageObj, `Vous n\'êtes pas autorisé à utiliser ce bot. Vous pouvez contacter un admin en lui remettant votre identifiant Telegram: ${messageObj.chat.id}.`);
        return
    }

    const content = messageObj?.text;

    if (content) {
        const isCommand = await handleCommands(content, messageObj);
        // const isChange = await handleSpecialCommands(content, messageObj);

        if (!isCommand) {
            if (MODEL === "gpt-3.5-turbo") {
                if (messages.length >= NB_OF_MESSAGES_TO_KEEP + 15) {
                    messages.splice(15, 1);
                    messages.push({ role: "user", content })
                } else {
                    messages.push({ role: "user", content })
                }
                try {
                    const response = await sendMessagetoGpt(messages, MODEL);
                    messages.push({ role: "assistant", content: response })
                    return sendMessage(messageObj, response);
                } catch (error) {
                    console.error(error);
                    return "An error occurred";
                }
            } else if (MODEL === "gpt-4") {
                if (messagesGPT4.length >= NB_OF_MESSAGES_TO_KEEP) {
                    messagesGPT4.splice(0, 1);
                    messagesGPT4.push({ role: "user", content })
                } else {
                    messagesGPT4.push({ role: "user", content })
                }
                try {
                    const response = await sendMessagetoGpt(messagesGPT4, MODEL);
                    messagesGPT4.push({ role: "assistant", content: response })
                    return sendMessage(messageObj, response);
                } catch (error) {
                    console.error(error);
                    return "An error occurred";
                }
            }
        }
    }
}


function sendMessage(messageObj, messageText) {
    return axiosInstance.get("sendMessage", {
        chat_id: messageObj.chat.id,
        text: messageText,
        parse_mode: "HTML",
    });
}

function sendToGroovy(messageText) {
    return axiosInstance.get("sendMessage", {
        chat_id: CHAT_ID,
        text: messageText,
        parse_mode: "HTML",
    });
}

// async function handleSpecialCommands(content, messageObj) {
//     if (content.startsWith('/change=')) {
//         const amount = content.split('=')[1];
//         const amountNumber = Number(amount);
//         if (amountNumber) {
//             const change = await exchangeInstance.getExchangeRateForAmount(amountNumber);
//             sendMessage(messageObj, change);
//             return true
//         } else {
//             sendMessage(messageObj, 'Veuillez entrer un nombre valide.');
//             return true
//         }
//     }
// }

async function handleCommands(content, messageObj) {
    let messageString
    let storedMessages
    switch (content) {
        // MENU / HELP
        case '/help':
            sendMessage(messageObj, `Voici les commandes disponibles: ${availableCommands.map(command => `\n${command}`)}`);
            return true
        case '/menu':
            axiosInstance.sendKeyboard('Choisissez une catégorie:', menuOptions, CHAT_ID);
            return true
        case '@Modèle':
            sendMessage(messageObj, `Voici les commandes disponibles pour le modèle: ${availableCommandsGPT.map(command => `\n${command}`)}`);
            return true
        case '@Bitcoin':
            sendMessage(messageObj, `Voici les commandes disponibles pour le Bitcoin: ${availableCommandsCrypto.map(command => `\n${command}`)}`);
            return true
        case '@Currency':
            sendMessage(messageObj, `Voici les commandes disponibles pour les devises: ${availableCommandsCurrency.map(command => `\n${command}`)}`);
            return true
        case '@Various':
            sendMessage(messageObj, `Voici les commandes disponibles restantes: ${availableCommandsVarious.map(command => `\n${command}`)}`);
            return true
        case '@In Progress':
            sendMessage(messageObj, `Commandes non fonctionnelles: ${availableCommandsInProgress.map(command => `\n${command}`)}`);
            return true

        // MODEL
        case '/setmodel':
            axiosInstance.sendKeyboard('Choisissez un modèle :', modelOptions, CHAT_ID);
            return true
        case 'Modèle: GPT-3':
            MODEL = "gpt-3.5-turbo";
            sendMessage(messageObj, 'Vous avez choisi GPT-3. Le modèle est mis à jour.');
            return true
        case 'Modèle: GPT-4':
            MODEL = "gpt-4";
            sendMessage(messageObj, 'Vous avez choisi GPT-4. Le modèle est mis à jour.');
            return true
        case '/getmodel':
            sendMessage(messageObj, `Le modèle actuel est: ${MODEL}`);
            return true
        case '/clear':
            if (MODEL === "gpt-3.5-turbo") {
                messages.splice(15)
                sendMessage(messageObj, 'Messages effacés');
                return true
            } else if (MODEL === "gpt-4") {
                messagesGPT4.splice(0)
                sendMessage(messageObj, 'Messages effacés');
                return true
            }
        case '/getlimit':
            sendMessage(messageObj, `La limite de mémoire est de ${NB_OF_MESSAGES_TO_KEEP} messages.`);
            return true
        case '/getmessages':
            if (MODEL === "gpt-3.5-turbo") {
                storedMessages = [...messages]
                storedMessages.splice(0, 15)
                console.log(storedMessages);
                if (storedMessages.length === 0) return sendMessage(messageObj, 'Aucun message en mémoire');
                messageString = storedMessages.map(message => `<u><strong>\n${message.role}</strong></u>: ${message.content}`)
                sendMessage(messageObj, `Voici les messages en mémoire:\n${messageString.join('')}`);
                storedMessages = [];
                return true
            } else if (MODEL === "gpt-4") {
                storedMessages = [...messagesGPT4]
                console.log(storedMessages);
                if (storedMessages.length === 0) return sendMessage(messageObj, 'Aucun message en mémoire');
                storedMessages = storedMessages.map(message => `<u><strong>\n${message.role}</strong></u>: ${message.content}`)
                sendMessage(messageObj, `Voici les messages en mémoire:\n${messageString.join('')}`);
                storedMessages = [];
                return true
            }
        case '/getallmessages':
            if (MODEL === "gpt-3.5-turbo") {
                messageString = messages.map(message => `<strong>\n${message.role}</strong>: ${message.content}`)
                sendMessage(messageObj, `Voici toutes les données en mémoire:\n${messageString.join('\n')}`);
                return true
            } else if (MODEL === "gpt-4") {
                messageString = messagesGPT4.map(message => `<strong>\n${message.role}</strong>: ${message.content}`)
                sendMessage(messageObj, `Voici toutes les données en mémoire:\n${messageString.join('\n')}`);
                return true
            }
        case '/setlimit':
            axiosInstance.sendKeyboard('Choisissez une limite :', limitOptions, CHAT_ID);
            return true
        case 'Limite: 5':
            if (NB_OF_MESSAGES_TO_KEEP === 5) return sendMessage(messageObj, 'La limite de mémoire est déjà de 5 messages.');
            NB_OF_MESSAGES_TO_KEEP = 5;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4, messageObj);
        case 'Limite: 10':
            if (NB_OF_MESSAGES_TO_KEEP === 10) return sendMessage(messageObj, 'La limite de mémoire est déjà de 10 messages.');
            NB_OF_MESSAGES_TO_KEEP = 10;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4, messageObj)
        case 'Limite: 3':
            if (NB_OF_MESSAGES_TO_KEEP === 3) return sendMessage(messageObj, 'La limite de mémoire est déjà de 3 messages.');
            NB_OF_MESSAGES_TO_KEEP = 3;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4, messageObj)
        case 'Limite: 15':
            if (NB_OF_MESSAGES_TO_KEEP === 15) return sendMessage(messageObj, 'La limite de mémoire est déjà de 15 messages.');
            NB_OF_MESSAGES_TO_KEEP = 15;
            adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4, messageObj);
        case '/graph10minutes':
            const outputPath1 = await createNumericCurveWithAxes(btcLast10Prices)
            console.log(outputPath1);
            const canvasData1 = fs.readFileSync(outputPath1);
            console.log(canvasData1);
            const foo = outputPath1.split('telegramBot')[1];
            axiosInstance.sendPicture(foo, CHAT_ID);
            return true
        case '/graph1hour':
            const outputPath2 = await createNumericCurveWithAxes(btcLastHourPrices)
            const canvasData2 = fs.readFileSync(outputPath2);
            axiosInstance.sendPicture(canvasData2, CHAT_ID);
            return true

        // CRYPTO
        case '/getprice':
            retreiveBitcoinPrice(sendToGroovy);
            return true
        case '/getrate':
            const rate = getAlertThreshold();
            sendMessage(messageObj, `Le taux de suerveillance est: ${rate}`);
            return true
        case '/setrate':
            axiosInstance.sendKeyboard('Choisissez un taux :', rateOptions, CHAT_ID);
            return true
        case 'Taux: 0.2%':
            if (getAlertThreshold() === 0.2) return sendMessage(messageObj, 'Le taux de surveillance est déjà de 0.2%.');
            setAlertThreshold(0.2)
            sendMessage(messageObj, 'Vous avez choisi 0.2%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 0.5%':
            if (getAlertThreshold() === 0.5) return sendMessage(messageObj, 'Le taux de surveillance est déjà de 0.5%.');
            setAlertThreshold(0.5)
            sendMessage(messageObj, 'Vous avez choisi 0.5%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 0.01%':
            if (getAlertThreshold() === 0.01) return sendMessage(messageObj, 'Le taux de surveillance est déjà de 0.01%.');
            setAlertThreshold(0.01)
            sendMessage(messageObj, 'Vous avez choisi 0.01%. Le taux de surveillance est mis à jour.');
            return true
        case 'Taux: 1%':
            if (getAlertThreshold() === 1) return sendMessage(messageObj, 'Le taux de surveillance est déjà de 1%.');
            setAlertThreshold(1)
            sendMessage(messageObj, 'Vous avez choisi 1%. Le taux de surveillance est mis à jour.');
            return true
        case '/getpercentchange10mn':
            const { percentChange, minutes } = getPercentChange10mn();
            sendMessage(messageObj, `Le taux de variation sur ${minutes} minutes est de ${percentChange}%.`);
            return true
        case '/getpercentchange1h':
            const { percentChange1h, time } = getPercentChange1h();
            sendMessage(messageObj, `Le taux de variation sur ${time < 60 ? time : 1} ${time < 60 ? 'minutes' : 'heure'} est de ${percentChange1h}%.`);
            return true

        // CURRENCY
        // case '/getchange':
        //     const message = await exchangeInstance.getExchangeRate();
        //     sendMessage(messageObj, message);
        //     return true

        default:
            return false
    }
}

module.exports = { handleMessage };


function adjusteMemoryLimitAndRespond(MODEL, NB_OF_MESSAGES_TO_KEEP, messages, messagesGPT4, messageObj) {
    if (MODEL === "gpt-3.5-turbo") {
        messagesToKeep = NB_OF_MESSAGES_TO_KEEP + 15;
        if (messages.length > messagesToKeep) messages.splice(messagesToKeep);
        sendMessage(messageObj, `Vous avez choisi ${NB_OF_MESSAGES_TO_KEEP}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
        return true
    } else if (MODEL === "gpt-4") {
        if (messagesGPT4.length > NB_OF_MESSAGES_TO_KEEP) messagesGPT4.splice(NB_OF_MESSAGES_TO_KEEP);
        sendMessage(messageObj, `Vous avez choisi ${NB_OF_MESSAGES_TO_KEEP}. La limite de mémoire est mise à jour pour le modèle ${MODEL}.`);
        return true
    }
}




