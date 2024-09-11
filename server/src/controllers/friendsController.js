const knex = require('../config/db');

exports.getFriends = async (req, res) => {
    const { userId } = req.user;
  
    if (!userId) {
      console.error('Invalid userId:', userId);
      return res.status(400).json({ message: 'Invalid userId' });
    }
  
    try {
      console.log('Fetching friends for userId:', userId);

      const query = knex('friends')
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

      const friends = await query;

      console.log(`Found ${friends.length} friends for userId: ${userId}`);
      res.status(200).json(friends);
    } catch (error) {
      console.error('Error retrieving friends list:', error);
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
        const existingFriendship = await knex('friends')
            .where({
                user_id: userId,
                friend_id: friendId
            })
            .orWhere({
                user_id: friendId,
                friend_id: userId
            })
            .first();

        if (existingFriendship) {
            return res.status(400).json({ message: 'Friendship already exists or pending' });
        }

        await knex('friends').insert({
            user_id: userId,
            friend_id: friendId,
            isAccepted: false
        });

        res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error adding friend:', error);
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
        console.error('Error removing friend:', error);
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
        console.error('Error accepting friend request:', error);
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
        console.error('Error rejecting friend request:', error);
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
        console.error('Error retrieving pending friend requests:', error);
        res.status(500).json({ message: 'Error retrieving pending friend requests', error: error.message });
    }
};

module.exports = exports;