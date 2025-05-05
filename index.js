const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = 3000;
const OPENWEATHER_API_KEY = "YOUR_API_KEY_HERE";

// Webhook route for Dialogflow
app.post("/webhook", async (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;
  const city = req.body.queryResult.parameters["geo-city"];
  const date = req.body.queryResult.parameters["date"];

  if (!city) {
    return res.json({ fulfillmentText: "Please provide a city." });
  }

  try {
    if (intentName === "GetCurrentWeather") {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      const weather = response.data.weather[0].description;
      const temp = response.data.main.temp;

      return res.json({
        fulfillmentText: `The current weather in ${city} is ${weather} with a temperature of ${temp}°C.`,
      });

    } else if (intentName === "GetForecastWeather") {
      // If no date provided, default to today
      const forecastDate = date ? new Date(date) : new Date();
      const today = new Date();
      const diffDays = Math.floor(
        (forecastDate - today) / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0 || diffDays > 7) {
        return res.json({
          fulfillmentText:
            "Sorry, I can only provide forecast for up to 8 days from today.",
        });
      }

      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast/daily?q=${city}&cnt=8&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      const forecast = forecastResponse.data.list[diffDays];
      const forecastWeather = forecast.weather[0].description;
      const forecastTemp = forecast.temp.day;

      return res.json({
        fulfillmentText: `The forecast for ${city} on ${forecastDate.toDateString()} is ${forecastWeather} with a temperature of ${forecastTemp}°C.`,
      });
    }

  } catch (error) {
    console.error(error);
    return res.json({
      fulfillmentText: "Sorry, I couldn't fetch the weather information.",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
