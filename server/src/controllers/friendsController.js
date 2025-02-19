const knex = require('../config/db');

exports.getFriends = async (req, res) => {
    const { userId } = req.user;
  
    if (!userId) {
      return res.status(400).json({ message: 'Invalid userId' });
    }
  
    try {
  
      // Fetch friends
      const friends = await knex('friends')
        .join('users', function() {
          this.on('friends.friend_id', '=', 'users.id')
            .orOn('friends.user_id', '=', 'users.id');
        })
        .where(function() {
          this.where('friends.user_id', '=', userId)
            .orWhere('friends.friend_id', '=', userId);
        })
        .andWhere('friends.isAccepted', '=', true)
        .whereNot('users.id', '=', userId)
        .select('users.id', 'users.name', 'users.username', 'users.avatar');
  
      // Fetch unread message counts for each friend
      const unreadCounts = await knex('messages')
        .select('sender_id as friendId')
        .count('is_read as unreadCount')
        .where('receiver_id', userId)
        .andWhere('is_read', false)
        .groupBy('sender_id');
  
      // Combine unread counts with friends data
      const friendsWithUnreadCount = friends.map(friend => {
        const unreadCountData = unreadCounts.find(count => count.friendId === friend.id);
        return {
          ...friend,
          unreadCount: unreadCountData ? parseInt(unreadCountData.unreadCount, 10) : 0
        };
      });
  
      res.status(200).json(friendsWithUnreadCount);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving friends list', error: error.message });
    }
  };

  exports.addFriend = async (req, res) => {
    const { userId } = req.user;
    const { friendId } = req.body;

    if (!userId || !friendId) {
        return res.status(400).json({ message: 'Invalid userId or friendId' });
    }

    try {
        const friendExists = await knex('users').where('id', friendId).first();
        if (!friendExists) {
            return res.status(404).json({ message: 'Friend not found' });
        }

        const existingFriendship = await knex('friends')
            .where(function() {
                this.where({ user_id: userId, friend_id: friendId })
                    .orWhere({ user_id: friendId, friend_id: userId });
            })
            .first();

        if (existingFriendship) {
            return res.status(200).json({ message: 'Friend request sent successfully!' });
        }

        await knex('friends').insert({
            user_id: userId,
            friend_id: friendId,
            isAccepted: false
        });

        res.status(200).json({ message: 'Friend request sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding friend', error: error.message });
    }
};

exports.removeFriend = async (req, res) => {
    const { userId } = req.user;
    const { friendId } = req.body;

    if (!userId || !friendId) {
        return res.status(400).json({ message: 'Invalid userId or friendId' });
    }

    try {
        const rowsDeleted = await knex('friends')
            .where({
                user_id: userId,
                friend_id: friendId
            })
            .orWhere({
                user_id: friendId,
                friend_id: userId
            })
            .del();

        if (rowsDeleted === 0) {
            return res.status(404).json({ message: 'Friendship not found' });
        }

        res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing friend', error: error.message });
    }
};

exports.acceptFriendRequest = async (req, res) => {
    const { userId } = req.user;
    const { friendId } = req.body;

    if (!userId || !friendId) {
        return res.status(400).json({ message: 'Invalid userId or friendId' });
    }

    try {
        const updatedRows = await knex('friends')
            .where({
                user_id: friendId,
                friend_id: userId,
                isAccepted: false
            })
            .update({ isAccepted: true });

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Friend request not found or already accepted' });
        }

        res.status(200).json({ message: 'Friend request accepted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting friend request', error: error.message });
    }
};

exports.rejectFriendRequest = async (req, res) => {
    const { userId } = req.user;
    const { friendId } = req.body;

    if (!userId || !friendId) {
        return res.status(400).json({ message: 'Invalid userId or friendId' });
    }

    try {
        const deletedRows = await knex('friends')
            .where({
                user_id: friendId,
                friend_id: userId,
                isAccepted: false
            })
            .del();

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Friend request not found or already processed' });
        }

        res.status(200).json({ message: 'Friend request rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting friend request', error: error.message });
    }
};

exports.getPendingFriendRequests = async (req, res) => {
    const { userId } = req.user;

    if (!userId) {
        return res.status(400).json({ message: 'Invalid userId' });
    }

    try {
        const pendingRequests = await knex('friends')
            .join('users', 'friends.user_id', '=', 'users.id')
            .where({ 'friends.friend_id': userId, 'friends.isAccepted': false })
            .select('users.id', 'users.name', 'users.username', 'users.avatar');

        res.status(200).json(pendingRequests);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving pending friend requests', error: error.message });
    }
};

module.exports = exports;