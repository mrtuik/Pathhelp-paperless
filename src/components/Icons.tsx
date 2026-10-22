import type { ReactNode } from 'react';

interface IconProps {
  size?: number;
}

/** Lucide-style outline icon (24x24, 2px round stroke): same icon family as the Pathhelp extension. */
function Svg({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const CameraIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </Svg>
);
export const PlusIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Svg>
);
export const XIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
);
export const ArrowUpIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </Svg>
);
export const CheckIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);
export const CopyIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Svg>
);
export const RefreshIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </Svg>
);
export const UndoIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
  </Svg>
);
export const BoltIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </Svg>
);
export const PencilIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </Svg>
);
export const AlertIcon = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </Svg>
);

/** Gallery icon (filled, takes the current text colour). */
export const GalleryIcon = ({ size = 22 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <g fill="currentColor">
      <path d="M18 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.943 1.25h.114c2.309 0 4.118 0 5.53.19c1.444.194 2.584.6 3.479 1.494c.895.895 1.3 2.035 1.494 3.48c.19 1.411.19 3.22.19 5.529v.088c0 1.909 0 3.471-.104 4.743c-.104 1.28-.317 2.347-.795 3.235q-.314.586-.785 1.057c-.895.895-2.035 1.3-3.48 1.494c-1.411.19-3.22.19-5.529.19h-.114c-2.309 0-4.118 0-5.53-.19c-1.444-.194-2.584-.6-3.479-1.494c-.793-.793-1.203-1.78-1.42-3.006c-.215-1.203-.254-2.7-.262-4.558Q1.25 12.792 1.25 12v-.058c0-2.309 0-4.118.19-5.53c.194-1.444.6-2.584 1.494-3.479c.895-.895 2.035-1.3 3.48-1.494c1.411-.19 3.22-.19 5.529-.19m-5.33 1.676c-1.278.172-2.049.5-2.618 1.069c-.57.57-.897 1.34-1.069 2.619c-.174 1.3-.176 3.008-.176 5.386v.844l1.001-.876a2.3 2.3 0 0 1 3.141.104l4.29 4.29a2 2 0 0 0 2.564.222l.298-.21a3 3 0 0 1 3.732.225l2.83 2.547c.286-.598.455-1.384.545-2.493c.098-1.205.099-2.707.099-4.653c0-2.378-.002-4.086-.176-5.386c-.172-1.279-.5-2.05-1.069-2.62c-.57-.569-1.34-.896-2.619-1.068c-1.3-.174-3.008-.176-5.386-.176s-4.086.002-5.386.176"
      />
    </g>
  </svg>
);

/** List tab icon (the supplied "go-work" artwork, original colours kept). */
export const ListIcon = ({ size = 26 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path
      fill="#fddd00"
      d="M0 12.32h1.64q.12.02.06.12l-.34.5a.3.3 0 0 1-.2.12H0zm0 1.8h.62a.1.1 0 0 1 .1.12l-.16.46a.2.2 0 0 1-.17.12H0zm0 1.8h.19q.12 0 .12.13l-.04.47a.15.15 0 0 1-.14.14H0zm16.15-3.22c-1.23.3-2.07.54-3.28.85c-.3.08-.32.1-.57-.2c-.3-.32-.5-.54-.92-.73a3.4 3.4 0 0 0-3.53.29a4.2 4.2 0 0 0-2 3.7a3.1 3.1 0 0 0 2.64 3.07a3.6 3.6 0 0 0 3.32-1.28q.25-.32.53-.73H8.57c-.41 0-.5-.25-.37-.58c.25-.6.72-1.62 1-2.13a.5.5 0 0 1 .48-.31h7.11c-.04.52-.04 1.05-.11 1.58a8.3 8.3 0 0 1-1.6 3.83a8.2 8.2 0 0 1-5.57 3.32a7 7 0 0 1-5.26-1.3a6 6 0 0 1-2.48-4.33a7.7 7.7 0 0 1 1.66-5.72q2.1-2.75 5.47-3.38a6.7 6.7 0 0 1 5.18.96a6 6 0 0 1 2.26 2.75q.17.25-.2.33m6.47 10.81a7.3 7.3 0 0 1-4.76-1.73a6 6 0 0 1-2.11-3.76a7.5 7.5 0 0 1 1.58-5.9a8 8 0 0 1 5.47-3.26a7.2 7.2 0 0 1 5.56 1a6 6 0 0 1 2.76 4.35a7.6 7.6 0 0 1-2.25 6.62a9 9 0 0 1-4.69 2.5c-.52.1-1.05.11-1.56.17m4.65-7.9l-.06-.64a3.2 3.2 0 0 0-3.98-2.6c-1.82.41-3 1.56-3.42 3.4a3.2 3.2 0 0 0 1.8 3.69q1.61.69 3.18-.12q2.32-1.2 2.48-3.73"
    />
  </svg>
);
