(async () => {
    if (typeof tmImage === "undefined") {
        console.error("tmImage is not loaded!");
        return;
    }

    const URL = "https://teachablemachine.withgoogle.com/models/CXOUGlE8z/";

    const images = {
        "Groen": "my_images/Groen.svg",
        "Oranje": "my_images/Oranje.svg",
        "Rood": "my_images/Rood.svg",
        "Neutraal": "my_images/neutraal.svg"
    };

    let model, webcam;
    const confidenceThreshold = 0.9;
    const bufferSize = 5;
    const predictionBuffer = {};
    let currentDetectedClass = null;

    const imageEl = document.getElementById("image-display");
    const predictionEl = document.getElementById("prediction");

    // Startbeeld
    imageEl.src = images["Neutral"];

    webcam = new tmImage.Webcam(400, 300, true);
    await webcam.setup();
    await webcam.play();
    document.getElementById("webcam-container").appendChild(webcam.canvas);

    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    console.log("Model loaded!");

    // Loop
    async function loop() {
        webcam.update();
        await predict();
        requestAnimationFrame(loop);
    }

    // Predict functie
    async function predict() {
        const prediction = await model.predict(webcam.canvas);

        // Hoogste kans
        let highest = prediction.reduce((a, b) =>
            a.probability > b.probability ? a : b
        );

        const className = highest.className;
        const prob = highest.probability;

        // Stabiliteit met buffer
        if (!predictionBuffer[className]) predictionBuffer[className] = [];
        predictionBuffer[className].push(prob);
        if (predictionBuffer[className].length > bufferSize) {
            predictionBuffer[className].shift();
        }

        const avgProb =
            predictionBuffer[className].reduce((a, b) => a + b, 0) /
            predictionBuffer[className].s;

        // Detectie
        if (avgProb >= confidenceThreshold) {
            if (currentDetectedClass !== className) {
                currentDetectedClass = className;

                // SVG wisselen
                imageEl.src = images[className] || images["Neutraal"];

                // Tekst bijwerken
                predictionEl.innerText =
                    `Gedetecteerd: ${className} (${Math.round(avgProb * 100)}%)`;
            }
        } else {
            currentDetectedClass = null;
            imageEl.src = images["Neutraal"];
            predictionEl.innerText = "Geen detectie";
        }
    }

    loop();
})();
