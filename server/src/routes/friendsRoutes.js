const express = require('express');
const authenticate = require('../middleware/authenticate');
const router = express.Router();
const friendsController = require('../controllers/friendsController');

// Send a friend request
router.post('/add', authenticate, friendsController.addFriend);

// Accept a friend request
router.post('/accept', authenticate, friendsController.acceptFriendRequest);

// Get the user's friends list with avatars
router.get('/list', authenticate, friendsController.getFriends);

// Remove a friend
router.delete('/remove', authenticate, friendsController.removeFriend);

// Reject a friend request
router.post('/reject', authenticate, friendsController.rejectFriendRequest);

// Get pending friend requests
router.get('/pending', authenticate, friendsController.getPendingFriendRequests);

module.exports = router;