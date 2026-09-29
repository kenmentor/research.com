"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bibtexKey, formatAPA, formatBibTeX, formatMLA, type CiteMeta } from "@/lib/citations";

type Style = "APA" | "MLA" | "BibTeX";

export function CiteBox({ meta, pubId, canonicalUrl }: { meta: CiteMeta; pubId: string; canonicalUrl: string }) {
  const [style, setStyle] = useState<Style>("APA");
  const text =
    style === "APA"
      ? formatAPA(meta)
      : style === "MLA"
        ? formatMLA(meta)
        : formatBibTeX(meta, bibtexKey(meta, pubId));

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${style} citation copied — counted as a cite.`);
      // Manual-cite counter (best effort; copy already succeeded).
      fetch(`/api/publications/${pubId}/cite`, { method: "POST" }).catch(() => {});
    } catch {
      toast.error("Copy failed — select the text manually.");
    }
  }

  async function share() {
    const url = new URL(canonicalUrl, window.location.origin).href;
    const data = { title: meta.title, text: meta.title, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard.");
      }
    } catch {
      /* user dismissed — no toast */
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Cite this paper</CardTitle>
        <Tabs value={style} onValueChange={(v) => setStyle(v as Style)}>
          <TabsList>
            <TabsTrigger value="APA">APA</TabsTrigger>
            <TabsTrigger value="MLA">MLA</TabsTrigger>
            <TabsTrigger value="BibTeX">BibTeX</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <pre className="bg-muted overflow-x-auto rounded p-3 font-mono text-xs whitespace-pre-wrap">
          {text}
        </pre>
        <div className="flex gap-2">
          <Button size="sm" onClick={copyCitation}>
            Copy {style}
          </Button>
          <Button size="sm" variant="outline" onClick={share}>
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
