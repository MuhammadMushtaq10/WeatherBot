const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const apiKey = '21ed6f4e019c9d35da806f4a3cae58aa';

app.post("/webhook", async (req, res) => {
    const city = req.body.queryResult.parameters["geo-city"];
    const date = req.body.queryResult.parameters["date"];

    if (!city) {
        return res.json({
            fulfillmentText: "Please provide a city to get the weather information.",
        });
    }

    try {
        if (!date) {
            // Get current weather
            const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
            const response = await axios.get(weatherURL);
            const weather = response.data;

            const message = `The current weather in ${city} is ${weather.weather[0].description} with a temperature of ${weather.main.temp}°C.`;

            return res.json({ fulfillmentText: message });
        } else {
            // Get forecast for up to next 8 days (via One Call API)
            const geoURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
            const geoResponse = await axios.get(geoURL);
            const { lon, lat } = geoResponse.data.coord;

            const forecastURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${apiKey}&units=metric`;
            const forecastResponse = await axios.get(forecastURL);

            // find matching date
            const requestedDate = new Date(date);
            const forecastDay = forecastResponse.data.daily.find(day => {
                const forecastDate = new Date(day.dt * 1000);
                return (
                    forecastDate.getDate() === requestedDate.getDate() &&
                    forecastDate.getMonth() === requestedDate.getMonth()
                );
            });

            if (forecastDay) {
                const message = `The forecast for ${city} on ${requestedDate.toDateString()} is ${forecastDay.weather[0].description} with a temperature of ${forecastDay.temp.day}°C.`;
                return res.json({ fulfillmentText: message });
            } else {
                return res.json({
                    fulfillmentText: `Sorry, I can only provide forecasts for up to 8 days from today.`,
                });
            }
        }
    } catch (error) {
        console.error(error);
        return res.json({
            fulfillmentText: "Sorry, I wasn't able to get the weather information right now.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
