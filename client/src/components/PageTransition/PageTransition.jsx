import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useLocation } from 'react-router-dom';
import './PageTransition.scss'; 

const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <TransitionGroup className="page-transition">
      <CSSTransition
        key={location.key || location.pathname}
        classNames="page-transition__fade"
        timeout={300}
      >
        <div>
          {children}
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
};

export default PageTransition;