'use client';

import { Megaphone } from 'lucide-react';

export default function CampaignsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="w-8 h-8 text-purple-600" />
        <h1 className="text-2xl font-bold">Super Coins Campaigns</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Campaign management feature coming soon.</p>
      </div>
    </div>
  );
}
