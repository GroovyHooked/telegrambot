const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

async function createChart(values, assetName) {
    // Make a 500x400 canvas
    const canvas = createCanvas(500, 400);
    //const canvas = createCanvas(500, 200);
    const ctx = canvas.getContext("2d");

    // Set background color
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 500, 400);

    // Set line color and width
    ctx.strokeStyle = "#1B3065";
    ctx.lineWidth = 2;

    // Increased padding values
    const paddingLeft = 10;
    const paddingRight = 10;



    // Find the total range of price values
    const priceValues = values.map(value => value.price);
    const maxPrice = Math.max(...priceValues);
    const minPrice = Math.min(...priceValues);
    const yScale = 150;

    // Calculate normalization factor based on total range
    const yNormalizationFactor = maxPrice - minPrice;

    const verticalShift = 100;

    // Use the normalization factor to calculate Y coordinates with vertical translation
    const points = values.map((value, index) => {
        const x =
            paddingLeft +
            ((500 - paddingLeft - paddingRight) / (values.length - 1)) * (values.length - 1 - index); // Change here
        const y = verticalShift + (1 - (value.price - minPrice) / yNormalizationFactor) * yScale;

        return { x, y };
    });

    // Draw the curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    points.forEach((point, index) => {
        if (index > 0) {
            ctx.lineTo(points[index].x, points[index].y);
        }
    });
    ctx.stroke();

    // Reverse the array of timestamp values
    const reversedTimestamps = values.map((value) => value.timestamp).reverse();

    // Draw x-axis label (time)
    ctx.fillStyle = "#1B3065";
    ctx.font = "14px sans-serif";

    reversedTimestamps.forEach((time, index) => {
        const x =
            paddingLeft +
            ((500 - paddingLeft - paddingRight) / (reversedTimestamps.length - 1)) * index; // Adjust x-coordinate with padding

        let moduloValue = 40
        if (index % moduloValue === 0) {
            ctx.fillText(`${time}`, x, 340); // Adjust y-coordinate to provide more space
        }
    });

    // Draw highest value label
    ctx.fillText(`Max: ${maxPrice.toFixed(2)}`, 240 - paddingRight, 50);

    // Draw lowest value label
    ctx.fillText(`Min: ${minPrice.toFixed(2)}`, 360 - paddingRight, 50);

    // Save the canvas to a file
    const outputPath = path.join(`/var/www/telegramBot/front/img/${assetName}.png`);
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    return outputPath;
}
module.exports = { createChart };