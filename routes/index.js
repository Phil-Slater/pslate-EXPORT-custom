const express = require("express");
const router = express.Router();

const shops = {};

//typeof shops[req.query.shop] !== 'undefined'
router.get('/', async (req, res) => {
    if (shops !== {}) {
        console.log(req.query.shop)
        res.render('index');
    } else {
        res.redirect(`/auth?shop=${req.query.shop}`);
    }
});

router.get('/auth', async (req, res) => {
    const authRoute = await Shopify.Auth.beginAuth(
        req,
        res,
        req.query.shop,
        '/auth/shopify/callback',
        false,
    )
    res.redirect(authRoute);
});

router.get('/auth/shopify/callback', async (req, res) => {
    const shopSession = await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query
    );
    //console.log(shopSession);
    shops[shopSession.shop] = shopSession;
    //console.log(shops);
    res.redirect(`https://${shopSession.shop}/admin/apps/pslate-export`);
});

module.exports = router;
