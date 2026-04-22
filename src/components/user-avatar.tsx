"use client";

import { useSignedImageUrl } from "@/hooks/use-signed-image-url";

type Props = {
  fullName: string;
  avatarKey?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({ fullName, avatarKey, size = 40, className = "" }: Props) {
  const { url, loading, error } = useSignedImageUrl(avatarKey ?? undefined);
  const initial = fullName?.charAt(0)?.toUpperCase() ?? "?";
  const dim = { width: size, height: size };

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={`rounded-full object-cover ${className}`}
        style={dim}
        referrerPolicy="no-referrer"
      />
    );
  }

  const showLoader = loading && !!avatarKey?.trim();

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-primary-fixed text-sm font-black text-primary ${showLoader ? "animate-pulse" : ""} ${className}`}
      style={dim}
      title={error && avatarKey ? "Could not load profile photo" : undefined}
    >
      {showLoader ? (
        <span className="text-[10px] font-bold text-primary/70">…</span>
      ) : (
        initial
      )}
    </div>
  );
}
