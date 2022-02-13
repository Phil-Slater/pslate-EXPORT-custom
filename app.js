const express = require('express');
const mustacheExpress = require('mustache-express');
const logger = require('morgan');
const debug = require('debug')('pslateexport:server');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Shopify } = require('@shopify/shopify-api');
require('dotenv').config();


const port = 3000;
app.set('port', port);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

app.engine('mustache', mustacheExpress('./views/partials', '.mustache'));
app.set('views', './views');
app.set('view engine', 'mustache');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_API_SCOPES, HOST } = process.env

Shopify.Context.initialize({
    API_KEY: SHOPIFY_API_KEY,
    API_SECRET_KEY: SHOPIFY_API_SECRET,
    SCOPES: SHOPIFY_API_SCOPES,
    HOST_NAME: HOST.replace(/https:\/\//, ""),
    IS_EMBEDDED_APP: true,
});

//const createApp = require('@shopify/shopify-api');
// const app = createApp({
//     apiKey: SHOPIFY_API_KEY,
//     host: HOST
// });
const shops = {};


// ROUTES
//app.use("/", require('./routes/index.js'));
app.use("/orders", require('./routes/orders.js'))

app.get('/', async (req, res) => {
    if (shops !== {}) {
        console.log(req.query.shop)
        res.send('hello world!!');
    } else {
        res.redirect(`/auth?shop=${req.query.shop}`);
    }
});

app.get('/auth', async (req, res) => {
    const authRoute = await Shopify.Auth.beginAuth(
        req,
        res,
        req.query.shop,
        '/auth/shopify/callback',
        false,
    )
    res.redirect(authRoute);
});

app.get('/auth/shopify/callback', async (req, res) => {
    const shopSession = await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query
    );
    console.log(shopSession);
    shops[shopSession.shop] = shopSession;
    console.log(shops);
    res.redirect(`https://${shopSession.shop}/admin/apps/pslate-export`);
});


// error handler
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
        //break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
        //break;
        default:
            throw error;
    }
}

// console server logging
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
