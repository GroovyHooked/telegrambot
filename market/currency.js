require('dotenv').config();
const axios = require('axios');
// https://currency.getgeoapi.com/documentation/
const API_URL = 'https://api.getgeoapi.com/v2/currency/convert';
let FROM_CURRENCY = 'EUR';
let TO_CURRENCY = 'USD';
let AMOUT = 10;

const params = {
    api_key: process.env.CURRENCY_API_KEY,
    from: FROM_CURRENCY,
    to: TO_CURRENCY,
    amount: AMOUT,
    format: 'json',
};

function exchangeInstance() {
    return {
        async getRawData() {
            try {
                const response = await axios.get(API_URL, { params });
                return response.data;
            } catch (error) {
                console.error(error.message);
                return error.message;
            }
        },
        async getExchangeRate() {
            const temp = params.amount;
            params.amount = 1;
            try {
                const response = await axios.get(API_URL, { params });
                params.amount = temp;
                return exchangeRateFor1(response.data);
            } catch (error) {
                console.error(error.message);
                return error.message;
            }
        },
        async convertToDollar(amount) {
            const temp = params.amount;
            params.amount = amount;
            try {
                const response = await axios.get(API_URL, { params });
                params.amount = temp;
                return exchangeRateInUsd(response.data, amount);
            } catch (error) {
                console.error(error.message);
                return error.message;
            }
        },
        async convertToEuro(amount) {
            const temp = params.amount;
            params.amount = amount;
            params.from = 'USD';
            params.to = 'EUR';
            try {
                const response = await axios.get(API_URL, { params });
                params.amount = temp;
                params.from = 'EUR';
                params.to = 'USD';
                return convertValueInEur(response.data);
            } catch (error) {
                console.error(error.message);
                return error;
            }
        }
    }
}

function exchangeRateFor1(response) {
    const { base_currency_code, rates } = response;
    const { currency_name, rate } = rates.USD;
    const message = `1 ${base_currency_code} = ${rate} ${currency_name}`;
    return message;
}

function exchangeRateInUsd(response, amount) {
    const { base_currency_code, rates } = response;
    const { currency_name, rate_for_amount } = rates.USD;
    const USD = currency_name.split(' ').forEach(word => word[0].toUpperCase() + word.slice(1));
    const message = `${amount} ${base_currency_code} = ${Number(rate_for_amount).toFixed(2)} ${USD}`;
    return message;
}

function convertValueInEur(response) {
    const { rates } = response;
    const { rate_for_amount } = rates.EUR;
    return rate_for_amount;
}


module.exports = {
    exchangeInstance: exchangeInstance(),
}

// Example response:
// {
//     base_currency_code: 'EUR',
//     base_currency_name: 'Euro',
//     amount: '100.0000',
//     updated_date: '2023-12-01',
//     rates: {
//       USD: {
//         currency_name: 'United States dollar',
//         rate: '1.0875',
//         rate_for_amount: '108.7520'
//       }
//     },
//     status: 'success'
//   }