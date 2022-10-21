const express = require('express');
const createError = require('http-errors');
const morgan = require('morgan');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal')
require('dotenv').config();

const app = express();

const client = new Client({
  puppeteer: { headless: true }, // Make headless true or remove to run browser in background
  authStrategy: new LocalAuth({
    clientId: "client-one"
  })
})

client.initialize();

// Add this after express code but before starting the server

client.on('qr', qr => {
  // NOTE: This event will not be fired if a session is specified.
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true }); // Add this line
  app.get('/getqr', (req, res, next) => {
    res.send({ qr });
  });
});

client.on('authenticated', session => {
  console.log('AUTHENTICATED',)
});

client.on('auth_failure', msg => {
  // Fired if session restore was unsuccessfull
  console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
  console.log('READY');
});

client.on('message', msg => {
  const { from, to, body } = msg
  console.log(from, to, body)
})

app.post('/sendmessage', async (req, res, next) => {
  try {
    const { number, message } = req.body; // Get the body
    const msg = await client.sendMessage(`${number}@c.us`, message); // Send the message
    res.send({ msg }); // Send the response
  } catch (error) {
    next(error);
  }
});

// Listening for the server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
