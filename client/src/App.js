import React, { useEffect, useState } from 'react';
import api from './services/api';

const App = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/')
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('There was an error making the request', error);
      });
  }, []);

  return (
    <div>
      <h1>Server Response:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default App;