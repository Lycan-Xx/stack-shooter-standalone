import './GameIcon.css';

import { ArrowLeftIcon } from '@solar-icons/react/linear/arrow-left';
import { BookIcon } from '@solar-icons/react/linear/book';
import { BoltIcon } from '@solar-icons/react/linear/bolt';
import { ChartIcon } from '@solar-icons/react/linear/chart';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { CupIcon } from '@solar-icons/react/linear/cup';
import { HeartIcon } from '@solar-icons/react/linear/heart';
import { HomeIcon } from '@solar-icons/react/linear/home';
import { InfoCircleIcon } from '@solar-icons/react/linear/info-circle';
import { PauseIcon } from '@solar-icons/react/linear/pause';
import { PlayIcon } from '@solar-icons/react/linear/play';
import { PeopleNearbyIcon } from '@solar-icons/react/linear/people-nearby';

const solarIcons = {
  play: PlayIcon,
  pause: PauseIcon,
  back: ArrowLeftIcon,
  close: CloseIcon,
  tutorial: BookIcon,
  trophy: CupIcon,
  users: PeopleNearbyIcon,
  home: HomeIcon,
  zap: BoltIcon,
  heart: HeartIcon,
  info: InfoCircleIcon,
  stats: ChartIcon,
};

const paths = {
  play: <><path d="M8 5.5 19 12 8 18.5Z" /><path d="M4.5 4.5v15" /></>,
  pause: <><path d="M8 5v14" /><path d="M16 5v14" /></>,
  settings: <><path d="m12 3 1.1 1.9 2.2.5 1.8-1.2 1.7 1.7-1.2 1.8.5 2.2L20 11v2l-1.9 1.1-.5 2.2 1.2 1.8-1.7 1.7-1.8-1.2-2.2.5L12 21l-1.1-1.9-2.2-.5-1.8 1.2-1.7-1.7 1.2-1.8-.5-2.2L4 13v-2l1.9-1.1.5-2.2-1.2-1.8 1.7-1.7 1.8 1.2 2.2-.5Z" /><circle cx="12" cy="12" r="3" /></>,
  back: <><path d="m14 5-7 7 7 7" /><path d="M7 12h13" /></>,
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  tutorial: <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5Z" /><path d="M5 5.5v15" /><path d="M9 7h6M9 10h7" /></>,
  trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0Z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 20h8M9 17h6" /></>,
  shield: <path d="M12 3 19 6v5c0 4.5-2.8 7.4-7 10-4.2-2.6-7-5.5-7-10V6Z" />,
  users: <><circle cx="9" cy="9" r="3" /><path d="M3.5 19c.5-3 2.3-4.5 5.5-4.5s5 1.5 5.5 4.5" /><path d="M15 6.5a3 3 0 0 1 0 5.8M17 14.5c1.9.4 3 1.8 3.5 3.5" /></>,
  store: <><path d="M4 9h16l-1-5H5Z" /><path d="M5 9v10h14V9M9 19v-6h6v6" /><path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" /></>,
  volume: <><path d="M4 10v4h3l4 3V7l-4 3Z" /><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10" /></>,
  mute: <><path d="M4 10v4h3l4 3V7l-4 3Z" /><path d="m16 10 4 4M20 10l-4 4" /></>,
  retry: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 0 1 4" /></>,
  home: <><path d="m4 11 8-7 8 7" /><path d="M6 10v9h12v-9M10 19v-5h4v5" /></>,
  sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="11" cy="18" r="2" /></>,
  skull: <><path d="M7 13a5 5 0 1 1 10 0v2l-2 1v3h-2v-2H11v2H9v-3l-2-1Z" /><circle cx="10" cy="11" r="1" /><circle cx="14" cy="11" r="1" /><path d="M10 15h4" /></>,
  zap: <path d="m13 2-9 11h7l-1 9 9-11h-7Z" />,
  heart: <path d="M12 20S4 15.4 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20Z" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
};

export default function GameIcon({ name, size = 24, strokeWidth = 1.7, label, className = '' }) {
  const SolarIcon = solarIcons[name];
  if (SolarIcon) {
    return (
      <SolarIcon
        className={`game-icon ${className}`.trim()}
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden={label ? undefined : 'true'}
        aria-label={label}
      />
    );
  }

  const content = paths[name] || paths.info;
  return (
    <svg
      className={`game-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {content}
    </svg>
  );
}

export function GameMark({ size = 32, className = '' }) {
  return (
    <svg className={`game-mark ${className}`.trim()} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3 27 8v7c0 6.3-4.4 10.5-11 14C9.4 25.5 5 21.3 5 15V8Z" fill="currentColor" opacity=".14" />
      <path d="M16 3 27 8v7c0 6.3-4.4 10.5-11 14C9.4 25.5 5 21.3 5 15V8Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="m11 15 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
