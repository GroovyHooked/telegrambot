const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

async function createNumericCurveWithAxes(values) {
    // Make a 500x400 canvas
    const canvas = createCanvas(500, 400);
    //const canvas = createCanvas(500, 200);
    const ctx = canvas.getContext("2d");

    // Set background color
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 500, 400);

    // Set line color and width
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 2;

    // Increased padding values
    const paddingLeft = 70;
    const paddingRight = 70;



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
            ((500 - paddingLeft - paddingRight) / (values.length - 1)) * index;
        const y = verticalShift + (1 - (value.price - minPrice) / yNormalizationFactor) * yScale; // Ajuster la normalisation et ajouter la translation

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

    // Draw x-axis label (time)
    ctx.fillStyle = "#000000";
    ctx.font = "10px sans-serif"; // Smaller font size
    values.forEach((_, index) => {
        const time = values[index].time;
        const x =
            paddingLeft +
            ((500 - paddingLeft - paddingRight) / (values.length - 1)) * index; // Adjust x-coordinate with padding
        if (values.length <= 10) {
            ctx.fillText(`${time}`, x, 340); // Adjust y-coordinate to provide more space
        } else if (values.length > 10) {
            let moduloValue = Number(values.length.toString().split("").shift());
            if (index % moduloValue === 0) {
                const minutes = time.split(":")[1];
                ctx.fillText(
                    `${index === 0 || index === values.length - 1 ? time : minutes}`,
                    x,
                    340
                ); // Adjust y-coordinate to provide more space
            }
        }
    });

    // Draw highest value label
    ctx.fillText(`Max: ${maxPrice}`, 500 - paddingRight, 50);

    // Draw lowest value label
    ctx.fillText(`Min: ${minPrice}`, 500 - paddingRight, 350);

    // Draw date in top-right corner
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1
        }/${currentDate.getFullYear()}`;
    ctx.fillText(formattedDate, 450, 20);

    // Save the canvas to a file
    const outputPath = path.join(__dirname, "graph.png");
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on("finish", () => {
        console.log(`Curve image with axes created and saved as ${outputPath}`);
    });

    return outputPath;
}
module.exports = { createNumericCurveWithAxes };