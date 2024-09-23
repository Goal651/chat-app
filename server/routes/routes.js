const express = require('express')
const router = express.Router();
const { getMessage, getGMessage, deleteMessage, getSingleMessage, getSingleGMessage } = require('../controllers/messageController');
const multer = require('multer');
const jwt = require('jsonwebtoken')
const {
    login,
    signup,
    getUsers,
    getUser,
    getGroups,
    getGroup,
    createGroup,
    updateUser,
    updateGroup,
    getUserProfile,
    addMember,
    fileUpload
} = require('../controllers/app')


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/photo/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})
const upload = multer({ storage: storage })

const refreshToken = (data) => {
    const newAccessToken = jwt.sign({ email: data }, process.env.JWT_SECRET, { expiresIn: '1h' })
    return newAccessToken
}

const checkUser = async (req, res, next) => {
    const accessToken = req.headers['accesstoken'];
    if (!accessToken) return res.sendStatus(401);
    const decodedToken = jwt.decode(accessToken);
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
        if (err && err.name === 'TokenExpiredError') {
            const newAccessToken = refreshToken(decodedToken.email)
            return res.status(401).json({ newToken: newAccessToken })
        }
        if (err) return res.sendStatus(403);
        req.user = user.email;
        req.id = user.id;
        next();
    })
}



//Authentication
router.post('/login', login)
router.get('/', (req,res)=>{
    res.sendStatus(200)
})

//creation of groups and users
router.post('/signup', upload.single('image'), signup)
router.post('/create-group', checkUser, upload.single('photo'), createGroup)

//getting users and groups
router.get('/getUserProfile', checkUser, getUserProfile);
router.get('/getUser/:email', checkUser, getUser)
router.get('/allFriends', checkUser, getUsers)
router.get('/allGroups', checkUser, getGroups);
router.get('/getGroup/:name', checkUser, getGroup);

//getting messages
router.get('/gmessage/:group', checkUser, getGMessage)
router.get('/message', checkUser, getMessage)
router.delete('/deleteMessage/:id', checkUser, deleteMessage)

//updating user,groups and messages
router.put('/editUser/profile', checkUser, upload.single('image'), updateUser)
router.put('/updateGroupProfile/:group', checkUser, upload.single('image'), updateGroup)
router.post('/addMember', checkUser, addMember)

//file uploads
router.post('/uploadFile', checkUser, fileUpload)
router.get('/dmFile/:fileId',checkUser,getSingleMessage)
router.get('/groupFile/:fileId',checkUser,getSingleGMessage)

module.exports = router;