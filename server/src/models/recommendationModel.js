const tf = require('@tensorflow/tfjs-node');
const { fetchAllInteractions } = require('../services/interactionService');
const path = require('path');
const fs = require('fs');

// Path to save the model
const modelPath = path.join(__dirname, '../models/tensorflow-model');

// Train TensorFlow model based on user interactions and save it for future use
const trainModel = async (userId) => {
  // Fetch the user's interaction data
  const interactions = await fetchAllInteractions(userId);
  
  if (!interactions.length) {
    return null;
  }

  // Prepare input data (media_id and media_type) and output data (interaction)
  const inputData = interactions.map((interaction) => [
    interaction.media_id, 
    interaction.media_type === 'movie' ? 1 : 0
  ]);
  
  const outputData = interactions.map((interaction) => interaction.interaction);

  // Convert to tensors
  const xs = tf.tensor2d(inputData);
  const ys = tf.tensor2d(outputData, [outputData.length, 1]);

  // Create a simple model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, inputShape: [2] }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  
  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });

  // Train the model
  await model.fit(xs, ys, { epochs: 10 });

  // Save the trained model
  await model.save(`file://${modelPath}`);

  return model;
};

// Load the saved model from the file system
const loadModel = async () => {
  if (fs.existsSync(`${modelPath}/model.json`)) {
    const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
    return model;
  } else {
    return null;
  }
};

// Predict user preference for a new media item
const predictUserPreference = async (model, media_id, media_type) => {
  if (!model) return 'No model available';

  const input = tf.tensor2d([[media_id, media_type === 'movie' ? 1 : 0]]);
  const prediction = model.predict(input);
  
  const predictedInteraction = prediction.dataSync()[0]; 
  return predictedInteraction > 0.5 ? 'like' : 'dislike';
};

module.exports = { trainModel, predictUserPreference, loadModel };