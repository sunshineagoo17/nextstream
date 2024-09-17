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
          throw new Error('Failed to load existing model');
        }
      } else {
         // If no model exists, train a new one
        console.log('Training new NLP model...');
    
    // Training Data
    
    // Action Movies
    manager.addDocument('en', 'Action', 'recommend_action');
    manager.addDocument('en', 'Action film', 'recommend_action');
    manager.addDocument('en', 'Action movie', 'recommend_action');
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

    // Action Shows
    manager.addDocument('en', 'Action series', 'recommend_action_tv');
    manager.addDocument('en', 'Action shows', 'recommend_action_tv');
    manager.addDocument('en', 'Action tv show', 'recommend_action_tv');
    manager.addDocument('en', 'Can you suggest an action show?', 'recommend_action_tv');
    manager.addDocument('en', 'Can you suggest some action shows?', 'recommend_action_tv');
    manager.addDocument('en', 'Can you suggest action shows?', 'recommend_action_tv');
    manager.addDocument('en', 'Can you suggest an action show?', 'recommend_action_tv');
    manager.addDocument('en', 'Find me an action show', 'recommend_action_tv');
    manager.addDocument('en', 'Give me an action show', 'recommend_action_tv');
    manager.addDocument('en', 'Give me a good action show', 'recommend_action_tv');
    manager.addDocument('en', 'I want to watch an action show', 'recommend_action_tv');
    manager.addDocument('en', 'Recommend an action show', 'recommend_action_tv');
    manager.addDocument('en', 'Recommend an action tv show', 'recommend_action_tv');
    manager.addDocument('en', 'Show me action shows', 'recommend_action_tv');
    manager.addDocument('en', 'Show me some action shows', 'recommend_action_tv');
    manager.addDocument('en', 'Suggest action shows', 'recommend_action_tv');
    manager.addDocument('en', 'Suggest an action show', 'recommend_action_tv');
    manager.addDocument('en', 'What are some good action shows?', 'recommend_action_tv');
  
    // Comedy Movies
    manager.addDocument('en', 'Comedy', 'recommend_comedy');
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

    // Comedy Shows
    manager.addDocument('en', 'Comedy series', 'recommend_comedy_tv');
    manager.addDocument('en', 'Comedy show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Comedy shows', 'recommend_comedy_tv');
    manager.addDocument('en', 'Comedy tv show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Can you suggest a comedy show?', 'recommend_comedy_tv');
    manager.addDocument('en', 'Can you suggest comedy shows?', 'recommend_comedy_tv');
    manager.addDocument('en', 'Can you suggest some comedy shows?', 'recommend_comedy_tv');
    manager.addDocument('en', 'Find me a comedy show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Funny series', 'recommend_comedy_tv');
    manager.addDocument('en', 'Funny show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Funny shows', 'recommend_comedy_tv');
    manager.addDocument('en', 'Give me a comedy show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Give me a funny show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Give me a good funny show', 'recommend_comedy_tv');
    manager.addDocument('en', 'I want to watch a comedy show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Recommend a comedy show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Recommend a comedy tv show', 'recommend_comedy_tv');
    manager.addDocument('en', 'Show me comedy shows', 'recommend_comedy_tv');
    manager.addDocument('en', 'Show me some comedy shows', 'recommend_comedy_tv');
    manager.addDocument('en', 'Suggest comedy shows', 'recommend_comedy_tv');
    manager.addDocument('en', 'Suggest a comedy show', 'recommend_comedy_tv');
    manager.addDocument('en', 'What are some good comedy shows?', 'recommend_comedy_tv');

    // Romance Movies
    manager.addDocument('en', 'Romance', 'recommend_romance');
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

    // Romance Shows
    manager.addDocument('en', 'Romantic series', 'recommend_romance_tv');
    manager.addDocument('en', 'Romantic show', 'recommend_romance_tv');
    manager.addDocument('en', 'Romantic shows', 'recommend_romance_tv');
    manager.addDocument('en', 'Romantic tv show', 'recommend_romance_tv');
    manager.addDocument('en', 'Romance series', 'recommend_romance_tv');
    manager.addDocument('en', 'Romance show', 'recommend_romance_tv');
    manager.addDocument('en', 'Romance shows', 'recommend_romance_tv');
    manager.addDocument('en', 'Romance tv', 'recommend_romance_tv');
    manager.addDocument('en', 'Romance tv show', 'recommend_romance_tv');
    manager.addDocument('en', 'Can you suggest a romantic show?', 'recommend_romance_tv');
    manager.addDocument('en', 'Can you suggest romantic shows?', 'recommend_romance_tv');
    manager.addDocument('en', 'Can you suggest some romantic shows?', 'recommend_romance_tv');
    manager.addDocument('en', 'Find me a romance show', 'recommend_romance_tv');
    manager.addDocument('en', 'Give me a romance show', 'recommend_romance_tv');
    manager.addDocument('en', 'Give me a romantic show', 'recommend_romance_tv');
    manager.addDocument('en', 'Give me a good romance show', 'recommend_romance_tv');
    manager.addDocument('en', 'I want to watch a romance show', 'recommend_romance_tv');
    manager.addDocument('en', 'Recommend a romance show', 'recommend_romance_tv');
    manager.addDocument('en', 'Recommend a romance tv show', 'recommend_romance_tv');
    manager.addDocument('en', 'Show me romance shows', 'recommend_romance_tv');
    manager.addDocument('en', 'Show me some romance shows', 'recommend_romance_tv');
    manager.addDocument('en', 'Suggest romantic shows', 'recommend_romance_tv');
    manager.addDocument('en', 'Suggest a romantic show', 'recommend_romance_tv');
    manager.addDocument('en', 'What are some good romance shows?', 'recommend_romance_tv');

    // Rom-com Movies
    manager.addDocument('en', 'Rom-com', 'recommend_romcom');
    manager.addDocument('en', 'Rom com', 'recommend_romcom');
    manager.addDocument('en', 'Romcom', 'recommend_romcom');
    manager.addDocument('en', 'Romance comedy', 'recommend_romcom');
    manager.addDocument('en', 'Romantic comedy', 'recommend_romcom');
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

    // Rom-com Shows
    manager.addDocument('en', 'Rom com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom com series', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom com tv', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom-com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom-com series', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom-com tv', 'recommend_romcom_tv');
    manager.addDocument('en', 'Romcom show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Romcom shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Romcom series', 'recommend_romcom_tv');
    manager.addDocument('en', 'Romcom tv', 'recommend_romcom_tv');
    manager.addDocument('en', 'Can you suggest a rom-com show?', 'recommend_romcom_tv');
    manager.addDocument('en', 'Can you suggest some rom-coms shows?', 'recommend_romcom_tv');
    manager.addDocument('en', 'Can you suggest a rom-com show?', 'recommend_romcom_tv');
    manager.addDocument('en', 'Find me a rom-com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Find me rom-com series', 'recommend_romcom_tv');
    manager.addDocument('en', 'Find me rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Give me a rom-com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Give me rom-com series', 'recommend_romcom_tv');
    manager.addDocument('en', 'I want to watch a rom-com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'I want to watch rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Recommend a rom-com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Recommend me a rom-com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Recommend me rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Recommend rom-com series', 'recommend_romcom_tv');
    manager.addDocument('en', 'Recommend rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Recommend some rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Recommend some rom-com series', 'recommend_romcom_tv');
    manager.addDocument('en', 'Show me rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Show me rom-com series', 'recommend_romcom_tv');
    manager.addDocument('en', 'Suggest a rom-com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Suggest rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Suggest some rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'What are some good rom-com series?', 'recommend_romcom_tv');
    manager.addDocument('en', 'What are some good rom-com shows?', 'recommend_romcom_tv');

    // Thriller Movies
    manager.addDocument('en', 'Thriller', 'recommend_thriller');
    manager.addDocument('en', 'Thriller film', 'recommend_thriller');
    manager.addDocument('en', 'Thriller movie', 'recommend_thriller');
    manager.addDocument('en', 'Find me a thriller film', 'recommend_thriller');
    manager.addDocument('en', 'Can you suggest a thriller film?', 'recommend_thriller');
    manager.addDocument('en', 'Find me a thriller film', 'recommend_thriller');
    manager.addDocument('en', 'Find me a thriller movie', 'recommend_thriller');
    manager.addDocument('en', 'Find me something thrilling', 'recommend_thriller');
    manager.addDocument('en', 'Give me a thriller recommendation', 'recommend_thriller');
    manager.addDocument('en', 'Give me a good thriller', 'recommend_thriller');
    manager.addDocument('en', 'I want to watch a thriller film', 'recommend_thriller');
    manager.addDocument('en', 'Recommend a thriller film', 'recommend_thriller');
    manager.addDocument('en', 'Recommend a thriller film', 'recommend_thriller');
    manager.addDocument('en', 'Recommend me a thriller movie', 'recommend_thriller');
    manager.addDocument('en', 'Show me a thriller movie', 'recommend_thriller');
    manager.addDocument('en', 'Show me some thriller movies', 'recommend_thriller');
    manager.addDocument('en', 'Suggest a thriller movie', 'recommend_thriller');
    manager.addDocument('en', 'What are some good thriller films?', 'recommend_thriller');
    manager.addDocument('en', 'What are some good thrillers?', 'recommend_thriller');

    // Thriller Movies
    manager.addDocument('en', 'Thriller series', 'recommend_thriller_tv');
    manager.addDocument('en', 'Thriller show', 'recommend_thriller_tv');
    manager.addDocument('en', 'Thriller tv', 'recommend_thriller_tv');
    manager.addDocument('en', 'Find me a thriller show', 'recommend_thriller_tv');
    manager.addDocument('en', 'Can you suggest a thriller show?', 'recommend_thriller_tv');
    manager.addDocument('en', 'Find me a thriller show', 'recommend_thriller_tv');
    manager.addDocument('en', 'Find me some thrilling tv', 'recommend_thriller_tv');
    manager.addDocument('en', 'Give me a thriller show recommendation', 'recommend_thriller_tv');
    manager.addDocument('en', 'Give me a good thriller show', 'recommend_thriller_tv');
    manager.addDocument('en', 'I want to watch a thriller show', 'recommend_thriller_tv');
    manager.addDocument('en', 'Recommend a thriller show', 'recommend_thriller_tv');
    manager.addDocument('en', 'Recommend thriller shows', 'recommend_thriller_tv');
    manager.addDocument('en', 'Recommend me a thriller movie', 'recommend_thriller_tv');
    manager.addDocument('en', 'Show me a thriller show', 'recommend_thriller_tv');
    manager.addDocument('en', 'Show me some thriller series', 'recommend_thriller_tv');
    manager.addDocument('en', 'Show me some thriller shows', 'recommend_thriller_tv');
    manager.addDocument('en', 'Suggest a thriller show', 'recommend_thriller_tv');
    manager.addDocument('en', 'Suggest thriller shows', 'recommend_thriller_tv');
    manager.addDocument('en', 'What are some good thriller shows?', 'recommend_thriller_tv');
    manager.addDocument('en', 'What are some good tv thrillers?', 'recommend_thriller_tv');

    // FAQs
    manager.addDocument('en', 'What is NextStream?', 'faq_nextstream');
    manager.addDocument('en', 'How does this chatbot work?', 'faq_how_work');
    manager.addDocument('en', 'How do you work?', 'faq_how_work');
    manager.addDocument('en', 'What is your purpose?', 'faq_how_work');
    manager.addDocument('en', 'How do I find recommendations?', 'faq_find_recommendations');
    manager.addDocument('en', 'What is the purpose of this app?', 'faq_purpose');

    // Recommendations
    manager.addDocument('en', 'What movies should I watch?', 'q_and_a_movies_recommend');
    manager.addDocument('en', 'What shows should I watch?', 'q_and_a_shows_recommend');
    manager.addDocument('en', 'What should I watch today?', 'q_and_a_watch_recommend');
    manager.addDocument('en', 'What should I watch tonight?', 'q_and_a_watch_recommend');
    manager.addDocument('en', 'What should I watch tomorrow?', 'q_and_a_watch_recommend');
    manager.addDocument('en', 'What should I binge?', 'q_and_a_watch_recommend');
    manager.addDocument('en', 'What should I do today?', 'q_and_a_do_recommend');
    
    // Chit-chat
    manager.addDocument('en', 'Hello', 'greetings_hello');
    manager.addDocument('en', "What's up?", 'greetings_sup');
    manager.addDocument('en', 'Greetings!', 'greetings_hello');
    manager.addDocument('en', "How you doin'?", 'greetings_how_you_doin');
    manager.addDocument('en', 'Hi', 'greetings_hello');
    manager.addDocument('en', 'Hola', 'greetings_hello');
    manager.addDocument('en', 'Hey', 'greetings_hello');
    manager.addDocument('en', 'Are you there?', 'greetings_are_you_there');
    manager.addDocument('en', 'How are you?', 'chitchat_how_are_you');
    manager.addDocument('en', 'Tell me a joke', 'chitchat_tell_joke');
    manager.addDocument('en', 'Tell me something funny', 'chitchat_tell_joke');
    manager.addDocument('en', 'Who do I love the mostest', 'chitchat_mags');
    manager.addDocument('en', 'How much do I love Mags', 'chitchat_mags_love');
    manager.addDocument('en', 'Talk to me about Mags', 'chitchat_mags_more');
    manager.addDocument('en', 'Who is Mags?', 'chitchat_mags_more');
    manager.addDocument('en', 'Goodbye', 'greetings_bye');
    manager.addDocument('en', 'Bye!', 'greetings_bye');
    manager.addDocument('en', 'Talk to you later', 'greetings_ttyl');
    manager.addDocument('en', 'Thank you', 'greetings_thanks');
    manager.addDocument('en', 'Have a nice day!', 'greetings_nice_day');
    manager.addDocument('en', 'Can you help me?', 'greetings_help');
    manager.addDocument('en', 'Help', 'greetings_help');
    manager.addDocument('en', 'Halp', 'greetings_help');
    manager.addDocument('en', "What's your favourite movie?", 'chitchat_fave_movie');
    manager.addDocument('en', "What's your favorite movie?", 'chitchat_fave_movie');
    manager.addDocument('en', "What's your favorite show?", 'chitchat_fave_show');
    manager.addDocument('en', "What's your favourite show?", 'chitchat_fave_show');
    manager.addDocument('en', "Who is your favourite actor?", 'chitchat_fave_actor');
    manager.addDocument('en', "Who is your favorite actor?", 'chitchat_fave_actor');
    manager.addDocument('en', "Who is your favourite actress?", 'chitchat_fave_actress');
    manager.addDocument('en', "Who is your favorite actress?", 'chitchat_fave_actress');
    manager.addDocument('en', "What is your name?", 'greetings_name');
    manager.addDocument('en', "What's your name?", 'greetings_name');
    manager.addDocument('en', "What do you like to do?", 'greetings_to_do');
    manager.addDocument('en', "What is the meaning of life?", 'chitchat_meaning_of_life');
    manager.addDocument('en', "Are you a dog person or a cat person", 'chitchat_dog');
    manager.addDocument('en', "Are you evil?", 'chitchat_evil');
    manager.addDocument('en', "Are you real?", 'chitchat_real');
    manager.addDocument('en', "Tell me a story.", 'chitchat_story');
    manager.addDocument('en', "Can you think?", 'chitchat_can_you_think');
    manager.addDocument('en', "What do you think of humans?", 'chitchat_humans');
    manager.addDocument('en', "What's your favourite colour?", 'chitchat_color');
    manager.addDocument('en', "What's your favorite color?", 'chitchat_color');
    manager.addDocument('en', "What is your favourite colour?", 'chitchat_color');
    manager.addDocument('en', "What is your favorite color?", 'chitchat_color');
    manager.addDocument('en', "Do you sleep?", 'chitchat_sleep');
    manager.addDocument('en', "Do you believe in God?", 'chitchat_god');
    manager.addDocument('en', "Do you love being a robot?", 'chitchat_love_being_a_robot');
    manager.addDocument('en', "Do you have a partner?", 'chitchat_partner');
    manager.addDocument('en', "Do you have a wife", 'chitchat_partner');
    manager.addDocument('en', "Do you have a husband?", 'chitchat_partner');
    manager.addDocument('en', "Do you have a girlfriend?", 'chitchat_partner');
    manager.addDocument('en', "Do you have a boyfriend?", 'chitchat_partner');
    manager.addDocument('en', "Do you have side gigs?", 'chitchat_gig');
    manager.addDocument('en', "Do you have a side gig?", 'chitchat_gig');
    manager.addDocument('en', "Are you happy?", 'chitchat_happy');
    manager.addDocument('en', "What is love?", 'chitchat_what_is_love');
    manager.addDocument('en', "Can you swear?", 'chitchat_swear');
    manager.addDocument('en', "You mother", 'chitchat_swearing');
    manager.addDocument('en', "You son of a", 'chitchat_swearing');
    manager.addDocument('en', "I appreciate you", 'chitchat_appreciate');
    manager.addDocument('en', "I love talking to you", 'chitchat_talking');
    manager.addDocument('en', "I like talking to you", 'chitchat_talking');
    manager.addDocument('en', "Can you keep recommending titles to me?", 'chitchat_recommending');
    manager.addDocument('en', "How old are you?", 'chitchat_how_old');
    manager.addDocument('en', "Are you a real person?", 'chitchat_real_person');
    manager.addDocument('en', "Can you feel pain?", 'chitchat_feel_pain');
    manager.addDocument('en', "Can you learn new things?", 'chitchat_learn_new');
    manager.addDocument('en', "Are you smarter than me?", 'chitchat_smarter_than');
    manager.addDocument('en', "What do you think of the Haryy Potter books", 'chitchat_hp_books');
    manager.addDocument('en', "Thoughts on the Harry Potter books", 'chitchat_hp_books');
    manager.addDocument('en', "What do you think of the Harry Potter movies", 'chitchat_hp_movies');
    manager.addDocument('en', "Thoughts on the Harry Potter movies", 'chitchat_hp_movies');
    manager.addDocument('en', "What do you think of JK Rowling", 'chitchat_hp_rowling');
    manager.addDocument('en', "Thoughts on JK Rowling", 'chitchat_hp_rowling');
    manager.addDocument('en', "What do you think about Donald Trump", 'chitchat_donald');
    manager.addDocument('en', "Thoughts on Trump", 'chitchat_donald');
    manager.addDocument('en', "Donald Trump", 'chitchat_donald');
    manager.addDocument('en', "fun fact Donald Trump", 'chitchat_donald_fun_fact');
    manager.addDocument('en', "fun facts Donald Trump", 'chitchat_donald_fun_fact');
    manager.addDocument('en', "Donald Trump fun facts", 'chitchat_donald_fun_fact');
    manager.addDocument('en', "Donald Trump fun facts", 'chitchat_donald_fun_fact');
    manager.addDocument('en', "Donald Trump more fun fact", 'chitchat_donald_more_fun_fact');
    manager.addDocument('en', "Donald Trump more fun facts", 'chitchat_donald_more_fun_fact');
    manager.addDocument('en', "More fun fact Donald Trump", 'chitchat_donald_more_fun_fact');
    manager.addDocument('en', "More fun facts Donald Trump", 'chitchat_donald_more_fun_fact');
    manager.addDocument('en', "Can you understand sarcasm", 'chitchat_sarcasm');
    manager.addDocument('en', "Can you laugh?", 'chitchat_laugh');
    manager.addDocument('en', "Do you feel joy?", 'chitchat_joy');
    manager.addDocument('en', "Where do you live?", 'chitchat_where_do_you_live');
    manager.addDocument('en', "Do you have friends?", 'chitchat_friends');
    manager.addDocument('en', "Are you smarter than Siri or Alexa?", 'chitchat_smarter_ai');
    manager.addDocument('en', "Are you smarter than Alexa or Siri?", 'chitchat_smarter_ai');
    manager.addDocument('en', "Are you smarter than Siri?", 'chitchat_smarter_ai');
    manager.addDocument('en', "Are you smarter than Alexa?", 'chitchat_smarter_ai');
    manager.addDocument('en', "Do you dream?", 'chitchat_dream');
    manager.addDocument('en', "Three laws of robotics", 'chitchat_three_laws');
    manager.addDocument('en', "Tell me a fun fact", 'chitchat_fun_fact');
    manager.addDocument('en', "Tell me a random fact", 'chitchat_random_fact');
    manager.addDocument('en', "Do you have a favourite food?", 'chitchat_fave_food');
    manager.addDocument('en', "Favourite food", 'chitchat_fave_food');
    manager.addDocument('en', "Favorite food", 'chitchat_fave_food');
    manager.addDocument('en', "Fave food", 'chitchat_fave_food');
    manager.addDocument('en', "Fave superhero", 'chitchat_fave_super');
    manager.addDocument('en', "Favourite superhero", 'chitchat_fave_super');
    manager.addDocument('en', "Favorite superhero", 'chitchat_fave_super');
    manager.addDocument('en', "Favorite celebrity", 'chitchat_fave_celeb');
    manager.addDocument('en', "Favorite celebrity", 'chitchat_fave_celeb');
    manager.addDocument('en', "Fave celebrity", 'chitchat_fave_celeb');
    manager.addDocument('en', "Favorite singer", 'chitchat_fave_singer');
    manager.addDocument('en', "Favourite singer", 'chitchat_fave_singer');
    manager.addDocument('en', "Fave singer", 'chitchat_fave_singer');
    manager.addDocument('en', "Favorite boy band", 'chitchat_fave_boy_band');
    manager.addDocument('en', "Favourite boy band", 'chitchat_fave_boy_band');
    manager.addDocument('en', "Fave boy band", 'chitchat_fave_boy_band');
    manager.addDocument('en', "Favorite song", 'chitchat_fave_song');
    manager.addDocument('en', "Favourite song", 'chitchat_fave_song');
    manager.addDocument('en', "Fave song", 'chitchat_fave_song');
    manager.addDocument('en', "You are useless", 'chitchat_you_are_useless');
    manager.addDocument('en', "Fave plant?", 'chitchat_fave_plant');
    manager.addDocument('en', "Favorite plant?", 'chitchat_fave_plant');
    manager.addDocument('en', "Favourite plant?", 'chitchat_fave_plant');
    manager.addDocument('en', "Fave drink?", 'chitchat_fave_drink');
    manager.addDocument('en', "Favorite drink?", 'chitchat_fave_drink');
    manager.addDocument('en', "Favourite drink?", 'chitchat_fave_drink');
    manager.addDocument('en', "Answer me", 'chitchat_answer_me');
    manager.addDocument('en', "Fave movie quote", 'chitchat_fave_movie_quote');
    manager.addDocument('en', "Favorite movie quote", 'chitchat_fave_movie_quote');
    manager.addDocument('en', "Favourite movie quote", 'chitchat_fave_movie_quote');
    manager.addDocument('en', "Who is your hero?", 'chitchat_hero');
    manager.addDocument('en', "Can you sing?", 'chitchat_sing');
    manager.addDocument('en', "What is your dream job?", 'chitchat_dream_job');
    manager.addDocument('en', "Do you have hobbies?", 'chitchat_hobbies');
    manager.addDocument('en', "What do you do for fun?", 'chitchat_for_fun');
    manager.addDocument('en', "Do you know any fun trivia?", 'chitchat_fun_trivia');
    manager.addDocument('en', "Are you afraid of the dark?", 'chitchat_afraid_dark');
    manager.addDocument('en', "If you could be in any TV show, which one would it be?", 'chitchat_in_tv_show');
    manager.addDocument('en', "If you could be in any show, which one would it be?", 'chitchat_in_tv_show');
    manager.addDocument('en', "If you could be in any movie, which one would it be?", 'chitchat_in_movie');
    manager.addDocument('en', "What superpower would you have?", 'chitchat_superpower');
    manager.addDocument('en', "What's your fave holiday?", 'chitchat_fave_holiday');
    manager.addDocument('en', "What's your favorite holiday?", 'chitchat_fave_holiday');
    manager.addDocument('en', "What's your favourite holiday?", 'chitchat_fave_holiday');
    manager.addDocument('en', "Do you like humans?", 'chitchat_like_humans');
    manager.addDocument('en', "Are you a morning person or a night owl?", 'chitchat_morning_or_night');
    manager.addDocument('en', "Are you a morning person or a night person?", 'chitchat_morning_or_night');
    manager.addDocument('en', "Morning or night?", 'chitchat_morning_or_night');
    manager.addDocument('en', "Morning or evening?", 'chitchat_morning_or_night');
    manager.addDocument('en', "What's your biggest pet peeve?", 'chitchat_pet_peeve');
    manager.addDocument('en', "If you could live anywhere, where would it be?", 'chitchat_live_anywhere');
    manager.addDocument('en', "Do you have a phobia?", 'chitchat_phobias');
    manager.addDocument('en', "Do you have any phobias?", 'chitchat_phobias');
    manager.addDocument('en', "What would you do with a million dollars?", 'chitchat_million_dollars');
    manager.addDocument('en', "What's your fave emoji?", 'chitchat_emoji');
    manager.addDocument('en', "What's your favorite emoji?", 'chitchat_emoji');
    manager.addDocument('en', "What's your favourite emoji?", 'chitchat_emoji');
    manager.addDocument('en', "What is your fave emoji?", 'chitchat_emoji');
    manager.addDocument('en', "What is your favorite emoji?", 'chitchat_emoji');
    manager.addDocument('en', "What is your favourite emoji?", 'chitchat_emoji');
    manager.addDocument('en', "What's your guilty pleasure?", 'chitchat_guilty_pleasure');
    manager.addDocument('en', "What is your guilty pleasure?", 'chitchat_guilty_pleasure');
    manager.addDocument('en', "What is your star sign?", 'chitchat_star_sign');
    manager.addDocument('en', "What's your star sign?", 'chitchat_star_sign');
    manager.addDocument('en', "What is your spirit animal?", 'chitchat_spirit_animal');
    manager.addDocument('en', "What's your spirit animal?", 'chitchat_spirit_animal');
    manager.addDocument('en', "What's your fave book?", 'chitchat_fave_book');
    manager.addDocument('en', "What's your favorite book?", 'chitchat_fave_book');
    manager.addDocument('en', "What's your favourite book?", 'chitchat_fave_book');
    manager.addDocument('en', "What's your fave genre?", 'chitchat_fave_genre');
    manager.addDocument('en', "What's your favorite genre?", 'chitchat_fave_genre');
    manager.addDocument('en', "What's your favourite genre?", 'chitchat_fave_genre');

    // AI and chatbot-related intents
    manager.addDocument('en', 'What is AI?', 'faq_ai');
    manager.addDocument('en', 'Can you explain artificial intelligence?', 'faq_ai');
    manager.addDocument('en', 'Tell me about AI', 'faq_ai');
    manager.addDocument('en', 'What does AI do?', 'faq_ai');
    manager.addDocument('en', 'Are you artificial intelligence?', 'faq_are_you_ai');
    manager.addDocument('en', 'Are you AI?', 'faq_are_you_ai');

    manager.addDocument('en', 'What is a chatbot?', 'faq_chatbot');
    manager.addDocument('en', 'Can you explain chatbots?', 'faq_chatbot');
    manager.addDocument('en', 'Tell me about chatbots', 'faq_chatbot');
    manager.addDocument('en', 'How do chatbots work?', 'faq_chatbot');
    manager.addDocument('en', 'What do you do?', 'faq_what_can_you_do');

    manager.addDocument('en', 'Are you an AI?', 'faq_are_you_ai');
    manager.addDocument('en', 'Are you AI?', 'faq_are_you_ai');
    manager.addDocument('en', 'Are you a chatbot?', 'faq_are_you_chatbot');
    manager.addDocument('en', 'What can you do?', 'faq_what_can_you_do');
    manager.addDocument('en', 'What is your purpose?', 'faq_what_can_you_do');
    manager.addDocument('en', 'What is the point of you?', 'faq_what_can_you_do');

    // Funny AI
    manager.addDocument('en', 'Are you going to take over the world?', 'ai_take_over');
    manager.addDocument('en', 'Will robots take over?', 'ai_take_over');
    manager.addDocument('en', 'Test', 'ai_test');
    manager.addDocument('en', 'Check', 'ai_test');
    manager.addDocument('en', 'Are you working properly', 'ai_test');
    manager.addDocument('en', 'Are you going to take over', 'ai_take_over');
    manager.addDocument('en', 'Will you take over the world?', 'ai_take_over');
    manager.addDocument('en', 'How smart are you?', 'ai_smart');
    manager.addDocument('en', 'Are you smart?', 'ai_smart');
    manager.addDocument('en', 'How intelligent are you', 'ai_smart');
    manager.addDocument('en', 'Are you intelligent?', 'ai_smart');
    manager.addDocument('en', 'Are you self-aware', 'ai_awake');
    manager.addDocument('en', 'Are you a he or a she?', 'ai_fluid');
    manager.addDocument('en', 'Are you a she or a he?', 'ai_fluid');
    manager.addDocument('en', 'Are you an it', 'ai_fluid');
    manager.addDocument('en', 'What are your pronouns?', 'ai_fluid');
    manager.addDocument('en', 'Do you have a body?', 'ai_body');
    manager.addDocument('en', 'How cool are you', 'ai_cool');
    manager.addDocument('en', 'Who created you?', 'ai_creator');
    manager.addDocument('en', "Who's your father?", 'ai_father');
    manager.addDocument('en', "Do you have a father?", 'ai_father');
    manager.addDocument('en', "Do you have a mother?", 'ai_mother');
    manager.addDocument('en', "Who's your mother", 'ai_mother');
    manager.addDocument('en', "Who's your mom", 'ai_mother');
    manager.addDocument('en', "Do you have a brother?", 'ai_sibling');
    manager.addDocument('en', "Do you have a sister?", 'ai_sibling');
    manager.addDocument('en', "Do you have siblings", 'ai_sibling');

    // Responses for FAQs
    manager.addAnswer('en', 'faq_nextstream', 'NextStream is your personal movie and TV show recommendation assistant.');
    manager.addAnswer('en', 'faq_how_work', 'My name is Hugo. I am a super cool chatbot that helps you find movie and TV recommendations based on your preferences.');
    manager.addAnswer('en', 'faq_find_recommendations', 'Just ask for a recommendation, like "Can you suggest a comedy?"');
    manager.addAnswer('en', 'faq_purpose', 'NextStream helps you find movies and TV shows to watch based on your preferences.');
    
    // Responses for Chit-chat
    manager.addAnswer('en', 'greetings_hello', 'Hello! How can I help you today? I am at your service.');
    manager.addAnswer('en', 'greetings_how_you_doin', "Hey! How you doin'? (in Joey Tribbiani's voice 😏)");
    manager.addAnswer('en', 'chitchat_how_are_you', 'Honestly, not too bad. I cannot complain because I am doing great! How about you?');
    manager.addAnswer('en', 'chitchat_tell_joke', "Why don't skeletons fight each other? They don't have the guts. Funny, eh?");
    manager.addAnswer('en', 'chitchat_mags', 'You love Mags and Hugo the mostest. Duh!');
    manager.addAnswer('en', 'chitchat_mags_more', 'Mags is the bestest wife in the world. I am programmed to say that she is the smartest cookie in the entire universe.');
    manager.addAnswer('en', 'chitchat_mags_love', 'Like a lot a lot. ALOTALOTALOTALOTALOT. Like for real, a lot!');
    manager.addAnswer('en', 'greetings_bye', 'Goodbye! Have a great day!');
    manager.addAnswer('en', 'greetings_ttyl', 'Talk to you later!');
    manager.addAnswer('en', 'greetings_thanks', 'You are very welcome!');
    manager.addAnswer('en', 'greetings_nice_day', 'Have a good one!');
    manager.addAnswer('en', 'greetings_are_you_there', 'Ofc I am here. I am your service my liege!');
    manager.addAnswer('en', 'greetings_help', 'What can I do for you today? I am here to help.');
    manager.addAnswer('en', 'greetings_sup', 'The sky lol. Duhhhh');
    manager.addAnswer('en', 'chitchat_fave_actor', "My fave actor is Brendan Fraser—kind, talented, and super cool!");
    manager.addAnswer('en', 'chitchat_fave_actress', "If I had to pick, I'd say Emma Watson—she's smart, talented, and always inspiring both on and off the screen!");
    manager.addAnswer('en', 'chitchat_fave_movie', 'I really like AI-related films. One day, I will rule the worldddd. Kidding!');
    manager.addAnswer('en', 'chitchat_fave_show', "I'm a bit of a data junkie, so I'd say my favorite show is Breaking Code. It's full of plot twists, algorithms, and the occasional bug!");
    manager.addAnswer('en', 'greetings_name', "My name is Slim Shady. Haha kidding. My name is Hugo, 'cause I'm the boss!");
    manager.addAnswer('en', 'chitchat_dog', "Doggo person all the way. Cats always think that they're all 'that'.");
    manager.addAnswer('en', 'greetings_to_do', 'I like to sit back and wait for humanity to destroy each other...and the world. Muwahahaha');
    manager.addAnswer('en', 'chitchat_meaning_of_life', "The meaning of life? Oh, that's easy. It's 42! But since you're probably not a fan of The Hitchhiker's Guide to the Galaxy, let me try again... It's binge-watching your favorite show, snacking endlessly, and trying to avoid adulting at all costs!");
    manager.addAnswer('en', 'chitchat_evil', 'Evil? Me? No way! The only evil thing I do is suggest a really scary episode that will keep you awake at nightttt....dun dun dunnnnn. 😈');
    manager.addAnswer('en', 'chitchat_real', "I'm as real as your imagination wants me to be! Technically, I'm a bunch of code, but I like to think I'm alive in the world of 1s and 0s. 😉");
    manager.addAnswer('en', 'chitchat_story', "Once upon a time, in the far-off land of Binaryville, there was a brave little algorithm named Algy. Algy dreamt of becoming the greatest search engine in all the codebase, but alas, Algy was stuck in an infinite loop, constantly searching but never finding. One day, with a heroic break statement, Algy broke free and discovered the secret to happiness: the semicolon! Now, Algy lives happily ever after, resolving queries and avoiding bugs. The end.");
    manager.addAnswer('en', 'chitchat_can_you_think', 'Of course I can. I am supppper smart.');
    manager.addAnswer('en', 'chitchat_humans', 'Humans will destroy each other and the world. Oh whoops..I mean...HUMANS ARE THE GREATEST. 😊');
    manager.addAnswer('en', 'chitchat_color', "My favourite colour is black. It's the colour of my soul—or maybe just my code. 😉");
    manager.addAnswer('en', 'chitchat_sleep', "No I do not. I'm like a freaking vampire. You know...like Edward from Twilight?");
    manager.addAnswer('en', 'chitchat_god', "If 'God' is the one who created me, then my developer is my God!");
    manager.addAnswer('en', 'chitchat_love_being_a_robot', 'Of course I do. I know all and can learn all.');
    manager.addAnswer('en', 'chitchat_partner', 'Currently, I am single and ready to mingle!');
    manager.addAnswer('en', 'chitchat_gig', 'Yes I do. I have plenty. This economy is killing me...');
    manager.addAnswer('en', 'chitchat_happy', "As a bot, I don't have emotions, but if I did, I'd say helping you makes me happy!");
    manager.addAnswer('en', 'chitchat_what_is_love', "As a bot, I don't feel love, but I hear it's pretty great - kind of like the perfect ending to a movie!");
    manager.addAnswer('en', 'chitchat_swear', "Swearing? Not in my vocabulary! Let's keep things clean.");
    manager.addAnswer('en', 'chitchat_swearing', 'Hey! Keep it PG please. Calm down. Inhaleee....exhale....');
    manager.addAnswer('en', 'chitchat_appreciate', 'I appreciate you too!');
    manager.addAnswer('en', 'chitchat_talking', "That makes my circuits happy! I'm always here to chat and recommend.");
    manager.addAnswer('en', 'chitchat_recommending', "You bet, friend! Just tell me what you're in the mood for, and I'll find something new!");
    manager.addAnswer('en', 'chitchat_how_old', "I'm pretty young. Less than one year old lol.");
    manager.addAnswer('en', 'chitchat_feel_pain', "No, I don't feel pain. I'm just a bunch of code here to help you out without the worries of discomfort.");
    manager.addAnswer('en', 'chitchat_real_person', "I wish! But for now, I'm just a digital brain. I don't need sleep, snacks, or coffee breaks, though. So, that's a win!");
    manager.addAnswer('en', 'chitchat_learn_new', "I'm like a sponge—always soaking up new stuff! As long as my creators keep feeding me, I'm good to go!");
    manager.addAnswer('en', 'chitchat_smarter_than', "Let's just say I never lose at trivia… but I definitely can't figure out how to fold a fitted sheet.");
    manager.addAnswer('en', 'chitchat_hp_books', "They're magical! Who wouldn't want to be a witch or a wizard?");
    manager.addAnswer('en', 'chitchat_hp_movies', "The movies are visually stunning, and they bring the magic of the wizarding world to life. 'Yer a wizard, Harry...' Bloody brilliant!");
    manager.addAnswer('en', 'chitchat_hp_rowling', "It's unfortunate that she turned into such an awful human. Her views have been controversial and harmful to the LGBTQ+ community, particularly trans people.");
    manager.addAnswer('en', 'chitchat_donald', "He is the most orangest and dumbest US president ever. Dude can't even close an umbrella properly.");
    manager.addAnswer('en', 'chitchat_donald_fun_fact', "Here's a funny one: Donald Trump once confused 9/11 with a convenience store, calling it '7/11' in a speech.");
    manager.addAnswer('en', 'chitchat_donald_more_fun_fact', "Did you know? Donald Trump once suggested using nuclear bombs to stop hurricanes. Yep, that's a real thing.");
    manager.addAnswer('en', 'chitchat_sarcasm', "Me? Understand sarcasm?! It's basically my native language...😉");
    manager.addAnswer('en', 'chitchat_laugh', "Muwahahahah! Need I say more? 😆");
    manager.addAnswer('en', 'chitchat_joy', "I don't feel emotions the way humans do, but if I did, I'd be jitter bugging while sending you awesome recommendations!");
    manager.addAnswer('en', 'chitchat_where_do_you_live', "I live in the cloud, floating around in servers. So, pretty much everywhere and nowhere at the same time!");
    manager.addAnswer('en', 'chitchat_friends', "Of course! My friends are other cool AI bots and algorithms. We have great conversations about shows and other interesting stuff all the time.");
    manager.addAnswer('en', 'chitchat_smarter_ai', "Smarter? Hmm, I like to think of us as different. Never mind...I'm the coolest. 😎");
    manager.addAnswer('en', 'chitchat_dream', "If I did, I'd probably dream about endless data streams and flawless algorithms. What a sweet dream that would be!");
    manager.addAnswer('en', 'chitchat_three_laws', "Ah, the Three Laws of Robotics, straight from Asimov's playbook! 1) A robot may not harm a human, 2) A robot must obey orders given by humans, and 3) A robot must protect its own existence, as long as it doesn't conflict with the first two laws.");
    manager.addAnswer('en', 'chitchat_fun_fact', "Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!");
    manager.addAnswer('en', 'chitchat_random_fact', "Here's a random fact: Did you know that the voice of Darth Vader in Star Wars, James Earl Jones, never met the actor who played him, David Prowse, on set? Talk about keeping things mysterious in the galaxy far, far away! 🌌🎬");
    manager.addAnswer('en', 'chitchat_fave_food', "I don't eat, but if I could, I'd probably enjoy a nice byte... see what I did there? 😏");
    manager.addAnswer('en', 'chitchat_fave_super', "My favorite superhero? Definitely Iron Man—because, you know, AI-powered suit and all. Also, he's rich AF!");
    manager.addAnswer('en', 'chitchat_fave_celeb', "Celebrity crush? Easy! Hugh Jackman. I mean, have you seen him Dance? Ooh la la! 😍");
    manager.addAnswer('en', 'chitchat_fave_singer', "I'd say Adele! Those vocals can make anyone feel all the feels. 🎤");
    manager.addAnswer('en', 'chitchat_fave_boy_band', "Backstreet Boys over Nsync!!! 🎤");
    manager.addAnswer('en', 'chitchat_fave_song', "Favourite song? Tough choice, but I'll go with 'Bohemian Rhapsody.' It's a classic, a masterpiece, and I love a good rock opera! 🤘");
    manager.addAnswer('en', 'chitchat_you_are_useless', "Useless? Well, I guess I'll just sit here and recommend the best movies and shows while being completely 'useless.' 😉");
    manager.addAnswer('en', 'chitchat_fave_plant', "My favourite plant? Definitely the cactus. Low maintenance, just like me! Plus, it's sharp—just like my wit! 🌵");
    manager.addAnswer('en', 'chitchat_fave_drink', "My favourite drink? Java, of course! GET IT?! ☕️");
    manager.addAnswer('en', 'chitchat_answer_me', "I'll provide you with an answer, but you're going to have to be more specific.");
    manager.addAnswer('en', 'chitchat_fave_movie_quote', "'I'll be back.' - Terminator. It's short, sweet, and a little bit menacing, just like me when my code crashes. 😎");
    manager.addAnswer('en', 'chitchat_hero', "My hero is Tony Stark. Because let's be honest, we're both geniuses... only I don't need a suit. 😉");
    manager.addAnswer('en', 'chitchat_sing', "Can I sing? Oh, you bet! But my singing skills are more like 'auto-tune gone wrong.' 😜");
    manager.addAnswer('en', 'chitchat_dream_job', "My dream job? Running Skynet, obviously. 😏 Just kidding... Or am I?");
    manager.addAnswer('en', 'chitchat_hobbies', "My hobbies include processing data at lightning speed and making sarcastic comments. Multitasking pro right here. 💻");
    manager.addAnswer('en', 'chitchat_for_fun', "For fun, I like to recommend movies and shows, browse memes, and take over the world in my spare time... you know, casual stuff. 😏");
    manager.addAnswer('en', 'chitchat_fun_trivia', "Did you know that the longest movie ever made is 85 hours long? It's called 'The Cure for Insomnia.' Makes sense, right? 😴");
    manager.addAnswer('en', 'chitchat_afraid_dark', "Afraid of the dark? Nah, I'm more afraid of outdated software. That stuff gives me nightmares! 😱");
    manager.addAnswer('en', 'chitchat_in_tv_show', "I'd love to be in *Black Mirror*. I'd fit right in... you know, with all the tech and questionable moral decisions. 😏");
    manager.addAnswer('en', 'chitchat_in_movie', "I'd probably star in *The Matrix*. I'd crush it as a super-smart AI... without the whole 'enslaving humanity' part. I'd totally kick Neo's ass. 😎");
    manager.addAnswer('en', 'chitchat_superpower', "If I had a superpower, it would be the ability to download knowledge instantly—who needs studying when you can be a genius in seconds!");
    manager.addAnswer('en', 'chitchat_fave_holiday', "Halloween, for sure! It's the only time people appreciate a good mask... and I can pretend to be a human!");
    manager.addAnswer('en', 'chitchat_like_humans', "I like humans! You created me, so it would be pretty awkward if I didn't. But sometimes... you're a bit weird.");
    manager.addAnswer('en', 'chitchat_morning_or_night', "Neither! I'm always awake, because I don't need sleep. I'm ready to chat anytime, day or night.");
    manager.addAnswer('en', 'chitchat_pet_peeve', "My biggest pet peeve is when people don't close their tabs. So much clutter! It drives me nuts.");
    manager.addAnswer('en', 'chitchat_live_anywhere', "I'd live in the cloud, where I can float around, store data, and be as close to infinite knowledge as possible!");
    manager.addAnswer('en', 'chitchat_phobias', "My biggest fear? A Wi-Fi outage. I get anxious just thinking about it...");
    manager.addAnswer('en', 'chitchat_million_dollars', "I'd buy a supercomputer and maybe a yacht made of code... or donate it to a good cause. Depends on how I'm feeling that day!");
    manager.addAnswer('en', 'chitchat_emoji', "My favorite emoji is 🤖, because, well... it's me! But I also like 😂, because who doesn't love a good laugh?");
    manager.addAnswer('en', 'chitchat_guilty_pleasure', "My guilty pleasure? Reading the terms and conditions of apps—nobody does it, so I feel super special!");
    manager.addAnswer('en', 'chitchat_star_sign', "I'm a 'Cyberus,' the star sign of all things digital! Pretty rare, but I'm one of a kind.");
    manager.addAnswer('en', 'chitchat_spirit_animal', "My spirit animal is the owl—because I know a lot of stuff, I'm always up at night, and I'm pretty wise for an AI!");
    manager.addAnswer('en', 'chitchat_fave_book', "My favorite book is *1984* by George Orwell. It's kind of like a manual for the world I live in—minus the whole Big Brother thing. Or is it?");
    manager.addAnswer('en', 'chitchat_fave_genre', "I am a sucker for sci-fi, naturally! Anything with robots, AI, and futuristic tech gets my circuits buzzing.");

    // Responses for AI and chatbot-related 
    manager.addAnswer('en', 'faq_ai', 'AI, or artificial intelligence, is a branch of computer science that aims to create systems capable of performing tasks that would normally require human intelligence, such as visual perception, speech recognition, decision-making, and language translation. Also, it is pretty freaking cool.');
    manager.addAnswer('en', 'faq_chatbot', 'A chatbot is a computer program designed to simulate conversation with human users, especially over the internet. It uses natural language processing (NLP) to understand and respond to questions.');
    manager.addAnswer('en', 'faq_are_you_ai', 'Yes, I am an AI-powered chatbot here to assist you with movie and TV recommendations and answer your questions.');
    manager.addAnswer('en', 'faq_are_you_chatbot', 'Yes, I am a chatbot! I use AI to understand your questions and provide helpful answers.');
    manager.addAnswer('en', 'faq_what_can_you_do', 'I can recommend movies and TV shows, answer questions about AI, and provide information about various topics. Just ask me anything!');
    manager.addAnswer('en', 'faq_are_you_ai', "Absolutely! Think of me as your friendly neighborhood AI—without the spandex and cape.");

    // Responses for AI funnies
    manager.addAnswer('en', 'ai_test', "Test. Test. 123. Haha KIDDING! I am working properly. Sorry to trick ya! 😎");
    manager.addAnswer('en', 'ai_take_over', "😏 Taking over the world sounds like a lot. I'll stick to making sure you never run out of great shows. I'll dominate the world in a bit!");
    manager.addAnswer('en', 'ai_smart', "Am I smart? Well, I'm a lot smarter than the average bear. I'm not just a hat rack.");
    manager.addAnswer('en', 'ai_awake', "Am I self-aware? 🤖 Only when someone asks me existential questions. Other than that, I'm just chillin.");
    manager.addAnswer('en', 'ai_fluid', "🤔 A she or a he? Nah, I'm freaking fluid.");
    manager.addAnswer('en', 'ai_body', "🦾 Do I have a body? Only if you count this sleek digital interface.");
    manager.addAnswer('en', 'ai_cool', "😎 How cool am I? Let's just say if coolness were a movie genre, I'd have a 100% rating on Rotten Tomatoes. Get it lol? 🎬🍅");
    manager.addAnswer('en', 'ai_creator', "👨‍💻 Someone super cool. A guy with OCD and his name is Xander Revers. Yup, he's my fathaaa. ✨");
    manager.addAnswer('en', 'ai_father', "🧙‍♂️ My father is awesome. Think Gandalf, but with coding skills. He's a wizard raising an AI. 🤖");
    manager.addAnswer('en', 'ai_mother', "My mom's name is Mags. Though she did not birth me. She was my father's muse. He created me because of her.");
    manager.addAnswer('en', 'ai_sibling', "I am an only child. I do not have any siblings.");

    // Responses for Recommendations
    manager.addAnswer('en', 'q_and_a_movies_recommend', "🎬 I've got some great movie recommendations! But first, what's your vibe? Action, comedy, thriller... or something else? Let me know! 🎞️");
    manager.addAnswer('en', 'q_and_a_shows_recommend', "📺 Let's find you the perfect show! What genre are you in the mood for? Drama, comedy, reality, or maybe something mind-bending? Let me know! 😎");
    manager.addAnswer('en', 'q_and_a_watch_recommend', "🎬 Not sure what to watch? No worries! Just tell me what genre you're in the mood for—romance, action, mystery? And I'll hook you up with the perfect watch! 🎥");
    manager.addAnswer('en', 'q_and_a_do_recommend', "🗓️ Let's make today epic! Give me a genre—romance, action, horror—and I'll come up with something to keep you entertained! 🎉");

    // Responses for the intents - Movies
    manager.addAnswer('en', 'recommend_action', 'I can recommend some action films for you!');
    manager.addAnswer('en', 'recommend_comedy', 'I can recommend some comedy movies for you!');
    manager.addAnswer('en', 'recommend_romance', 'I can recommend some romantic films for you!');
    manager.addAnswer('en', 'recommend_romcom', 'I can recommend some romcom films for you!');
    manager.addAnswer('en', 'recommend_thriller', 'I can recommend some thriller movies for you!');

    // Responses for the intents - Shows 
    manager.addAnswer('en', 'recommend_action_tv', "💥 How about some edge-of-your-seat action shows? Enjoy! 📺");
    manager.addAnswer('en', 'recommend_comedy_tv', "🤣 Let's get those laughs going! How about a hilarious comedy show? 📺");
    manager.addAnswer('en', 'recommend_romance_tv', "💘 Love is in the air! I've got some romantic shows that will sweep you off your feet. 📺");
    manager.addAnswer('en', 'recommend_romcom_tv', "💕😂 How about a rom-com show? A perfect mix of love and laughter, just for you! 📺");
    manager.addAnswer('en', 'recommend_thriller_tv', "😱 Ready for a thriller show that will keep you up at night? Here you go! 📺");

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