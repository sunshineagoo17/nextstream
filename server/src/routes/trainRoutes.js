const express = require('express');
const { trainModel } = require('../services/tensorFlowService'); 
const router = express.Router();

router.post('/', async (req, res) => {
  const { userId } = req.body; 

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const model = await trainModel(userId);
    if (!model) {
      return res.status(400).json({ message: 'No interactions found for this user' });
    }
    res.status(200).json({ message: 'Model trained successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while training model' });
  }
});

module.exports = router;