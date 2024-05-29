const express = require('express')
const router = express.Router();
const { login, signup, checkUser, getUsers,test } = require('../controllers/userController');
const { getMessage } = require('../controllers/messageController');
const multer = require('multer');
const path = require('path')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
       
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({ storage: storage })


router.post('/login', login);
router.post('/signup', upload.single('image'),signup);
router.get('/checkUser',  checkUser);
router.get('/message', getMessage);
router.get('/allFriends', getUsers)
router.get('/logout', (req, res) => { res.clearCookie('accessToken') })
router.post('/test',test);


module.exports = router;