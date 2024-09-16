const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');  

// Initialize the NLP manager with English and forceNER option
const manager = new NlpManager({ languages: ['en'], forceNER: true });
const MODEL_PATH = path.resolve(__dirname, '../models/model.nlp');
console.log(`Model path is set to: ${MODEL_PATH}`);

// Train the NLP with some basic intents
async function trainNlp() {
    if (fs.existsSync(MODEL_PATH)) {
        // Load the existing trained model if it exists
        try {
          manager.load(MODEL_PATH);
          console.log(`Loaded pretrained model from ${MODEL_PATH}`);
        } catch (error) {
          console.error(`Failed to load model from ${MODEL_PATH}:`, error);
          // Decide whether to retrain the model or exit
        }
      } else {
    // If the model doesn't exist, add documents and train
    
    // Action
    manager.addDocument('en', 'Can you suggest an action film?', 'recommend_action');
    manager.addDocument('en', 'Can you suggest some action films?', 'recommend_action');
    manager.addDocument('en', 'Can you suggest some action movies?', 'recommend_action');
    manager.addDocument('en', 'Can you suggest an action film?', 'recommend_action');
    manager.addDocument('en', 'Find me an action film', 'recommend_action');
    manager.addDocument('en', 'Find me an action movie', 'recommend_action');
    manager.addDocument('en', 'Give me an action recommendation', 'recommend_action');
    manager.addDocument('en', 'Give me a good action film', 'recommend_action');
    manager.addDocument('en', 'Give me a good action movie', 'recommend_action');
    manager.addDocument('en', 'I want to watch an action film', 'recommend_action');
    manager.addDocument('en', 'I want to watch an action movie', 'recommend_action');
    manager.addDocument('en', 'Recommend an action film', 'recommend_action');
    manager.addDocument('en', 'Recommend an action movie', 'recommend_action');
    manager.addDocument('en', 'Show me action movies', 'recommend_action');
    manager.addDocument('en', 'Show me action films', 'recommend_action');
    manager.addDocument('en', 'Show me some action films', 'recommend_action');
    manager.addDocument('en', 'Show me some action movies', 'recommend_action');
    manager.addDocument('en', 'Suggest an action film', 'recommend_action');
    manager.addDocument('en', 'Suggest an action movie', 'recommend_action');
    manager.addDocument('en', 'What are some good romantic films?', 'recommend_action');
    manager.addDocument('en', 'What are some good action movies?', 'recommend_action');
  
    // Comedy
    manager.addDocument('en', 'Can you suggest a comedy?', 'recommend_comedy');
    manager.addDocument('en', 'Can you suggest a comedy film?', 'recommend_comedy');
    manager.addDocument('en', 'Can you suggest something funny', 'recommend_comedy');
    manager.addDocument('en', 'Find me a funny film', 'recommend_comedy');
    manager.addDocument('en', 'Find me something funny', 'recommend_comedy');
    manager.addDocument('en', 'Find me something hilarious', 'recommend_comedy');
    manager.addDocument('en', 'Give me a comedy recommendation', 'recommend_comedy');
    manager.addDocument('en', 'Give me a good comedy', 'recommend_comedy');
    manager.addDocument('en', 'I want to watch a comedy', 'recommend_comedy');
    manager.addDocument('en', 'I want to watch something funny', 'recommend_comedy');
    manager.addDocument('en', 'Recommend a funny film', 'recommend_comedy');
    manager.addDocument('en', 'Recommend me a comedy movie', 'recommend_comedy');
    manager.addDocument('en', 'Show me funny movies', 'recommend_comedy');
    manager.addDocument('en', 'Show me some funny movies', 'recommend_comedy');
    manager.addDocument('en', 'Suggest a funny movie', 'recommend_comedy');
    manager.addDocument('en', 'What are some good comedies?', 'recommend_comedy');

    // Romance
    manager.addDocument('en', 'Can you suggest a romantic film?', 'recommend_romance');
    manager.addDocument('en', 'Can you suggest a romantic movie?', 'recommend_romance');
    manager.addDocument('en', 'Can you suggest some romantic films?', 'recommend_romance');
    manager.addDocument('en', 'Can you suggest some romantic movies?', 'recommend_romance');
    manager.addDocument('en', 'Can you suggest something romantic', 'recommend_romance');
    manager.addDocument('en', 'Find me a romantic film', 'recommend_romance');
    manager.addDocument('en', 'Find me something lovey-dovey', 'recommend_romance');
    manager.addDocument('en', 'Find me something romantic', 'recommend_romance');
    manager.addDocument('en', 'Give me a romance recommendation', 'recommend_romance');
    manager.addDocument('en', 'Give me a romantic recommendation', 'recommend_romance');
    manager.addDocument('en', 'Give me a good romantic film', 'recommend_romance');
    manager.addDocument('en', 'Give me a good romantic movie', 'recommend_romance');
    manager.addDocument('en', 'I want to watch a romance film', 'recommend_romance');
    manager.addDocument('en', 'I want to watch a romance movie', 'recommend_romance');
    manager.addDocument('en', 'I want to watch something romantic', 'recommend_romance');
    manager.addDocument('en', 'Recommend a romance film', 'recommend_romance');
    manager.addDocument('en', 'Recommend a romance movie', 'recommend_romance');
    manager.addDocument('en', 'Recommend a romantic film', 'recommend_romance');
    manager.addDocument('en', 'Recommend a romantic movie', 'recommend_romance');
    manager.addDocument('en', 'Recommend me a romance film', 'recommend_romance');
    manager.addDocument('en', 'Recommend me a romance movie', 'recommend_romance');
    manager.addDocument('en', 'Recommend me a romantic film', 'recommend_romance');
    manager.addDocument('en', 'Recommend me a romantic movie', 'recommend_romance');
    manager.addDocument('en', 'Romantic film?', 'recommend_romance');
    manager.addDocument('en', 'Romantic movie?', 'recommend_romance');
    manager.addDocument('en', 'Show me romantic films', 'recommend_romance');
    manager.addDocument('en', 'Show me romantic movies', 'recommend_romance');
    manager.addDocument('en', 'Show me some romantic films', 'recommend_romance');
    manager.addDocument('en', 'Show me some romantic movies', 'recommend_romance');
    manager.addDocument('en', 'Suggest a romance movie', 'recommend_romance');
    manager.addDocument('en', 'Suggest a romantic film', 'recommend_romance');
    manager.addDocument('en', 'Suggest a romantic movie', 'recommend_romance');
    manager.addDocument('en', 'What are some good romance films?', 'recommend_romance');
    manager.addDocument('en', 'What are some good romance movies?', 'recommend_romance');
    manager.addDocument('en', 'What are some good romantic films?', 'recommend_romance');
    manager.addDocument('en', 'What are some good romantic movies?', 'recommend_romance');

    // Rom-coms
    manager.addDocument('en', 'Can you suggest a rom-com?', 'recommend_romcom');
    manager.addDocument('en', 'Can you suggest some rom-coms?', 'recommend_romcom');
    manager.addDocument('en', 'Can you suggest a rom-com film?', 'recommend_romcom');
    manager.addDocument('en', 'Find me a rom-com film', 'recommend_romcom');
    manager.addDocument('en', 'Find me a rom-com movie', 'recommend_romcom');
    manager.addDocument('en', 'Find me rom-com films', 'recommend_romcom');
    manager.addDocument('en', 'Find me rom-com movies', 'recommend_romcom');
    manager.addDocument('en', 'Find me rom-coms', 'recommend_romcom');
    manager.addDocument('en', 'Give me a rom-com', 'recommend_romcom');
    manager.addDocument('en', 'Give me a rom-com film', 'recommend_romcom');
    manager.addDocument('en', 'Give me a rom-com movie', 'recommend_romcom');
    manager.addDocument('en', 'Give me a good rom-com film', 'recommend_romcom');
    manager.addDocument('en', 'Give me a good rom-com movie', 'recommend_romcom');
    manager.addDocument('en', 'I want to watch a rom-com film', 'recommend_romcom');
    manager.addDocument('en', 'I want to watch a rom-com movie', 'recommend_romcom');
    manager.addDocument('en', 'Recommend a rom-com film', 'recommend_romcom');
    manager.addDocument('en', 'Recommend a rom-com movie', 'recommend_romcom');
    manager.addDocument('en', 'Recommend me a rom-com film', 'recommend_romcom');
    manager.addDocument('en', 'Recommend me a rom-com movie', 'recommend_romcom');
    manager.addDocument('en', 'Recommend rom-com films', 'recommend_romcom');
    manager.addDocument('en', 'Recommend rom-com movies', 'recommend_romcom');
    manager.addDocument('en', 'Recommend some rom-com films', 'recommend_romcom');
    manager.addDocument('en', 'Recommend some rom-com movies', 'recommend_romcom');
    manager.addDocument('en', 'Rom-com films?', 'recommend_romcom');
    manager.addDocument('en', 'Rom-coms movies?', 'recommend_romcom');
    manager.addDocument('en', 'Rom-coms?', 'recommend_romcom');
    manager.addDocument('en', 'Show me rom-com films', 'recommend_romcom');
    manager.addDocument('en', 'Show me rom-com movies', 'recommend_romcom');
    manager.addDocument('en', 'Show me rom-com movies', 'recommend_romcom');
    manager.addDocument('en', 'Show me some rom-com films', 'recommend_romcom');
    manager.addDocument('en', 'Show me some rom-com movies', 'recommend_romcom');
    manager.addDocument('en', 'Suggest a rom-com film', 'recommend_romcom');
    manager.addDocument('en', 'Suggest a rom-com movie', 'recommend_romcom');
    manager.addDocument('en', 'Suggest some rom-com films', 'recommend_romcom');
    manager.addDocument('en', 'Suggest some rom-com movies', 'recommend_romcom');
    manager.addDocument('en', 'What are some good rom-com films?', 'recommend_romcom');
    manager.addDocument('en', 'What are some good rom-com movies?', 'recommend_romcom');

    // Thriller
    manager.addDocument('en', 'Can you suggest a thriller?', 'recommend_thriller');
    manager.addDocument('en', 'Can you suggest a horror film?', 'recommend_thriller');
    manager.addDocument('en', 'Can you suggest a scary film?', 'recommend_thriller');
    manager.addDocument('en', 'Can you suggest a thriller film?', 'recommend_thriller');
    manager.addDocument('en', 'Can you suggest something scary?', 'recommend_thriller');
    manager.addDocument('en', 'Find me a scary film', 'recommend_thriller');
    manager.addDocument('en', 'Find me a horror film', 'recommend_thriller');
    manager.addDocument('en', 'Find me something scary', 'recommend_thriller');
    manager.addDocument('en', 'Find me something horrific', 'recommend_thriller');
    manager.addDocument('en', 'Give me a horror recommendation', 'recommend_thriller');
    manager.addDocument('en', 'Give me a thriller recommendation', 'recommend_thriller');
    manager.addDocument('en', 'Give me a good horror', 'recommend_thriller');
    manager.addDocument('en', 'I want to watch a horror film', 'recommend_thriller');
    manager.addDocument('en', 'I want to watch something scary', 'recommend_thriller');
    manager.addDocument('en', 'Recommend a horror film', 'recommend_thriller');
    manager.addDocument('en', 'Recommend a scary film', 'recommend_thriller');
    manager.addDocument('en', 'Recommend a thriller film', 'recommend_thriller');
    manager.addDocument('en', 'Recommend me a horror movie', 'recommend_thriller');
    manager.addDocument('en', 'Recommend me a scary movie', 'recommend_thriller');
    manager.addDocument('en', 'Recommend me a thriller movie', 'recommend_thriller');
    manager.addDocument('en', 'Show me a horror movie', 'recommend_thriller');
    manager.addDocument('en', 'Show me a scary movie', 'recommend_thriller');
    manager.addDocument('en', 'Show me a thriller movie', 'recommend_thriller');
    manager.addDocument('en', 'Show me some horror movies', 'recommend_thriller');
    manager.addDocument('en', 'Show me some scary movies', 'recommend_thriller');
    manager.addDocument('en', 'Show me some thriller movies', 'recommend_thriller');
    manager.addDocument('en', 'Suggest a horror movie', 'recommend_thriller');
    manager.addDocument('en', 'Suggest a scary movie', 'recommend_thriller');
    manager.addDocument('en', 'What are some good horror films?', 'recommend_thriller');
    manager.addDocument('en', 'What are some good scary films?', 'recommend_thriller');
    manager.addDocument('en', 'What are some good thriller films?', 'recommend_thriller');
    manager.addDocument('en', 'What are some good thrillers?', 'recommend_thriller');

    // Add responses for the intents
    manager.addAnswer('en', 'recommend_action', 'I can recommend some action films for you!');
    manager.addAnswer('en', 'recommend_comedy', 'I can recommend some comedy movies for you!');
    manager.addAnswer('en', 'recommend_romance', 'I can recommend some romantic films for you!');
    manager.addAnswer('en', 'recommend_romcom', 'I can recommend some romcom films for you!');
    manager.addAnswer('en', 'recommend_thriller', 'I can recommend some thriller movies for you!');
 
    // Train and save the model
    await manager.train();
    manager.save(MODEL_PATH);
    console.log('NLP training completed and model saved');
  }
}

// Process input and match with intents
async function processInput(text) {
  try {
    // Use the NLP manager to process the input and get the response
    const response = await manager.process('en', text);

     // Log the detected intent and confidence
     console.log('Detected Intent:', response.intent);
     console.log('Detected Confidence:', response.score);
    
    // Return the response containing the intent and answer
    return {
      intent: response.intent,
      answer: response.answer || "I didn't quite get that. Can you please rephrase?",
    };
  } catch (error) {
    console.error('Error processing input:', error);
    throw new Error('Failed to process input');
  }
}

module.exports = { trainNlp, processInput };