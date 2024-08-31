const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('homepage');             //rendering home page
});

router.get('/userlogin', (req, res) => {
    res.render('userlogin');  
});

router.get('/team', (req, res) => {
    res.render('team');  
});
module.exports = router;