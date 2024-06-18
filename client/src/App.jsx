import React, { useEffect, useState } from 'react';
import api from './services/api';
import { HomePage } from './pages/HomePage/HomePage';
import { Header } from "./components/Header/Header";
import { Footer } from "./components/Footer/Footer";
import './styles/global.scss';

const App = () => {
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/')
      .then(response => {
        console.log('Server Response:', response.data);
      })
      .catch(error => {
        setError(error);
        console.error('There was an error making the request', error);
      });
  }, []);

  return (
    <div>
      {error && <div>Error: {error.message}</div>}
      <Header />
      <HomePage />
      <Footer />
    </div>
  );
};

export default App;