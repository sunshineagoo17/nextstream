import { createContext, useRef, useContext } from 'react';

const SearchBarContext = createContext(null);

export const SearchBarProvider = ({ children }) => {
    const searchBarDesktopRef = useRef(null);
    const searchBarMobileRef = useRef(null);
  
    return (
      <SearchBarContext.Provider value={{ searchBarDesktopRef, searchBarMobileRef }}>
        {children}
      </SearchBarContext.Provider>
    );
  };
  
  export const useSearchBar = () => {
    return useContext(SearchBarContext);
  };