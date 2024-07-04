import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import api from "./services/api";
import { HomePage } from "./pages/HomePage/HomePage";
import { Header } from "./components/Header/Header";
import { Footer } from "./components/Footer/Footer";
import { TermsAndConditions } from "./pages/TermsAndConditions/TermsAndConditions";
import ContactModal from "./components/ContactModal/ContactModal";
import './styles/global.scss';

const App = () => {
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Router>
      <div className="app-container">
        {error && <div>Error: {error.message}</div>}
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<TermsAndConditions />} />
        </Routes>
        <Footer openModal={openModal} />
        {isModalOpen && (
          <ContactModal show={isModalOpen} handleClose={closeModal} />
        )}
      </div>
    </Router>
  );
};

export default App;
