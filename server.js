const express = require("express");
const PORT = process.env.PORT || 4040;
const { handler } = require("./controller/index.js");
const {
  dbRequestAllQuantities,
  dbRequestLastpriceAll,
  dbUpdateQuantity,
  dbRequestExchangeRate,
} = require("./database/database.js");


const app = express();

app.use(express.json());
app.use(express.static('front'));
app.use(express.static('front/img'));
app.set('view engine', 'ejs');

/*************  WEB APP ***************/
app.get('/home', async function (req, res) {
  const { data, total } = await retrieveDataFromDb()
  res.render(__dirname + '/front/views/index', { data, total });
});

app.get('/portfolio', async function (req, res) {
  const { data, total } = await retrieveDataFromDb()
  res.render(__dirname + '/front/views/portfolio', { data, total });
});

app.get('/quantities', async function (req, res) {
  const { total } = await retrieveDataFromDb()
  const data = await dbRequestAllQuantities()
  res.render(__dirname + '/front/views/quantities', { data, total });
});

// SSE to update total balance on home page
let clients = [];
app.get('/total', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

setInterval(async () => {
  const { total } = await retrieveDataFromDb();
  for (const client of clients) {
    try {
      client.write(`data: ${JSON.stringify({ total })}\n\n`);
    } catch (error) {
      console.error({ error });
    }
  }
}, 15000);

// Receive updated Quantities from front to update DB
app.post('/updatequantities', async function (req, res) {
  const data = req.body
  data.forEach(async (item) => {
    await dbUpdateQuantity(item.name, item.value)
  })
  res.sendStatus(200)
})

// Receive asset name from select tag and return it to update graph on home page
// app.post('/graphdata', async function (req, res) {
//   const data = req.body
//   const asset = data.asset
//   res.json({ asset });
// })

/*************  TELEGRAM BOT ***************/
app.get("*", async (req, res) => {
  res.send(await handler(req));
});

app.post("*", async (req, res) => {
  res.send(await handler(req));
});

app.listen(PORT, '0.0.0.0', function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});


/*******************************************/

async function retrieveDataFromDb() {
  const data = []
  let total = 0
  const [rate,] = await dbRequestExchangeRate()
  const [stockPrices, quantities] = await Promise.all([dbRequestLastpriceAll(), dbRequestAllQuantities()]);
  stockPrices.forEach((stockPrice) => {
    const quantity = quantities.find(q => q.name === stockPrice.name);
    if (quantity) {
      const { name, price } = stockPrice;
      const { quantity: stockQuantity } = quantity;
      const value = price * stockQuantity * rate.value;
      data.push({ name, value: value.toFixed(2) });
      total += value;
    }
  })
  const { quantity } = quantities.find(q => q.name === 'liquidity');
  total += quantity
  return { data, total: total.toFixed(2) }
}
