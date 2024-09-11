const express = require('express');
const knex = require('../config/db');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// Send a message to a friend
router.post('/send', authenticate, async (req, res) => {
    const { friendId, message } = req.body;
    const userId = req.user.userId; // Ensure userId is being retrieved from req.user
  
    // Check if userId and friendId are defined
    if (!userId || !friendId) {
      return res.status(400).json({ message: 'Missing userId or friendId' });
    }
  
    console.log(`userId: ${userId}, friendId: ${friendId}`); // Debug logging
  
    try {
      // Ensure the user is friends with the recipient
      const friendship = await knex('friends')
        .where(function() {
          this.where('user_id', userId).andWhere('friend_id', friendId);
        })
        .orWhere(function() {
          this.where('friend_id', userId).andWhere('user_id', friendId);
        })
        .first();
  
      if (!friendship) {
        return res.status(400).json({ message: 'You are not friends with this user.' });
      }
  
      // Insert the message into the messages table
      await knex('messages').insert({
        sender_id: userId,
        receiver_id: friendId,
        message: message,
        is_read: false,
        created_at: knex.fn.now(),
      });
  
      res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Error sending message' });
    }
  });
  
// Retrieve the message history between two friends
router.get('/history/:friendId', authenticate, async (req, res) => {
    const userId = req.user.userId; 
    const { friendId } = req.params;
  
    console.log("userId:", userId, "friendId:", friendId);
  
    if (!userId || !friendId) {
      return res.status(400).json({ message: 'Missing userId or friendId' });
    }

  try {
    // Ensure the user is friends with the recipient
    const friendship = await knex('friends')
      .where(function() {
        this.where('user_id', userId).andWhere('friend_id', friendId);
      })
      .orWhere(function() {
        this.where('friend_id', userId).andWhere('user_id', friendId);
      })
      .first();

    if (!friendship) {
      return res.status(400).json({ message: 'You are not friends with this user.' });
    }

    // Fetch the message history between the two users
    const messages = await knex('messages')
      .where(function() {
        this.where('sender_id', userId).andWhere('receiver_id', friendId);
      })
      .orWhere(function() {
        this.where('sender_id', friendId).andWhere('receiver_id', userId);
      })
      .orderBy('created_at', 'asc');

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving message history:', error);
    res.status(500).json({ message: 'Error retrieving message history' });
  }
});

// Mark a message as read
router.post('/mark-as-read', authenticate, async (req, res) => {
  const { messageId } = req.body;

  try {
    // Update the message to mark it as read
    await knex('messages')
      .where({ id: messageId })
      .update({ is_read: true });

    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Error marking message as read' });
  }
});

router.post('/mark-all-read/:friendId', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;
  
    try {
      // Ensure the user is friends with the recipient
      const friendship = await knex('friends')
        .where(function() {
          this.where('user_id', userId).andWhere('friend_id', friendId)
        })
        .orWhere(function() {
          this.where('friend_id', userId).andWhere('user_id', friendId)
        })
        .first();
  
      if (!friendship) {
        return res.status(400).json({ message: 'You are not friends with this user.' });
      }
  
      // Mark all messages as read
      await knex('messages')
        .where(function() {
          this.where('sender_id', friendId).andWhere('receiver_id', userId);
        })
        .update({ is_read: true });
  
      res.status(200).json({ message: 'All messages marked as read' });
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      res.status(500).json({ message: 'Error marking all messages as read' });
    }
  });
  
  router.patch('/mark-all-read/:friendId', authenticate, async (req, res) => {
    const userId = req.user.userId; // Make sure this is from req.user set in authentication middleware
    const { friendId } = req.params;
  
    console.log("userId:", userId, "friendId:", friendId); // Debug logging
  
    if (!userId || !friendId) {
      return res.status(400).json({ message: 'Missing userId or friendId' });
    }
  
    try {
      // Update all messages between these users to mark them as read
      await knex('messages')
        .where(function () {
          this.where('sender_id', friendId).andWhere('receiver_id', userId);
        })
        .orWhere(function () {
          this.where('sender_id', userId).andWhere('receiver_id', friendId);
        })
        .update({ is_read: true });
  
      res.status(200).json({ message: 'All messages marked as read' });
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      res.status(500).json({ message: 'Error marking all messages as read' });
    }
  });

// Delete a message by its ID
router.delete('/delete/:messageId', authenticate, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId; 

  try {
    const message = await knex('messages')
      .where({ id: messageId })
      .andWhere(function () {
        this.where('sender_id', userId).orWhere('receiver_id', userId);
      })
      .first();

    if (!message) {
      return res.status(404).json({ message: 'Message not found or you do not have permission to delete this message.' });
    }

    // Delete the message from the database
    await knex('messages')
      .where({ id: messageId })
      .del();

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

module.exports = router;