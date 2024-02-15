const express = require('express');
const router =express.Router();
const {demo,createGroup, invite, allGroups,joinGroup,allJoinAndCreated, updateGroup, deleteGroup,groupById,leftGroup}=require("../controller/groups.controller");
const authenticate = require('../middleware/authenticate')


router.route('/demo').post(demo)
router.route('/create').post(authenticate,createGroup)
router.route('/allCreated').get(allGroups)
router.route('/join').post(authenticate,joinGroup)
router.route('/all').get(authenticate,allJoinAndCreated)
router.route('/:id').get(authenticate,groupById)
router.route('/update/:id').put(authenticate,updateGroup)
router.route('/delete/:id').delete(authenticate,deleteGroup)
router.route('/left/:id').delete(authenticate,leftGroup)
router.route('/invite').post(authenticate,invite)

module.exports=router