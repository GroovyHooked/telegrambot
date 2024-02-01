const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

async function createNumericCurveWithAxes(values, assetName) {
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



    // Trouver la plage totale des valeurs de prix
    const priceValues = values.map(value => value.price);
    const maxPrice = Math.max(...priceValues);
    const minPrice = Math.min(...priceValues);
    const yScale = 150;

    // Calculer le facteur de normalisation en fonction de la plage totale
    const yNormalizationFactor = maxPrice - minPrice;

    const verticalShift = 100; // Ajustez cette valeur selon vos besoins

    // Utiliser le facteur de normalisation pour calculer les coordonnées Y avec une translation verticale
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
    ctx.font = "12px sans-serif"; // Smaller font size

    reversedTimestamps.forEach((time, index) => {
        const x =
            paddingLeft +
            ((500 - paddingLeft - paddingRight) / (reversedTimestamps.length - 1)) * index; // Adjust x-coordinate with padding

        if (values.length <= 10) {
            ctx.fillText(`${time}`, x, 340); // Adjust y-coordinate to provide more space
        } else if (values.length > 10) {
            let moduloValue = Number(reversedTimestamps.length.toString().split("").shift());
            if (index % moduloValue === 0) {
                const minutes = time.split(":")[1];
                ctx.fillText(
                    `${index === 0 || index === reversedTimestamps.length - 1 ? time : minutes}`,
                    x,
                    340
                ); // Adjust y-coordinate to provide more space
            }
        }
    });


    // Draw highest value label
    ctx.fillText(`Max: ${maxPrice.toFixed(2)}`, 250 - paddingRight, 50);

    // Draw lowest value label
    ctx.fillText(`Min: ${minPrice.toFixed(2)}`, 350 - paddingRight, 50);

    // Draw date in top-right corner
    // const currentDate = new Date();
    // const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1
    //     }/${currentDate.getFullYear()}`;
    // ctx.fillText(formattedDate, 400, 20);

    // Save the canvas to a file
    const outputPath = path.join(`/var/www/telegramBot/front/img/${assetName}.png`);
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    // out.on("finish", () => {
    //     console.log(`Curve image with axes created and saved as ${outputPath}`);
    // });

    return outputPath;
}
module.exports = { createNumericCurveWithAxes };