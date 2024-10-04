const express = require('express');
const router =express.Router();
const {demo,addDemand,demands, addLikeToDemand, addDislikeToDemand, deleteDemand}=require("../controller/demand.controller");
const authenticate = require('../middleware/authenticate')


router.route('/demo').get(demo)
router.route('/post').post(authenticate , addDemand)
router.route('/demands/:groupId').get(demands)
router.route('/like').post(authenticate,addLikeToDemand)
router.route('/dislike').post(authenticate, addDislikeToDemand)
router.route('/delete').post(authenticate, deleteDemand)


module.exports=router