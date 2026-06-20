import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { NewTeamMemberForm } from "@/components/team/new-team-member-form";

export const metadata = { title: "Add Team Member" };

export default function NewTeamMemberPage() {
  return <AnimatedPage><PageHeader title="Add team member" description="Create a role-controlled account within the sales hierarchy." /><NewTeamMemberForm /></AnimatedPage>;
}
