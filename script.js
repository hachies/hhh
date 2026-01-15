(async () => {
    const URL = "https://teachablemachine.withgoogle.com/models/r4DrUzOYJ/";

    const images = {
        "Groen": "my_images/Groen.svg",
        "Oranje": "my_images/Oranje.svg",
        "Rood": "my_images/Rood.svg",
        "Neutraal": "my_images/neutraal.svg"
    };

    let model, webcam;
    let isLocked = false;
    let isStarted = false;

    const confidenceThreshold = 0.7;
    const bufferSize = 5;
    const predictionBuffer = {};

    const imageEl = document.getElementById("image-display");
    const predictionEl = document.getElementById("prediction");
    const startBtn = document.getElementById("start-btn");
    const resetBtn = document.getElementById("reset-btn");

    imageEl.src = images["Neutraal"];

    webcam = new tmImage.Webcam(400, 300, true);
    await webcam.setup();
    await webcam.play();
    document.getElementById("webcam-container").appendChild(webcam.canvas);

    model = await tmImage.load(URL + "model.json", URL + "metadata.json");

    async function loop() {
        if (isStarted && !isLocked) {
            webcam.update();
            await predict();
        }
        requestAnimationFrame(loop);
    }

    async function predict() {
        const predictions = await model.predict(webcam.canvas);

        let highest = predictions.reduce((a, b) =>
            a.probability > b.probability ? a : b
        );

        const className = highest.className;
        const prob = highest.probability;

        if (!predictionBuffer[className]) {
            predictionBuffer[className] = [];
        }

        predictionBuffer[className].push(prob);
        if (predictionBuffer[className].length > bufferSize) {
            predictionBuffer[className].shift();
        }

        const avgProb =
            predictionBuffer[className].reduce((a, b) => a + b, 0) /
            predictionBuffer[className].length;

        if (avgProb >= confidenceThreshold && className !== "Neutraal") {
            isLocked = true;

            imageEl.src = images[className];
            predictionEl.innerText = `Ik voel me: ${className}`;

            startBtn.style.display = "none";
            resetBtn.style.display = "block";
        }
    }

    startBtn.addEventListener("click", () => {
        isStarted = true;
        isLocked = false;

        for (let key in predictionBuffer) {
            predictionBuffer[key] = [];
        }

        predictionEl.innerText = "Houd een kaart voor de camera";
        startBtn.style.display = "none";
    });

    resetBtn.addEventListener("click", () => {
        isStarted = false;
        isLocked = false;

        for (let key in predictionBuffer) {
            predictionBuffer[key] = [];
        }

        imageEl.src = images["Neutraal"];
        predictionEl.innerText = "Druk op start";

        resetBtn.style.display = "none";
        startBtn.style.display = "block";
    });

    loop();
})();
