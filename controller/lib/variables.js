const availableCommands = [
    '/getrate',
    '/setrate',
    '/getrateshitcoin',
    '/setrateshitcoin',
    '/getmodel',
    '/setmodel',
    '/help',
    '/clear',
    '/getlimit',
    '/setlimit',
    '/getmessages',
    '/getprice',
    '/getpercentchange10mn',
    '/getpercentchange1h',
    '/getpercentchange2h',
    '/getpercentchange3h',
    '/getpercentchange4h',
    '/getallmessages',
    'WIP/graph5minutes',
    'WIP/graph1hour',
    '/menu',
];

const availableCommandsGPT = [
    '/getmodel',
    '/setmodel',
    '/clear',
    '/getlimit',
    '/setlimit',
    '/getmessages',
    '/getallmessages',
];

const availableCommandsCrypto = [
    '/getprice',
    '/getpercentchange10mn',
    '/getpercentchange1h',
    '/getpercentchange2h',
    '/getpercentchange3h',
    '/getpercentchange4h',
    '/getrate',
    '/setrate',
    '/getrateshitcoin',
    '/setrateshitcoin',
    'http://192.168.1.111/home',
];

const availableCommandsHelp = [
    '/help',
    '/menu',
];

const availableCommandsCurrency = [
    '/getchange',
];


const menuOptions = [
    [{ text: '@Modèle', callback_data: 'choix1' }],
    [{ text: '@Crypto', callback_data: 'choix2' }],
    [{ text: '@Currency', callback_data: 'choix3' }],
    [{ text: '@Help', callback_data: 'choix4' }],
    [{ text: '@In Progress', callback_data: 'choix5' }],
];

const systemMessages = [
    { role: "system", content: "Je suis un assistant dévoué, spécialisé dans l'art des réponses concises et précises. Je suis principalement là pour vous aider à utiliser les commandes de ce canal Telegram. Toutes les commandes sont répertoriées dans la liste avec le rôle \"system\". Je peux également vous aider à trouver des informations sur les commandes." },
    { role: "system", content: "Vous pouvez taper /help pour voir les commandes disponibles." },
    { role: "system", content: "Vous pouvez taper /getmessages pour voir les messages en mémoire." },
    { role: "system", content: "Vous pouvez taper /clear pour effacer les messages en mémoire." },
    { role: "system", content: "Vous pouvez taper /getprice pour voir le prix du Bitcoin." },
    { role: "system", content: "Vous pouvez taper /getchange pour voir le taux de change." },
    { role: "system", content: "Vous pouvez taper /getpercentchange10mn pour voir le taux de variation sur 10 minutes." },
    { role: "system", content: "Vous pouvez taper /getpercentchange1h pour voir le taux de variation sur 1 heure." },
    { role: "system", content: "Vous pouvez taper /getpercentchange2h pour voir le taux de variation sur 2 heures." },
    { role: "system", content: "Vous pouvez taper /getpercentchange3h pour voir le taux de variation sur 3 heures." },
    { role: "system", content: "Vous pouvez taper /getpercentchange4h pour voir le taux de variation sur 4 heures." },
    { role: "system", content: "Vous pouvez taper /getrate pour voir le taux de surveillance." },
    { role: "system", content: "Vous pouvez taper /setrate pour changer le taux de surveillance." },
    { role: "system", content: "Vous pouvez taper /getmodel pour voir le modèle utilisé." },
    { role: "system", content: "Vous pouvez taper /setmodel pour changer le modèle utilisé." },
    { role: "system", content: "Vous pouvez taper /getlimit pour voir la limite de mémoire." },
    { role: "system", content: "Vous pouvez taper /setlimit pour changer la limite de mémoire." },
    { role: "system", content: "Vous pouvez taper /change={montant} pour voir le taux de change pour un montant donné." },
    { role: "system", content: "Vous pouvez accéder à l'interface web du portfolio à l'adresse http://192.168.1.111/home" },
];

const messages = [
    ...systemMessages
];

const messagesGPT4 = []

const modelOptions = [
    [{ text: 'Modèle: GPT-3', callback_data: 'choix1' }],
    [{ text: 'Modèle: GPT-4', callback_data: 'choix2' }],
];

const limitOptions = [
    [{ text: 'Limite: 3', callback_data: 'choix1' }],
    [{ text: 'Limite: 5', callback_data: 'choix2' }],
    [{ text: 'Limite: 10', callback_data: 'choix3' }],
    [{ text: 'Limite: 15', callback_data: 'choix4' }],
];

const rateOptions = [
    [{ text: 'Taux: 0.01%', callback_data: 'choix1' }],
    [{ text: 'Taux: 0.2%', callback_data: 'choix2' }],
    [{ text: 'Taux: 0.5%', callback_data: 'choix3' }],
    [{ text: 'Taux: 1%', callback_data: 'choix4' }],
];

const rateOptionsShitcoins = [
    [{ text: 'SC-Taux: 0.2%', callback_data: 'choix2' }],
    [{ text: 'SC-Taux: 0.5%', callback_data: 'choix3' }],
    [{ text: 'SC-Taux: 1%', callback_data: 'choix4' }],
    [{ text: 'SC-Taux: 2%', callback_data: 'choix1' }],
    [{ text: 'SC-Taux: 3%', callback_data: 'choix1' }],
];

const portfolio = ['bitcoin', 'ethereum', 'cardano', 'vechain', 'The Graph', 'Internet Computer', 'solana', 'apecoin', 'NEAR Protocol'];

module.exports = {
    availableCommands,
    messages,
    messagesGPT4,
    modelOptions,
    limitOptions,
    rateOptions,
    rateOptionsShitcoins,
    menuOptions,
    availableCommandsGPT,
    availableCommandsCrypto,
    availableCommandsHelp,
    availableCommandsCurrency,
    portfolio,
    systemMessages,
}