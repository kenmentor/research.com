"use client";

import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/app-shell/mode-toggle";
import { EmptyState, ErrorState } from "@/components/common/states";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { FeedCard } from "@/components/feed/feed-card";
import { MessageBubble } from "@/components/messages/message-bubble";
import { NetworkRow } from "@/components/network/network-row";
import { ProfileHeader } from "@/components/profile/profile-header";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

const SWATCHES = [
  ["bg-background text-foreground border", "Background"],
  ["bg-card text-card-foreground border", "Card"],
  ["bg-primary text-primary-foreground", "Primary"],
  ["bg-secondary text-secondary-foreground", "Secondary"],
  ["bg-muted text-muted-foreground", "Muted"],
  ["bg-accent text-accent-foreground", "Accent"],
  ["bg-destructive text-white", "Destructive"],
] as const;

export default function DesignPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Design system</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Section title="1 · Theme tokens (LinkedIn palette, CSS vars only)">
        <div className="flex flex-wrap items-center gap-2">
          {SWATCHES.map(([cls, label]) => (
            <span key={label} className={`rounded border px-3 py-1.5 text-xs font-medium ${cls}`}>
              {label}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2 text-sm">
            Light default · toggle persists <ModeToggle />
          </span>
        </div>
      </Section>

      <Section title="2 · Primitives">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button onClick={() => toast.success("Toast works")}>Toast</Button>
          <ResponsiveDialog
            trigger={<Button variant="outline">Responsive modal</Button>}
            title="Dialog on desktop, sheet on mobile"
            description="Resize below 768px and reopen to see the drawer."
          >
            <p className="text-sm">Same content, adaptive container.</p>
          </ResponsiveDialog>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Avatar><AvatarFallback>AR</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>TN</AvatarFallback></Avatar>
        </div>
        <div className="flex max-w-md flex-wrap items-center gap-2">
          <Input placeholder="Search researchers, papers…" />
          <label className="flex items-center gap-2 text-sm">
            <Switch defaultChecked /> Email digests
          </label>
        </div>
        <Tabs defaultValue="papers">
          <TabsList>
            <TabsTrigger value="papers">Papers</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>
          <TabsContent value="papers" className="text-sm">Paper filters live here.</TabsContent>
          <TabsContent value="people" className="text-sm">People filters live here.</TabsContent>
        </Tabs>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead className="text-right">Cites</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Oral tradition in the Sahel</TableCell>
              <TableCell>WAR Papers</TableCell>
              <TableCell className="text-right">42</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Progress value={68} aria-label="Profile completeness demo" />
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>New connection requests appear in My Network.</AlertDescription>
        </Alert>
      </Section>

      <Section title="3 · Composites (shadcn-only)">
        <ProfileHeader
          displayName="Dr. Amara Okafor"
          headline="Public Health Researcher"
          affiliation="University of Lagos"
          location="Lagos, Nigeria"
          initials="AO"
          verified
        />
        <FeedCard
          authorName="Dr. Amara Okafor"
          authorHeadline="Public Health Researcher"
          authorInitials="AO"
          authorUsername="amara-okafor"
          timeAgo="2h"
          body="New preprint on community health workers and vaccine uptake across three states."
          paperTitle="Community health workers and vaccine uptake"
          paperHref="/pub/comm-health-workers"
          paperVenue="EClinicalMedicine"
          paperYear={2025}
          likes={42}
          comments={7}
          reposts={3}
        />
        <div className="bg-card flex flex-col gap-2 rounded-lg border p-4">
          <MessageBubble body="I read your paper — brilliant work on uptake." time="09:41" />
          <MessageBubble body="Thank you! Happy to walk you through the data." time="09:43" own state="read" />
        </div>
        <NetworkRow name="Tunde Adeyemi" username="tunde-adeyemi" headline="Computer Science · ABU Zaria" initials="TA" mutuals={3} variant="invite" />
        <NetworkRow name="Ngozi Eze" username="ngozi-eze" headline="Linguistics · UNN" initials="NE" mutuals={1} />
      </Section>

      <Section title="4 · Loading / empty / error states">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
        </div>
        <EmptyState
          title="No messages yet"
          description="When researchers write to you, conversations land here."
          actionLabel="Find researchers"
        />
        <ErrorState description="The feed failed to load in this demo." />
      </Section>
    </div>
  );
}
