import React from 'react';

/**
 * UserAvatar — displays a deterministic animated cartoon avatar.
 *
 * Uses DiceBear's "avataaars" style — professional cartoon characters
 * that are generated consistently from a seed string (name or email).
 * Falls back gracefully if the image fails to load.
 *
 * Props:
 *  - name       {string}  First name (used for seed + gradient fallback)
 *  - lastName   {string}  Last name (optional, appended to seed)
 *  - email      {string}  Email (used as seed when name absent)
 *  - avatar     {string}  Existing avatar URL or Tailwind bg- class
 *  - size       {number}  Pixel size (default: 40)
 *  - className  {string}  Additional wrapper classes
 */

// DiceBear Avataaars v9 API — free, no key required, deterministic
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/avataaars/svg';

// Generate deterministic cartoon avatar URL from a seed string
const getCartoonUrl = (seed) => {
  const encoded = encodeURIComponent(seed || 'user');
  return `${DICEBEAR_BASE}?seed=${encoded}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`;
};

// Derive a gradient class from name for the absolute fallback
const GRADIENT_PAIRS = [
  ['from-violet-500', 'to-indigo-500'],
  ['from-sky-500', 'to-cyan-400'],
  ['from-emerald-500', 'to-teal-400'],
  ['from-amber-500', 'to-orange-400'],
  ['from-rose-500', 'to-pink-400'],
  ['from-fuchsia-500', 'to-purple-400'],
  ['from-blue-500', 'to-indigo-400'],
  ['from-lime-500', 'to-green-400'],
];

const getGradient = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
};

const UserAvatar = ({
  name = '',
  lastName = '',
  email = '',
  avatar,
  size = 40,
  className = '',
}) => {
  const [imgError, setImgError] = React.useState(false);

  // If a real image URL is passed as avatar use it directly
  if (avatar && (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.startsWith('/'))) {
    return (
      <img
        src={avatar}
        alt={name || 'User'}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => { e.currentTarget.src = getCartoonUrl(email || name); }}
      />
    );
  }

  // Cartoon style (cartoon:avataaars, cartoon:notionists, etc.)
  if (avatar && avatar.startsWith('cartoon:')) {
    const style = avatar.replace('cartoon:', '');
    const seed = email || `${name} ${lastName}`.trim() || 'user';
    const encoded = encodeURIComponent(seed);
    const customUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encoded}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`;

    if (imgError) {
      const initials = `${name?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
      const [from, to] = getGradient(seed);
      return (
        <div
          className={`bg-gradient-to-br ${from} ${to} rounded-full flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          <span className="text-white font-bold">{initials}</span>
        </div>
      );
    }

    return (
      <img
        src={customUrl}
        alt={name || email || 'User'}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 bg-slate-100 ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // If a Tailwind bg- color class was stored as avatar, show gradient initials
  if (avatar && avatar.startsWith('bg-')) {
    const initials = `${name?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    return (
      <div
        className={`${avatar} rounded-full flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        <span className="text-white font-bold">{initials}</span>
      </div>
    );
  }

  // Default: DiceBear cartoon avatar — use email or full name as seed
  const seed = email || `${name} ${lastName}`.trim() || 'user';
  const cartoonUrl = getCartoonUrl(seed);
  const [from, to] = getGradient(seed);
  const initials = `${name?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  if (imgError) {
    // Hard fallback: gradient circle with initials
    return (
      <div
        className={`bg-gradient-to-br ${from} ${to} rounded-full flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        <span className="text-white font-bold">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={cartoonUrl}
      alt={name || email || 'User'}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 bg-slate-100 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
};

export default UserAvatar;
