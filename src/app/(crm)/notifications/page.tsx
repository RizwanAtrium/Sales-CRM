import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <AnimatedPage><PageHeader title="Notifications" description="Due work, approvals, payments, and system alerts." /><NotificationCenter /></AnimatedPage>;
}
