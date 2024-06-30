const express = require('express')
const router = express.Router();
const { login, signup, checkUser, getUsers, getUser, test, getGroups, getGroup } = require('../controllers/app');
const { getMessage } = require('../controllers/messageController');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})
const upload = multer({ storage: storage })

router.post('/login', login)
router.post('/signup', upload.single('image'), signup)
router.get('/checkUser', checkUser)
router.get('/message', getMessage)
router.get('/allFriends', getUsers)
router.get('getUserProfile', getUser);
router.get('/getUser/:userEmail', getUser)

router.get('/allGroups', getGroups);
router.get('/get-group/name', getGroup)


router.get('/test/', test);


module.exports = router;