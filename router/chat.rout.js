const express = require('express');
const router =express.Router();
const authenticate = require('../middleware/authenticate');
const { getMessages } = require('../controller/chat.controller');


router.get('/getMessages/:groupId', getMessages);




module.exports=router