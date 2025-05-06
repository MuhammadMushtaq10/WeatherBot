const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const apiKey = '21ed6f4e019c9d35da806f4a3cae58aa';

app.post("/webhook", async (req, res) => {
    const city = req.body.queryResult.parameters["city"] || req.body.queryResult.parameters["geo-city"];
    const date = req.body.queryResult.parameters["date"];

    console.log("Incoming request...");
    console.log("City:", city);
    console.log("Date:", date);

    if (!city) {
        console.log("No city provided.");
        return res.json({
            fulfillmentText: "Please provide a city to get the weather information.",
        });
    }

    try {
        if (!date) {
            // Current weather
            const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
            console.log("Fetching current weather from:", weatherURL);

            const response = await axios.get(weatherURL);
            const weather = response.data;
            const message = `The current weather in ${city} is ${weather.weather[0].description} with a temperature of ${weather.main.temp}°C.`;

            console.log("Responding with:", message);
            return res.json({ fulfillmentText: message });

        } else {
            // Forecasted weather using /forecast endpoint
            const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
            console.log("Fetching forecast from:", forecastURL);

            const forecastResponse = await axios.get(forecastURL);
            const forecastList = forecastResponse.data.list;

            const requestedDate = new Date(date);
            console.log("Requested Date:", requestedDate.toDateString());

            // Find closest forecast entry for the requested date (around midday if possible)
            const matchingForecast = forecastList.find(item => {
                const forecastDate = new Date(item.dt * 1000);
                return (
                    forecastDate.getUTCFullYear() === requestedDate.getUTCFullYear() &&
                    forecastDate.getUTCMonth() === requestedDate.getUTCMonth() &&
                    forecastDate.getUTCDate() === requestedDate.getUTCDate() &&
                    forecastDate.getUTCHours() === 12 // around midday
                );
            });

            if (matchingForecast) {
                const message = `The forecast for ${city} on ${requestedDate.toDateString()} is ${matchingForecast.weather[0].description} with a temperature of ${matchingForecast.main.temp}°C.`;
                console.log("Responding with:", message);
                return res.json({ fulfillmentText: message });
            } else {
                const noDataMsg = `Sorry, I couldn't find a forecast for ${city} on ${requestedDate.toDateString()}. I can only provide forecasts up to 5 days ahead in 3-hour intervals.`;
                console.log("No matching forecast found.");
                return res.json({ fulfillmentText: noDataMsg });
            }
        }

    } catch (error) {
        console.error("Error occurred:", error.message);
        return res.json({
            fulfillmentText: "Sorry, I wasn't able to get the weather information right now.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
