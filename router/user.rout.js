const router = require('express').Router();

const {demo,register,login,isVarify, logout, getUserById} = require('../controller/user.controller')
const  headerAuth  = require('../middleware/headerAuth')

router.route('/demo').get(demo)
router.route('/register').post(register)
router.route('/login').post(login)
router.route('/logout/:userId').get(logout)
router.route('/:userId').get(getUserById)
// authenticate is a middleware after middleware execution isVarify run
router.route('/isVarify').get(headerAuth,isVarify)




module.exports = router