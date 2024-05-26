const express = require('express')
const router = express.Router();
const { login, signup, checkUser, getUsers } = require('../controllers/userController');
const { getMessage } = require('../controllers/messageController');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'D:\beginner\chat-app\client\chat-app\src\profiles')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({ storage: storage })


router.post('/login', login);
router.post('/signup', signup);
router.get('/checkUser', upload.single('image'), checkUser);
router.get('/message', getMessage);
router.get('/allFriends', getUsers)
router.get('/logout', (req, res) => { res.clearCookie('accessToken') })



module.exports = router;