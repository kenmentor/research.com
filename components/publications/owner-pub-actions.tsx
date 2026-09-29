"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  PublicationFormDialog,
  toDraft,
} from "@/components/publications/publication-form-dialog";

export function OwnerPubActions({ pub }: { pub: Parameters<typeof toDraft>[0] }) {
  const router = useRouter();

  async function remove() {
    if (!pub?._id && !pub?.id) return;
    const id = pub.id ?? pub._id;
    const res = await fetch(`/api/publications/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast.error(json?.error?.message ?? "Could not delete.");
      return;
    }
    toast.success("Publication deleted.");
    router.push("/");
  }

  return (
    <div className="flex gap-2">
      <PublicationFormDialog
        trigger={<Button variant="outline" size="sm">Edit</Button>}
        title="Edit publication"
        initial={toDraft(pub)}
        onSaved={() => router.refresh()}
      />
      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant="outline" size="sm">Delete</Button>}
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this publication?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your profile immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
