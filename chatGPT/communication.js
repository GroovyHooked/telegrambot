require("dotenv").config();

const sendMessagetoGpt = async (messages, model, temperature = 0, max_tokens = 500) => {
    //console.log({ messages, model, temperature, max_tokens })
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens
            }),
        });
        const data = await response.json();
        //console.log({ data });
        const text = data.choices[0].message.content;
        return text;
    } catch (error) {
        console.error(error);
        return "An error occurred";
    }
};


module.exports = { sendMessagetoGpt };