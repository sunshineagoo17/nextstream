const bcrypt = require('bcrypt');

async function hashPassword(password) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

// Replace 'myPassword123' with the password you want to hash
const passwordToHash = 'myPassword123';

hashPassword(passwordToHash)
  .then(hashedPassword => {
    console.log('Original Password:', passwordToHash);
    console.log('Hashed Password:', hashedPassword);
  })
  .catch(error => {
    console.error('Error hashing password:', error);
  });
