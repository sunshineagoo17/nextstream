import { useState, useEffect } from 'react';
import ArrowCursor from "../../assets/cursors/cursor-arrow-wh.svg"; 
import ArrowCursorVariant from "../../assets/cursors/cursor-arrow-bl.svg";
import HandCursor from "../../assets/cursors/cursor-hand-wh.svg"; 
import HandCursorVariant from "../../assets/cursors/cursor-hand-bl.svg"; 
import PenCursor from "../../assets/cursors/cursor-pen-wh.svg"; 
import PenCursorVariant from "../../assets/cursors/cursor-pen-bl.svg"; 
import PointerCursor from "../../assets/cursors/cursor-pointer-wh.svg";  
import PointerCursorVariant from "../../assets/cursors/cursor-pointer-bl.svg"; 
import './CustomCursor.scss'; 

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorType, setCursorType] = useState(ArrowCursor);

  // Track mouse position
  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const isDarkBackground = () => {
  
    return document.documentElement.getAttribute('data-theme') === 'dark' || 
           document.querySelector('.dark-background') !== null;
  };

  const isActionableImage = (element) => {
    
    return (
      element.tagName === 'IMG' &&
      (element.closest('a, button, [role="button"], nav') !== null || 
       element.hasAttribute('onclick') || 
       element.getAttribute('role') === 'button')
    );
  };

  const applyCursorListeners = (elements, enterCallback, leaveCallback) => {
    elements.forEach((el) => {
      el.style.cursor = 'none'; 
      el.addEventListener('mouseenter', enterCallback);
      el.addEventListener('mouseleave', leaveCallback);
    });
  };

  const removeInlineCursorStyles = () => {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.style.cursor) {
        el.style.cursor = 'none'; 
      }
    });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);

    // Event handlers to manage cursor changes
    const handleMouseEnterClickable = () => {
      setCursorType(isDarkBackground() ? PointerCursorVariant : PointerCursor);
    };
    const handleMouseLeaveClickable = () => {
      setCursorType(isDarkBackground() ? ArrowCursorVariant : ArrowCursor);
    };

    const handleMouseEnterInput = () => {
      setCursorType(isDarkBackground() ? PenCursorVariant : PenCursor);
    };

    const handleMouseEnterImage = (e) => {
      if (isActionableImage(e.target)) {
        setCursorType(isDarkBackground() ? PointerCursorVariant : PointerCursor);
      } else {
        setCursorType(isDarkBackground() ? HandCursorVariant : HandCursor);
      }
    };

    const observeMutations = (mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const clickableElements = document.querySelectorAll('a, button, [role="button"], .Link, .hover-menu__button, .hover-menu__item');
          applyCursorListeners(clickableElements, handleMouseEnterClickable, handleMouseLeaveClickable);

          const inputElements = document.querySelectorAll('input, textarea');
          applyCursorListeners(inputElements, handleMouseEnterInput, handleMouseLeaveClickable);

          const imageElements = document.querySelectorAll('img');
          applyCursorListeners(imageElements, handleMouseEnterImage, handleMouseLeaveClickable);

          removeInlineCursorStyles(); // Ensure inline styles are cleared for new elements
        }
      });
    };

    // Creates a MutationObserver to monitor dynamically added elements
    const observer = new MutationObserver(observeMutations);
    observer.observe(document.body, { childList: true, subtree: true });

    // Apply listeners to existing elements on initial load
    const clickableElements = document.querySelectorAll('a, button, [role="button"], .Link, .hover-menu__button, .hover-menu__item');
    applyCursorListeners(clickableElements, handleMouseEnterClickable, handleMouseLeaveClickable);

    const inputElements = document.querySelectorAll('input, textarea');
    applyCursorListeners(inputElements, handleMouseEnterInput, handleMouseLeaveClickable);

    const imageElements = document.querySelectorAll('img');
    applyCursorListeners(imageElements, handleMouseEnterImage, handleMouseLeaveClickable);

    // Remove inline cursor styles
    removeInlineCursorStyles();

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect(); 
    };
  }, []);

  return (
    <div className="custom-cursor">
      <img
        src={cursorType} 
        alt="Custom Cursor"
        className="custom-cursor__image"
        style={{
          position: 'absolute',
          top: `${mousePosition.y}px`,
          left: `${mousePosition.x}px`,
          pointerEvents: 'none', 
        }}
      />
    </div>
  );
};

export default CustomCursor;
