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
    manager.addDocument('en', 'Romatic show', 'recommend_romance_tv');
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
    manager.addDocument('en', 'Rom-com show', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom-com shows', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom-com series', 'recommend_romcom_tv');
    manager.addDocument('en', 'Rom-com tv', 'recommend_romcom_tv');
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
    manager.addDocument('en', 'What should I do today?', 'q_and_a_do_recommend');
    
    // Chit-chat
    manager.addDocument('en', 'Hello', 'greetings_hello');
    manager.addDocument('en', 'Greetings!', 'greetings_hello');
    manager.addDocument('en', "How you doin'?", 'greetings_how_you_doin');
    manager.addDocument('en', 'Hi', 'greetings_hello');
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

    // AI and chatbot-related intents
    manager.addDocument('en', 'What is AI?', 'faq_ai');
    manager.addDocument('en', 'Can you explain artificial intelligence?', 'faq_ai');
    manager.addDocument('en', 'Tell me about AI', 'faq_ai');
    manager.addDocument('en', 'What does AI do?', 'faq_ai');

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

    // Responses for FAQs
    manager.addAnswer('en', 'faq_nextstream', 'NextStream is your personal movie and TV show recommendation assistant.');
    manager.addAnswer('en', 'faq_how_work', 'My name is Hugo. I am a super cool chatbot that helps you find movie and TV recommendations based on your preferences.');
    manager.addAnswer('en', 'faq_find_recommendations', 'Just ask for a recommendation, like "Can you suggest a comedy?"');
    manager.addAnswer('en', 'faq_purpose', 'NextStream helps you find movies and TV shows to watch based on your preferences.');
    
    // Responses for Chit-chat
    manager.addAnswer('en', 'greetings_hello', 'Hello! How can I help you today? I am at your service.');
    manager.addAnswer('en', 'greetings_how_you_doin', "Hey! How you doin'? (in Joey Tribbiani's voice 😏)");
    manager.addAnswer('en', 'chitchat_how_are_you', 'Honestly, not too bad. I cannot complain because I am doing great! How about you?');
    manager.addAnswer('en', 'chitchat_tell_joke', 'Why don’t skeletons fight each other? They don’t have the guts. Funny, eh?');
    manager.addAnswer('en', 'chitchat_mags', 'You love Mags and Hugo the mostest. Duh!');
    manager.addAnswer('en', 'chitchat_mags_more', 'Mags is the bestest wife in the world. I am programmed to say that she is the smartest cookie in the entire universe.');
    manager.addAnswer('en', 'chitchat_mags_love', 'Like a lot a lot. ALOTALOTALOTALOTALOT. Like for real, a lot!');
    manager.addAnswer('en', 'greetings_bye', 'Goodbye! Have a great day!');
    manager.addAnswer('en', 'greetings_ttyl', 'Talk to you later!');

    // Responses for AI and chatbot-related 
    manager.addAnswer('en', 'faq_ai', 'AI, or artificial intelligence, is a branch of computer science that aims to create systems capable of performing tasks that would normally require human intelligence, such as visual perception, speech recognition, decision-making, and language translation. Also, it is pretty freaking cool.');
    manager.addAnswer('en', 'faq_chatbot', 'A chatbot is a computer program designed to simulate conversation with human users, especially over the internet. It uses natural language processing (NLP) to understand and respond to questions.');
    manager.addAnswer('en', 'faq_are_you_ai', 'Yes, I am an AI-powered chatbot here to assist you with movie and TV recommendations and answer your questions.');
    manager.addAnswer('en', 'faq_are_you_chatbot', 'Yes, I am a chatbot! I use AI to understand your questions and provide helpful answers.');
    manager.addAnswer('en', 'faq_what_can_you_do', 'I can recommend movies and TV shows, answer questions about AI, and provide information about various topics. Just ask me anything!');

    // Responses for AI funnies
    manager.addAnswer('en', 'ai_test', "Test. Test. 123. Haha KIDDING! I am working properly. Sorry to trick ya! 😎");
    manager.addAnswer('en', 'ai_take_over', "😏 Taking over the world sounds like a lot. I’ll stick to making sure you never run out of great shows. I'll dominate the world in a bit!");
    manager.addAnswer('en', 'ai_smart', "Am I smart? Well, I'm a lot smarter than the average bear. I'm not just a hat rack.");
    manager.addAnswer('en', 'ai_awake', "Am I self-aware? 🤖 Only when someone asks me existential questions. Other than that, I’m just chillin.");
    manager.addAnswer('en', 'ai_fluid', "🤔 A she or a he? Nah, I'm freaking fluid.");
    manager.addAnswer('en', 'ai_body', "🦾 Do I have a body? Only if you count this sleek digital interface.");
    manager.addAnswer('en', 'ai_cool', "😎 How cool am I? Let’s just say if coolness were a movie genre, I’d have a 100% rating on Rotten Tomatoes. Get it lol? 🎬🍅");
    manager.addAnswer('en', 'ai_creator', "👨‍💻 Someone super cool. A guy with OCD and his name is Xander Revers. Yup, he's my fathaaa. ✨");
    manager.addAnswer('en', 'ai_father', "🧙‍♂️ My father is awesome. Think Gandalf, but with coding skills. He's a wizard raising an AI. 🤖");

    // Responses for Recommendations
    manager.addAnswer('en', 'q_and_a_movies_recommend', "🎬 I’ve got some great movie recommendations! But first, what's your vibe? Action, comedy, thriller... or something else? Let me know! 🎞️");
    manager.addAnswer('en', 'q_and_a_shows_recommend', "📺 Let's find you the perfect show! What genre are you in the mood for? Drama, comedy, reality, or maybe something mind-bending? Let me know! 😎");
    manager.addAnswer('en', 'q_and_a_watch_recommend', "🎬 Not sure what to watch? No worries! Just tell me what genre you’re in the mood for—romance, action, mystery? And I’ll hook you up with the perfect watch! 🎥");
    manager.addAnswer('en', 'q_and_a_do_recommend', "🗓️ Let’s make today epic! Give me a genre—romance, action, horror—and I’ll come up with something to keep you entertained! 🎉");

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