import { useEffect, useRef } from 'react';
import './Controls.css';

export default function Controls({ performDash, wasdKeys }) {
  const joystickRef = useRef(null);
  const stickRef = useRef(null);
  const joystickActive = useRef(false);
  const joystickId = useRef(null);

  // Detect if device has touch capability
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const desktopControls = document.getElementById('desktop-wasd-controls');
    const mobileControls = document.getElementById('mobile-controls');

    if (isTouchDevice) {
      if (desktopControls) desktopControls.style.display = 'none';
      if (mobileControls) mobileControls.style.display = 'block';
    } else {
      if (desktopControls) desktopControls.style.display = 'block';
      if (mobileControls) mobileControls.style.display = 'none';
    }
  }, []);

  useEffect(() => {
    const joystickContainer = joystickRef.current;
    const stick = stickRef.current;

    if (!joystickContainer || !stick) return;

    const handleTouchStart = (e) => {
      const touch = Array.from(e.changedTouches).find((t) => {
        const rect = joystickContainer.getBoundingClientRect();
        return (
          t.clientX >= rect.left &&
          t.clientX <= rect.right &&
          t.clientY >= rect.top &&
          t.clientY <= rect.bottom
        );
      });

      if (touch) {
        e.preventDefault();
        joystickActive.current = true;
        joystickId.current = touch.identifier;
        stick.classList.add('active');
        updateJoystick(touch);
      }
    };

    const handleTouchMove = (e) => {
      if (!joystickActive.current) return;

      const touch = Array.from(e.changedTouches).find((t) => t.identifier === joystickId.current);
      if (touch) {
        e.preventDefault();
        updateJoystick(touch);
      }
    };

    const handleTouchEnd = (e) => {
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === joystickId.current);
      if (touch) {
        e.preventDefault();
        joystickActive.current = false;
        joystickId.current = null;
        stick.classList.remove('active');
        stick.style.transform = 'translate(-50%, -50%)';

        window.joystickInput = { x: 0, y: 0 };
      }
    };

    const updateJoystick = (touch) => {
      const rect = joystickContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let deltaX = touch.clientX - centerX;
      let deltaY = touch.clientY - centerY;

      const maxDistance = 35;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }

      stick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

      window.joystickInput = {
        x: deltaX / maxDistance,
        y: deltaY / maxDistance,
      };
    };

    joystickContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      joystickContainer.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleDashClick = () => {
    const btn = document.getElementById('mobile-dash');
    if (performDash()) {
      btn.classList.add('active');
      setTimeout(() => btn.classList.remove('active'), 200);
    }
  };

  const handleFirePress = () => {
    // Set window flag for continuous firing while pressed
    window.mobileFireActive = true;
  };

  const handleFireRelease = () => {
    window.mobileFireActive = false;
  };

  return (
    <>
      {/* Desktop WASD Controls */}
      <div id="desktop-wasd-controls">
        <div className="wasd-container">
          <div className="wasd-main">
            <div className="wasd-row">
              <div
                className={`wasd-key ${wasdKeys.has('KeyW') || wasdKeys.has('ArrowUp') ? 'active' : ''}`}
                data-key="KeyW"
              >
                W
              </div>
            </div>
            <div className="wasd-row">
              <div
                className={`wasd-key ${wasdKeys.has('KeyA') || wasdKeys.has('ArrowLeft') ? 'active' : ''}`}
                data-key="KeyA"
              >
                A
              </div>
              <div
                className={`wasd-key ${wasdKeys.has('KeyS') || wasdKeys.has('ArrowDown') ? 'active' : ''}`}
                data-key="KeyS"
              >
                S
              </div>
              <div
                className={`wasd-key ${wasdKeys.has('KeyD') || wasdKeys.has('ArrowRight') ? 'active' : ''}`}
                data-key="KeyD"
              >
                D
              </div>
            </div>
          </div>
          <div className="wasd-vertical">
            <div
              className={`wasd-key spacebar-key ${wasdKeys.has('Space') ? 'active' : ''}`}
              data-key="Space"
            >
              SPACE
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div id="mobile-controls">
        <div id="joystick-container" ref={joystickRef}>
          <div id="joystick-base"></div>
          <div id="joystick-stick" ref={stickRef}></div>
        </div>
        
        <div className="mobile-action-buttons">
          <button 
            id="mobile-fire" 
            onTouchStart={handleFirePress}
            onTouchEnd={handleFireRelease}
            onMouseDown={handleFirePress}
            onMouseUp={handleFireRelease}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <path d="M12 2v4M12 18v4M22 12h-4M6 12H2M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83M19.07 19.07l-2.83-2.83M7.76 7.76L4.93 4.93"/>
            </svg>
          </button>
          
          <button id="mobile-dash" onClick={handleDashClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
