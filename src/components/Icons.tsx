import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

type SvgProps = IconProps & { children: ReactNode };

function Svg({ size = 20, children, ...props }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12.5l4.7 4.7L19.5 7" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M9 7V4.8h6V7M6.5 7l.9 12.2h9.2L17.5 7M10 11v4.5M14 11v4.5" />
    </Svg>
  );
}

export function EqualIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 9.5h14M5 14.5h14" />
    </Svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h8M16 7h4M4 17h4M12 17h8" />
      <circle cx="14" cy="7" r="2.1" />
      <circle cx="10" cy="17" r="2.1" />
    </Svg>
  );
}

export function PercentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18.5 5.5l-13 13" />
      <circle cx="7" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
    </Svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h12v17l-2.4-1.5L13.2 20.5 12 19.5l-1.2 1-2.4-1.5L6 20.5v-17Z" />
      <path d="M9 8h6M9 12h6" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="10.5" height="10.5" rx="2" />
      <path d="M5.5 15V6.5a2 2 0 0 1 2-2H16" />
    </Svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.5 13.5a4.5 4.5 0 0 0 6.4.4l2-2a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M13.5 10.5a4.5 4.5 0 0 0-6.4-.4l-2 2a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </Svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 12.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5" />
    </Svg>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M15 14.5h2.5v2.5M20.5 20.5H17V18M14.5 20.5h.5M20.5 14.5v.5" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
    </Svg>
  );
}

export function RotateIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3 3.5v5h5" />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20l4.2-1L19.5 7.7a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="M14.5 6.5l3 3" />
    </Svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}
