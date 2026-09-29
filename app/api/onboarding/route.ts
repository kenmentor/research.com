import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { emailTemplates, sendEmail } from "@/lib/email";
import { profileComplete } from "@/lib/profile";
import { onboardingSchema } from "@/lib/validators/onboarding";
import { ProfileModel } from "@/models/profile";

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  return slug.length >= 3 ? slug : "researcher";
}

async function uniqueUsername(base: string): Promise<string> {
  const root = slugify(base);
  for (let i = 0; i < 10; i++) {
    const candidate = i === 0 ? root : `${root}${i}`;
    const exists = await ProfileModel.exists({ username: candidate });
    if (!exists) return candidate;
  }
  return `${root}.${Date.now().toString(36)}`;
}

/** Onboarding status for the current user. */
export const GET = withApi(async () => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  await connectDB();
  const profile = await ProfileModel.findOne({ userId: session.user.id }).lean();
  return ok({ complete: profile ? profileComplete(profile) : false });
});

/** Create (or finish) the single profile for the current user. */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const body = onboardingSchema.parse(await req.json());

  await connectDB();
  const existing = await ProfileModel.findOne({ userId: session.user.id });
  const username =
    existing?.username ??
    body.username ??
    (await uniqueUsername(body.displayName));
  if (body.username) {
    const clash = await ProfileModel.findOne({
      username: body.username,
      userId: { $ne: session.user.id },
    });
    if (clash) {
      throw new ApiError(409, "USERNAME_TAKEN", "That username is taken.");
    }
  }

  const profile = await ProfileModel.findOneAndUpdate(
    { userId: session.user.id },
    {
      $setOnInsert: { userId: session.user.id, username },
      $set: {
        displayName: body.displayName,
        headline: body.headline,
        affiliation: body.affiliation,
        interests: body.interests,
        bio: body.bio ?? "",
        location: body.location ?? "",
      },
    },
    { upsert: true, returnDocument: "after" },
  ).lean();

  // First completion → welcome email (idempotent: brand-new profile docs only).
  if (profile && Date.now() - new Date(profile.createdAt).getTime() < 60_000 && session.user.email) {
    const to = session.user.email;
    const name = body.displayName;
    void sendEmail({ ...emailTemplates.welcome(name), to });
  }

  return ok({ username: profile?.username, complete: true }, 201);
});
