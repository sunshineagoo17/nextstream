import { createContext, useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

export const MediaContext = createContext();

const encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY;

const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
};

const decryptData = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

const saveToStorage = (data, key) => {
  localStorage.setItem(key, encryptData(data));
};

const loadFromStorage = (key) => {
  const ciphertext = localStorage.getItem(key);
  return ciphertext ? decryptData(ciphertext) : null;
};

export const MediaProvider = ({ children }) => {
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedMediaIds, setSwipedMediaIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedMedia = loadFromStorage('media') || [];
    const storedCurrentIndex = loadFromStorage('currentIndex') || 0;
    const storedSwipedMediaIds = loadFromStorage('swipedMediaIds') || [];
    
    setMedia(storedMedia);
    setCurrentIndex(storedCurrentIndex);
    setSwipedMediaIds(storedSwipedMediaIds);
  }, []);

  useEffect(() => {
    saveToStorage(media, 'media');
    saveToStorage(currentIndex, 'currentIndex');
    saveToStorage(swipedMediaIds, 'swipedMediaIds');
  }, [media, currentIndex, swipedMediaIds]);

  return (
    <MediaContext.Provider value={{ media, setMedia, currentIndex, setCurrentIndex, swipedMediaIds, setSwipedMediaIds, isLoading, setIsLoading }}>
      {children}
    </MediaContext.Provider>
  );
};