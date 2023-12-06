const { handleMessage } = require("./lib/Telegram");

async function handler(req, res) {
    const { body } = req;
    
    if(body){
      const messageObj = req.body.message;
      await handleMessage(messageObj);
    }
    return
}

module.exports = { handler };