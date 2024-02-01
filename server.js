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

app.post('/updatequantities', async function (req, res) {
  const data = req.body
  data.forEach(async (item) => {
    await dbUpdateQuantity(item.name, item.value)
  })
  res.sendStatus(200)
})

app.post('/graphdata', async function (req, res) {
  console.log('/graphdata');
  const data = req.body
  console.log({data});
  res.sendStatus(200)
})

app.post("*", async (req, res) => {
  res.send(await handler(req));
});

app.get('/home', async function (req, res) {
  const { total } = await retreiveDataFromDb()
  res.render(__dirname + '/front/views/index', { total });
});

app.get('/portfolio', async function (req, res) {
  // setInterval(async () => {
    const { values, total } = await retreiveDataFromDb()
    res.render(__dirname + '/front/views/portfolio', { values, total });
  // }, 15000)
});

app.get('/quantities', async function (req, res) {
  const { total } = await retreiveDataFromDb()
  const data = await dbRequestAllQuantities()
  res.render(__dirname + '/front/views/quantities', { data, total });
});

app.get("*", async (req, res) => {
  res.send(await handler(req));
});


app.listen(PORT, '0.0.0.0', function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});

async function retreiveDataFromDb() {
  const values = []
  let total = 0
  let liquidity = 0
  const [rate,] = await dbRequestExchangeRate()
  const stockPrices = await dbRequestLastpriceAll()
  const quantities = await dbRequestAllQuantities()
  stockPrices.forEach((stockPrice) => {
    let value = 0
    quantities.forEach(quantity => {
      if (stockPrice.name === quantity.name) {
        value = Number(stockPrice.price) * Number(quantity.quantity) * Number(rate.value)
        total += value
        values.push({ name: stockPrice.name, value: value.toFixed(2) })
      }
      if(quantity.name === 'liquidity') {
        liquidity = quantity.quantity
      }
    })
  })
  total += liquidity
  return { values, total: total.toFixed(2) }
}