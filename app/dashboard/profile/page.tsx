import { getSchoolOptions } from "@/lib/schools-server";
import { requireContributor } from "@/lib/auth";
import ProfileForm from "@/components/dashboard/ProfileForm";

export default async function ProfilePage() {
  const profile = await requireContributor();
  return <ProfileForm profile={profile} schools={await getSchoolOptions()} />;
}
