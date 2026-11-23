import type { ReactNode } from "react";
import { RoleId } from "src/lib/game/types";

/** Line weight by rendered size: small avatars need heavier strokes to stay legible. */
function getStrokeWidth(size: number): number {
  if (size >= 96) {
    return 2.6;
  }

  return size >= 56 ? 3.2 : 4.2;
}

const GOLD = "#D9B56A";
const IVORY = "#F1EBDD";
const INK = "#121216";

/** The drawn body of each role's avatar, on a 120 viewBox, inside the shared medallion. */
const ART: Record<RoleId, (strokeWidth: number) => ReactNode> = {
  [RoleId.Werewolf]: (strokeWidth) => (
    <>
      <circle cx="60" cy="50" r="31" fill="#EAD9AE" fillOpacity=".92" />
      <g
        stroke={GOLD}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeWidth }}
      >
        <path
          d="M60 40 L50 38 L38 17 L34 44 L30 52 L23 61 L31 62 L25 72 L35 70 L42 80 L52 90 L60 94 L68 90 L78 80 L85 70 L95 72 L89 62 L97 61 L90 52 L86 44 L82 17 L70 38 Z"
          fill="#17171C"
        />
        <path
          d="M40 24 L47 38 L37 40 Z M80 24 L73 38 L83 40 Z"
          fill="#2A2A31"
          stroke="none"
        />
        <path d="M40 53 L52 57 M80 53 L68 57" fill="none" />
        <path d="M54 63 L55 76 M66 63 L65 76" fill="none" strokeOpacity=".6" />
        <path
          d="M42 58 L52 60.5 L45 64 Z M78 58 L68 60.5 L75 64 Z"
          fill="#E0524B"
          stroke="none"
        />
        <path d="M54.5 77 L65.5 77 L60 84 Z" fill={GOLD} />
        <path d="M60 84 L60 87 M54 88 Q60 91 66 88" fill="none" />
      </g>
    </>
  ),
  [RoleId.Villager]: (strokeWidth) => (
    <g
      fill="none"
      stroke={GOLD}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth }}
    >
      <path
        d="M67 31 q-4 -4 0 -8 q4 -4 0 -8"
        stroke={IVORY}
        strokeOpacity=".7"
      />
      <path d="M64 46 L64 36 L70 36 L70 51" />
      <path d="M24 62 L52 38 L80 62" />
      <path d="M31 56 L31 90 L73 90 L73 56" />
      <rect x="36" y="64" width="10" height="10" fill="#F2A93B" />
      <path d="M41 64 V74 M36 69 H46" stroke={INK} strokeWidth="1.4" />
      <rect x="52" y="71" width="12" height="19" />
      <path d="M86 92 L94 44" />
      <path d="M88 44.5 L100 46.5 M88 44.5 L89.5 35 M94 45.5 L95.5 36 M100 46.5 L101.5 37" />
      <path d="M22 90 L98 90" />
    </g>
  ),
  [RoleId.Seer]: (strokeWidth) => (
    <g
      fill="none"
      stroke={GOLD}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth }}
    >
      <path
        d="M32 26 L33.6 31.4 L39 33 L33.6 34.6 L32 40 L30.4 34.6 L25 33 L30.4 31.4 Z"
        fill={GOLD}
        stroke="none"
      />
      <path
        d="M88 24 L89 28 L93 29 L89 30 L88 34 L87 30 L83 29 L87 28 Z"
        fill={GOLD}
        stroke="none"
      />
      <circle cx="60" cy="54" r="24" />
      <path d="M44 54 Q60 42 76 54 Q60 66 44 54 Z" stroke={IVORY} />
      <circle cx="60" cy="54" r="5" fill="#9DB8FF" stroke="none" />
      <path d="M42 80 L78 80 L72 92 L48 92 Z" />
    </g>
  ),
  [RoleId.Doctor]: (strokeWidth) => (
    <g
      fill="none"
      stroke={GOLD}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth }}
    >
      <path d="M60 28 L86 37 L86 60 Q86 82 60 94 Q34 82 34 60 L34 37 Z" />
      <path
        d="M55 45 H65 V56 H76 V66 H65 V77 H55 V66 H44 V56 H55 Z"
        fill="#6FCF97"
        stroke="none"
      />
    </g>
  ),
  [RoleId.Witch]: (strokeWidth) => (
    <g
      fill="none"
      stroke={GOLD}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth }}
    >
      <ellipse cx="60" cy="58" rx="32" ry="7" fill={INK} />
      <path
        d="M43 57 Q52 42 57 27 Q61 15 73 17 Q64 21 64 30 Q66 45 77 57 Z"
        fill={INK}
      />
      <path
        d="M46 51 Q60 55 74 51 L76 56.5 Q60 61 44 56.5 Z"
        fill="#B48CFF"
        stroke="none"
      />
      <rect x="57" y="51.5" width="6" height="6" strokeWidth="1.6" />
      <path d="M46 70 H54" />
      <path
        d="M47 71 L47 75 Q39 79 41 86 Q43 94 50 94 Q57 94 59 86 Q61 79 53 75 L53 71 Z"
        fill="#6FCF97"
      />
      <path d="M66 70 H78" />
      <path d="M67 71 L67 75 L62 94 L82 94 L77 75 L77 71 Z" fill="#B48CFF" />
    </g>
  ),
  [RoleId.Hunter]: (strokeWidth) => (
    <g
      fill="none"
      stroke={GOLD}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth }}
    >
      <path d="M58 22 Q96 60 58 98" />
      <path d="M58 22 L36 60 L58 98" stroke={IVORY} strokeWidth="1.4" />
      <path d="M36 60 L90 60" stroke={IVORY} />
      <path d="M100 60 L89 54 L89 66 Z" fill="#F2A93B" stroke="#F2A93B" />
      <path d="M37 60 L31 54 M37 60 L31 66 M43 60 L37 54 M43 60 L37 66" />
      <path d="M75 55 L75 65" strokeWidth="5" />
    </g>
  ),
  [RoleId.Cupid]: (strokeWidth) => (
    <g
      fill="none"
      stroke={GOLD}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth }}
    >
      <path
        d="M46 56 C38 40 26 32 16 36 Q13 44 22 44 Q19 52 28 52 Q27 60 36 58 Q38 65 46 64 Z"
        fill={INK}
      />
      <path d="M43 57 L24 41 M44 60 L30 50" fill="none" strokeOpacity=".6" />
      <path
        d="M74 56 C82 40 94 32 104 36 Q107 44 98 44 Q101 52 92 52 Q93 60 84 58 Q82 65 74 64 Z"
        fill={INK}
      />
      <path d="M77 57 L96 41 M76 60 L90 50" fill="none" strokeOpacity=".6" />
      <path
        d="M60 92 C30 72 32 44 48 44 C55 44 60 49 60 54 C60 49 65 44 72 44 C88 44 90 72 60 92 Z"
        fill="#FF7A9A"
      />
      <path d="M30 88 L88 34" stroke={IVORY} />
      <path d="M94 28 L81 32 L90 41 Z" fill={GOLD} />
      <path d="M30 88 L24 86 M30 88 L32 94 M35 83 L29 81 M35 83 L37 89" />
    </g>
  ),
  [RoleId.Fool]: (strokeWidth) => (
    <g
      fill="none"
      stroke={GOLD}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth }}
    >
      <path d="M42 64 Q36 44 22 40 Q40 42 52 64 Z" fill="#E0524B" />
      <path d="M78 64 Q84 44 98 40 Q80 42 68 64 Z" fill="#E0524B" />
      <path d="M50 64 Q54 38 60 22 Q66 38 70 64 Z" fill={INK} />
      <circle cx="22" cy="40" r="4" fill={GOLD} />
      <circle cx="60" cy="20" r="4" fill={GOLD} />
      <circle cx="98" cy="40" r="4" fill={GOLD} />
      <circle cx="60" cy="84" r="14" fill={INK} />
      <path d="M40 64 L80 64 L78 72 L42 72 Z" fill={INK} />
      <path
        d="M50 68 L53 65.5 L56 68 L53 70.5 Z M64 68 L67 65.5 L70 68 L67 70.5 Z"
        fill={GOLD}
        stroke="none"
      />
      <path d="M52 81 Q54.5 78 57 81 M63 81 Q65.5 78 68 81" stroke={IVORY} />
      <path d="M51 87 Q60 96 69 87" stroke={IVORY} />
    </g>
  ),
};

/**
 * A role's drawn medallion.
 * @param props.role - Which role to draw.
 * @param props.size - Rendered width and height in px; also sets the line weight.
 * @param props.label - The role's name for assistive tech; omit it for a purely decorative avatar.
 * @returns The avatar, hidden from assistive tech unless it has a label.
 */
export function RoleAvatar({
  role,
  size,
  label,
}: {
  role: RoleId;
  size: number;
  label?: string;
}) {
  const body = (
    <>
      <circle
        cx="60"
        cy="60"
        r="57"
        fill={INK}
        stroke={GOLD}
        strokeWidth="2.5"
      />
      <circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke={GOLD}
        strokeOpacity=".4"
        strokeWidth="1"
      />
      {ART[role](getStrokeWidth(size))}
    </>
  );

  return label === undefined ? (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden="true"
    >
      {body}
    </svg>
  ) : (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className="shrink-0"
      role="img"
      aria-label={label}
    >
      {body}
    </svg>
  );
}
