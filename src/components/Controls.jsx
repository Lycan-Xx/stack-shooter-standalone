import { useEffect, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import GameIcon from './ui/GameIcon';
import './Controls.css';

function bindJoystick(container, stick, state, setInput, onStart, onEnd) {
  if (!container || !stick) return () => {};

  const reset = () => {
    if (!state.active) return;
    state.active = false;
    state.pointerId = null;
    stick.classList.remove('active');
    stick.style.transform = 'translate(-50%, -50%)';
    setInput({ x: 0, y: 0 });
    onEnd?.();
  };

  const update = (event) => {
    if (!state.active || event.pointerId !== state.pointerId) return;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let deltaX = event.clientX - centerX;
    let deltaY = event.clientY - centerY;
    const maxDistance = Math.min(35, rect.width * 0.32);
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > maxDistance) {
      deltaX = (deltaX / distance) * maxDistance;
      deltaY = (deltaY / distance) * maxDistance;
    }
    stick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    setInput({ x: deltaX / maxDistance, y: deltaY / maxDistance });
  };

  const handlePointerDown = (event) => {
    if (!event.isPrimary || state.active) return;
    event.preventDefault();
    state.active = true;
    state.pointerId = event.pointerId;
    container.setPointerCapture?.(event.pointerId);
    stick.classList.add('active');
    onStart?.();
    update(event);
  };
  const handlePointerMove = (event) => { if (state.active) { event.preventDefault(); update(event); } };
  const handlePointerEnd = (event) => { if (event.pointerId === state.pointerId) reset(); };

  container.addEventListener('pointerdown', handlePointerDown, { passive: false });
  container.addEventListener('pointermove', handlePointerMove, { passive: false });
  container.addEventListener('pointerup', handlePointerEnd);
  container.addEventListener('pointercancel', handlePointerEnd);
  container.addEventListener('lostpointercapture', reset);
  return () => {
    reset();
    container.removeEventListener('pointerdown', handlePointerDown);
    container.removeEventListener('pointermove', handlePointerMove);
    container.removeEventListener('pointerup', handlePointerEnd);
    container.removeEventListener('pointercancel', handlePointerEnd);
    container.removeEventListener('lostpointercapture', reset);
  };
}

export default function Controls({ performDash, wasdKeys, togglePause }) {
  const joystickRef = useRef(null);
  const stickRef = useRef(null);
  const joystickState = useRef({ active: false, pointerId: null });
  const aimJoystickRef = useRef(null);
  const aimStickRef = useRef(null);
  const aimState = useRef({ active: false, pointerId: null });

  useEffect(() => {
    const cleanMove = bindJoystick(joystickRef.current, stickRef.current, joystickState, (input) => { window.joystickInput = input; });
    const cleanAim = bindJoystick(aimJoystickRef.current, aimStickRef.current, aimState, (input) => { window.aimJoystickInput = input; }, () => { window.mobileFireActive = true; }, () => { window.mobileFireActive = false; });
    const resetAll = () => {
      joystickState.current.active = false;
      aimState.current.active = false;
      stickRef.current?.classList.remove('active');
      aimStickRef.current?.classList.remove('active');
      if (stickRef.current) stickRef.current.style.transform = 'translate(-50%, -50%)';
      if (aimStickRef.current) aimStickRef.current.style.transform = 'translate(-50%, -50%)';
      window.joystickInput = { x: 0, y: 0 };
      window.aimJoystickInput = { x: 0, y: 0 };
      window.mobileFireActive = false;
    };
    window.addEventListener('blur', resetAll);
    document.addEventListener('visibilitychange', resetAll);
    return () => { cleanMove(); cleanAim(); resetAll(); window.removeEventListener('blur', resetAll); document.removeEventListener('visibilitychange', resetAll); };
  }, []);

  const handleDashClick = () => {
    const btn = document.getElementById('mobile-dash');
    if (btn && performDash()) {
      btn.classList.add('active');
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      setTimeout(() => btn.classList.remove('active'), 200);
    }
  };

  return <>
    <div id="desktop-wasd-controls"><div className="wasd-container"><div className="wasd-main"><div className="wasd-row"><div className={`wasd-key ${wasdKeys.has('KeyW') || wasdKeys.has('ArrowUp') ? 'active' : ''}`}>W</div></div><div className="wasd-row"><div className={`wasd-key ${wasdKeys.has('KeyA') || wasdKeys.has('ArrowLeft') ? 'active' : ''}`}>A</div><div className={`wasd-key ${wasdKeys.has('KeyS') || wasdKeys.has('ArrowDown') ? 'active' : ''}`}>S</div><div className={`wasd-key ${wasdKeys.has('KeyD') || wasdKeys.has('ArrowRight') ? 'active' : ''}`}>D</div></div></div><div className="wasd-vertical"><div className={`wasd-key spacebar-key ${wasdKeys.has('Space') ? 'active' : ''}`}>SPACE</div></div></div></div>
    <div id="mobile-controls"><div id="joystick-container" ref={joystickRef}><div id="joystick-base"><span className="control-label">MOVE</span></div><div id="joystick-stick" ref={stickRef} /></div><div id="joystick-container-right" ref={aimJoystickRef}><div id="joystick-base-right"><span className="control-label">FIRE</span></div><div id="joystick-stick-right" ref={aimStickRef} /></div><div className="mobile-action-buttons"><button id="mobile-pause" onPointerDown={togglePause} title="Pause" aria-label="Pause game"><GameIcon name="pause" size={25} strokeWidth={2.4} /></button><button id="mobile-dash" onPointerDown={handleDashClick} title="Dash" aria-label="Dash"><GameIcon name="zap" size={33} strokeWidth={1.8} /><span className="action-label">DASH</span></button></div></div>
  </>;
}
