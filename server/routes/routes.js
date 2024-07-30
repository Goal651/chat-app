const express = require('express')
const router = express.Router();
const { login, signup, checkUser, getUsers, getUser, getGroups, getGroup, createGroup, updateUser } = require('../controllers/app')
const { getMessage, getGMessage } = require('../controllers/messageController');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})
const upload = multer({ storage: storage })


//Authentication
router.post('/login', login)
router.get('/checkUser', checkUser)

//creation of groups and users
router.post('/signup', upload.single('image'), signup)
router.post('/create-group', upload.single('photo'), createGroup)

//getting users and groups
router.get('getUserProfile', getUser);
router.get('/getUser/:username', getUser)
router.get('/allFriends', getUsers)
router.get('/allGroups', getGroups);
router.get('/getGroup/:name', getGroup);

//getting messages
router.get('/gmessage/:group', getGMessage)
router.get('/message', getMessage)

//updating user and messages

router.put('/editUser/profile', upload.single('image'), updateUser)


module.exports = router;