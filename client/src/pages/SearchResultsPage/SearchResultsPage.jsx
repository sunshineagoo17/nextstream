import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api'; 
import "./SearchResultsPage.scss";

const SearchResultsPage = () => {
  const location = useLocation();
  const [results, setResults] = useState([]);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('query');
    if (query) {
      const fetchResults = async () => {
        try {
          const response = await api.get(`/search/movie?query=${encodeURIComponent(query)}`);
          setResults(response.data.results);
        } catch (error) {
          console.error('Error fetching search results:', error);
        }
      };
      fetchResults();
    }
  }, [location.search]);

  return (
    <div className="search-results">
      <h1>Search Results</h1>
      <div className="search-results__list">
        {results.map((result) => (
          <div key={result.id} className="search-results__item">
            <img src={`https://image.tmdb.org/t/p/w200${result.poster_path}`} alt={result.title} />
            <div className="search-results__info">
              <h2>{result.title}</h2>
              <p>{result.overview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResultsPage;