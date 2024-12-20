const express = require('express');
const knex = require('../config/db');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// Send a message to a friend
router.post('/send', authenticate, async (req, res) => {
    const { friendId, message } = req.body;
    const userId = req.user.userId; 
  
    // Check if userId and friendId are defined
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
      res.status(500).json({ message: 'Error sending message' });
    }
  });
  
// Retrieve the message history between two friends
router.get('/history/:friendId', authenticate, async (req, res) => {
  const userId = req.user.userId; 
  const { friendId } = req.params;

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

    // Fetch the message history and alias sender_id and receiver_id
    const messages = await knex('messages')
      .select('id', 'message', 'sender_id as senderId', 'receiver_id as receiverId', 'is_read', 'created_at')
      .where(function() {
        this.where('sender_id', userId).andWhere('receiver_id', friendId);
      })
      .orWhere(function() {
        this.where('sender_id', friendId).andWhere('receiver_id', userId);
      })
      .orderBy('created_at', 'asc');

    res.status(200).json(messages);
  } catch (error) {
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
      res.status(500).json({ message: 'Error marking all messages as read' });
    }
  });
  
  router.patch('/mark-all-read/:friendId', authenticate, async (req, res) => {
    const userId = req.user.userId; 
    const { friendId } = req.params;
  
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
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Delete all messages between the user and a friend
router.delete('/:friendId/delete-all', authenticate, async (req, res) => {
  const userId = req.user.userId; 
  const { friendId } = req.params;

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

    // Delete all messages between the user and friend
    await knex('messages')
      .where(function() {
        this.where('sender_id', userId).andWhere('receiver_id', friendId);
      })
      .orWhere(function() {
        this.where('sender_id', friendId).andWhere('receiver_id', userId);
      })
      .del();

    res.status(200).json({ message: 'All messages deleted successfully' });
  } catch (error) {
    console.error('Error deleting all messages:', error);
    res.status(500).json({ message: 'Error deleting all messages' });
  }
});

module.exports = router;