const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy endpoint
app.get('/liturgical-calendar/*', async (req, res) => {
  const requestedEndpoint = req.params[0];
  try {
    const apiUrl = `http://calapi.inadiutorium.cz/api/v0/en/calendars/general-en/${ requestedEndpoint }`;
    // Make a request to the non-HTTP endpoint
    const response = await axios.get(apiUrl);
    // Forward the response back to the client
    res.json(response.data);
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