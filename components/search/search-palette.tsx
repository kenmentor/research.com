"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Results {
  people: Array<{ _id: string; username: string; displayName: string; headline: string }>;
  papers: Array<{ _id: string; title: string; venue: string; year?: number }>;
  posts: Array<{ _id: string; body: string; author?: { username: string; displayName: string } }>;
  topics: Array<{ tag: string; papers?: number; count?: number }>;
}

/** Global Cmd+K palette: people, papers, posts, topics. */
export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>({ people: [], papers: [], posts: [], topics: [] });
  const [trending, setTrending] = useState<Array<{ tag: string }>>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetch("/api/trending")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.topics) setTrending(j.data.topics);
      })
      .catch(() => {});
  }, [open ]);

  useEffect(() => {
    if (!open || q.trim().length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        if (!cancelled && res.ok) setResults(json.data);
      } catch {
        /* keep previous results */
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, open ]);

  function onQueryChange(v: string) {
    setQ(v);
    if (v.trim().length < 2) setResults({ people: [], papers: [], posts: [], topics: [] });
  }

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQ("");
      router.push(href);
    },
    [router],
  );

  const showTrending = q.trim().length < 2;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search researchers, papers, posts, topics…" value={q} onValueChange={onQueryChange} />
      <CommandList>
        <CommandEmpty>No results. Try at least 2 characters.</CommandEmpty>
        {showTrending ? (
          <CommandGroup heading="Trending">
            {trending.map((t) => (
              <CommandItem key={t.tag} value={`topic-${t.tag}`} onSelect={() => go(`/topics/${encodeURIComponent(t.tag)}`)}>
                #{t.tag}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <>
            {results.people.length > 0 && (
              <CommandGroup heading="People">
                {results.people.map((p) => (
                  <CommandItem key={p._id} value={`person-${p.username}`} onSelect={() => go(`/in/${p.username}`)}>
                    {p.displayName} · {p.headline}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.papers.length > 0 && (
              <CommandGroup heading="Papers">
                {results.papers.map((p) => (
                  <CommandItem key={p._id} value={`paper-${p._id}`} onSelect={() => go(`/pub/${p._id}`)}>
                    {p.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.posts.length > 0 && (
              <CommandGroup heading="Posts">
                {results.posts.map((p) => (
                  <CommandItem key={p._id} value={`post-${p._id}`} onSelect={() => go(`/#post-${p._id}`)}>
                    {p.body}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.topics.length > 0 && (
              <CommandGroup heading="Topics">
                {results.topics.map((t) => (
                  <CommandItem key={t.tag} value={`topic-${t.tag}`} onSelect={() => go(`/topics/${encodeURIComponent(t.tag)}`)}>
                    #{t.tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
