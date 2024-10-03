const express = require('express');
const router =express.Router();
const {demo,addDemand,demands, addDisLikeToDemand, addLikeToDemand}=require("../controller/demand.controller");
const authenticate = require('../middleware/authenticate')


router.route('/demo').get(demo)
router.route('/post').post(authenticate , addDemand)
router.route('/demands/:groupId').get(demands)
router.route('/dislike').post(authenticate,addDisLikeToDemand)
router.route('/like').post(authenticate,addLikeToDemand)


module.exports=router