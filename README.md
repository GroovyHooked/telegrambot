# Crypto Bot Project

This project is a Node.js application that utilizes the Telegram API to create a bot. The bot is designed to monitor cryptocurrency price variations and send alerts based on predefined thresholds.

## Key Features

1. **Cryptocurrency Price Alerts:** The bot monitors cryptocurrency prices and sends alerts when prices reach specific thresholds.
2. **OpenAI API Integration:** The bot utilizes the OpenAI API to enhance its interactions with users, providing more natural and engaging responses.
3. **Portfolio Graphical Visualization:** The application incorporates a frontend interface generated with EJS, offering a visual representation of the portfolio. This feature generates graphs for each cryptocurrency present.

## Code Structure

The code is organized into several modules:

- **crypto.js:** Contains the main logic for monitoring cryptocurrency prices and sending alerts. It uses the Modula API to retrieve price data and the `node-cron` library to schedule recurring tasks.
- **fiat.js:** Manages interaction with the exchange API to obtain current exchange rates.
- **database.js:** Contains functions for interacting with the database, including inserting new price data and retrieving alert thresholds.
- **axios.js:** Contains an Axios instance configured to make HTTP requests to different APIs.
- **chart.js:** Contains logic for generating charts from cryptocurrency price data.
