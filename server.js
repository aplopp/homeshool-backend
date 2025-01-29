const express = require('express');
const axios = require('axios');
const cors = require('cors')
const { OpenAI } = require("openai");

require('dotenv').config();

// Create a new instance of the OpenAI configuration with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const app = express();
const allowedOrigins = ['http://localhost:5173', 'https://homeshool.onrender.com'];
app.use(cors({
  origin: function (origin, callback) {
    // Check if the request's origin is in the allowedOrigins array
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

const getCelebrationsForDay = async (datestring) => {
  
  // Make a request to the non-HTTP endpoint
  try {
    const matches = datestring.match(/(\d{2})-(\d{2})-(\d{4})/);
    const urlDatestring = `${ matches[3] }/${ matches[1]}/${ matches[2]}`;
    const apiUrl = `http://calapi.inadiutorium.cz/api/v0/en/calendars/general-en/${ urlDatestring }`;
    const response = await axios.get(apiUrl);
    const celebrations = response.data.celebrations;
    return celebrations;
  } catch (error) {
    console.error('error fetching liturgical day data');
    return {};
  }
}
const PORT = process.env.PORT || 3000;
app.get('/liturgical-calendar/:datestring([0-9]{2}-[0-9]{2}-[0-9]{4})/description', async (req, res) => {
	const datestring = req.params.datestring;
  const celebrations = await getCelebrationsForDay(datestring);
  const prompt = `Given the following liturgical calendar information,`
    + ` write me a two paragraph summary of the day's celebration,`
    + ` suitable for homeschool, ages 6-12: `
    + `${ JSON.stringify(celebrations) }`
    + `\nThen, if possible, briefly share one notable story from the saint's life.`;
    + `\nNo other output. `;
    + `\nIf no saint today, reply "No saint for '${ datestring }`;

  try {
      const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          store: true,
          stream: true,
      });
      let output = "";
      for await (const chunk of stream) {
          process.stdout.write(chunk.choices[0]?.delta?.content || "");
          output += (chunk.choices[0]?.delta?.content || "");
      }
      res.status(200).json(output);
  } catch (error) {
      console.error('Error calling OpenAI API:', error);
      res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
  }
});
// Proxy endpoint
app.get('/liturgical-calendar/:datestring([0-9]{2}-[0-9]{2}-[0-9]{4})', async (req, res) => {
  const datestring = req.params[0];

  try {
    const saint = await getSaintForDay(datestring);
    // Forward the response back to the client
    res.json(saint);
    // res.status(200).send(`http://calapi.inadiutorium.cz/api/v0/en/calendars/general-en/${ requestedEndpoint }`)
  } catch (error) {
    console.error('Error while proxying:', error);
    res.status(500).send('Error proxying request.');
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});