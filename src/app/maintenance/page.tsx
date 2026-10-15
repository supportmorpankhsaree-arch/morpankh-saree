import { Metadata } from 'next';
import MaintenancePageContent from '@/components/MaintenancePageContent';

export const runtime = 'nodejs';

// Add "noindex, nofollow" meta tags to the maintenance page for SEO
export const metadata: Metadata = {
  title: 'Website Under Maintenance | Morpankh Saree',
  description: "We are currently performing scheduled maintenance to improve your shopping experience. We'll be back online shortly.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <MaintenancePageContent />;
}
