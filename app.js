const express = require('express');
const cors = require('cors');
const colored = require('colored.js');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const bodyParser = require('body-parser')
require('dotenv').config();

const app = express();

app.use(cors())
app.use(express.json({type: ['application/json', 'text/plain']}));
app.use(express.urlencoded({extended:true}));
app.use(express.json({limit:'1mb'}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
  console.log(colored.bright_yellow('AUTHENTICATED'),)
});

client.on('auth_failure', msg => {
  // Fired if session restore was unsuccessfull
  console.error(colored.bright_red('AUTHENTICATION FAILURE'), msg);
});

client.on('ready', () => {
  console.log(colored.bright_yellow('READY'));
});

client.on('message', msgs => {
  const { from, to, body } = msgs
  console.log(from, to, body)
})

const sendMedia = (to, file) => {
  const download = "./pdfs/"+file;
  const mediaFile = MessageMedia.fromFilePath(download);
  client.sendMessage(to, mediaFile);
  console.log(colored.bright_green('Archivo enviado'));
  }

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.post('/sendmessage', async (req, res, next) => {
  try {
    const { number, message, media } = req.body; // Get the body
    const msg = await client.sendMessage(number + "@c.us", message); // Send the message
    const data = sendMedia(number + "@c.us", media);
    res.send({ msg, data }); // Send the response
    console.log(colored.bright_green('Mensaje enviado desde post'));
  } catch (error) {
    next(error);
  }
});

// Listening for the server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
