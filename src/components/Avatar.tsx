const TONES = 6;

function hashName(name: string, index: number): number {
  let hash = index * 17 + 3;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % TONES;
}

function initialsFor(name: string, index: number): string {
  const trimmed = name.trim();
  if (!trimmed) return String(index + 1).padStart(2, '0');
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return Array.from(trimmed).slice(0, 2).join('').toUpperCase();
}

export function Avatar({
  name,
  index,
  size = 'md',
}: {
  name: string;
  index: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  return (
    <span
      className={`avatar avatar-${size} tone-${hashName(name, index)}`}
      aria-hidden="true"
      data-empty={name.trim() === '' ? 'true' : undefined}
    >
      {initialsFor(name, index)}
    </span>
  );
}
