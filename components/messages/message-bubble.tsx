"use client";

import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageState } from "@/models/message";

export interface MessageBubbleProps {
  body: string;
  time: string;
  own?: boolean;
  state?: MessageState;
}

/** Chat bubble. Realtime + states wire up in Phase 9. */
export function MessageBubble({ body, time, own = false, state = "sent" }: MessageBubbleProps) {
  return (
    <div className={cn("flex", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
          own ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <p className="break-words whitespace-pre-line">{body}</p>
        <p
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[11px]",
            own ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {time}
          {own &&
            (state === "read" ? (
              <CheckCheck className="size-3.5" aria-label="Read" />
            ) : (
              <Check className="size-3.5" aria-label={state === "delivered" ? "Delivered" : "Sent"} />
            ))}
        </p>
      </div>
    </div>
  );
}
