'use client';

import { Zap } from 'lucide-react';

export default function MultipliersPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-8 h-8 text-purple-600" />
        <h1 className="text-2xl font-bold">Super Coins Multipliers</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Coin multiplier management feature coming soon.</p>
      </div>
    </div>
  );
}
