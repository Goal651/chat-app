import express, { Request, Response } from 'express'

import controller from '../controller/AppController'
import messageController from '../controller/MessageController'
import checkUser from '../controller/AuthController'


const router = express.Router()



//Authentication
router.post('/login', controller.login)

//creation of groups and users
router.post('/signup', controller.signup)
router.post('/create-group', checkUser, controller.createGroup)

//getting users and groups
router.get('/getUserProfile', checkUser, controller.getUserProfile);
router.get('/getUser/:email', checkUser, controller.getUser)
router.get('/getUsers', checkUser, controller.getUsers)
router.get('/getGroups', checkUser, controller.getGroups);
router.get('/getGroup/:name', checkUser, controller.getGroup);

//getting messages
router.get('/gmessage/:group', checkUser, messageController.getGMessage)
router.get('/message', checkUser, messageController.getMessage)

//updating user,groups and messages
router.put('/editUserProfile', checkUser, controller.updateUserPhoto)
router.put('/editGroupProfile/:group', checkUser, controller.updateGroup)
router.put('/editUser/', checkUser, controller.updateUser)
router.put('/updateGroupProfile/:group', checkUser, controller.updateGroup)
router.post('/addMember', checkUser, controller.addMember)

//file uploads
router.post('/uploadFile', checkUser, controller.fileUpload)


export default router;