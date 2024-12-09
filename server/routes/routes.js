const express = require('express')
const router = express.Router();
const { getMessage, getGMessage, deleteMessage } = require('../controllers/messageController');
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
    fileUpload,
    updateUserPhoto,
} = require('../controllers/app')


const refreshToken = (data) => {
    const newAccessToken = jwt.sign({ email: data }, process.env.JWT_SECRET, { expiresIn: '1h' })
    return newAccessToken
}

const checkUser = async (req, res, next) => {
    const accessToken = req.headers['accesstoken'];
    if (!accessToken) return res.status(401).json({ message: 'Unauthorized' });
    const decodedToken = jwt.decode(accessToken);
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
        if (err && err.name === 'TokenExpiredError') {
            const newToken = refreshToken(decodedToken.email)
            return res.status(401).json({ newToken })
        }
        if (err) return res.status(403).json({ message: 'Forbidden' })
        req.user = user.email;
        req.id = user.id;
        next();
    })
}



//Authentication
router.post('/login', login)

//creation of groups and users
router.post('/signup', signup)
router.post('/create-group', checkUser, createGroup)

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
router.put('/editUserProfile', checkUser, updateUserPhoto)
router.put('/editGroupProfile/:group', checkUser, updateGroup)
router.put('/editUser/', checkUser, updateUser)
router.put('/updateGroupProfile/:group', checkUser, updateGroup)
router.post('/addMember', checkUser, addMember)

//file uploads
router.post('/uploadFile', checkUser, fileUpload)

//getting files
router.get('/getFileStream',checkUser)

//default routes
router.get('*', (req, res) => res.send('<h1>This is chat app server</h1>'))
router.post('*', (req, res) => res.send('<h1>This is chat app server</h1>'))



module.exports = router;