"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ProfileAvatarProps {
  /** Remote image URL. Falls back to initials when empty or broken. */
  src?: string | null;
  alt: string;
  initials: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  fallbackClassName?: string;
}

/**
 * A researcher's avatar.
 *
 * `ProfileDoc.avatarUrl` has always existed on the model but nothing in
 * the UI read it — every avatar was initials-only, so a stored image
 * could never appear. This is the single place that honours it, and
 * Base UI shows the fallback automatically if the image is missing or
 * fails to load.
 */
export function ProfileAvatar({
  src,
  alt,
  initials,
  size = "default",
  className,
  fallbackClassName,
}: ProfileAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
    </Avatar>
  );
}
