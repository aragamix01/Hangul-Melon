"use client";

import { AudioBucket, speakKo } from "@/lib/audio";
import { C } from "./theme";

export function SpeakerIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function SpeakerButton({
  text,
  bucket,
  label,
  size = 62,
  radius = 22,
  icon = 26,
}: {
  text: string;
  bucket: AudioBucket;
  label: string;
  size?: number;
  radius?: number;
  icon?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => void speakKo(text, bucket)}
      aria-label={label}
      title={label}
      className="btn-pink"
      style={{
        border: "none",
        cursor: "pointer",
        width: size,
        height: size,
        borderRadius: radius,
        background: C.pink,
        color: C.surface,
        boxShadow: `0 4px 0 ${C.pinkDeep}`,
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
    >
      <SpeakerIcon size={icon} />
    </button>
  );
}
