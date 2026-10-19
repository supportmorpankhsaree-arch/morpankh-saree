"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Calendar, Briefcase } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';

import { initialCareers } from '@/data/mockData';

interface Career {
  _id: string;
  title: string;
  excerpt: string;
  description: string;
  image: string;
  status: string;
  slug: string;
  createdAt: Date;
}

const CareerPage = () => {
  const [careers, setCareers] = useState<Career[]>(initialCareers);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCareers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      
      const res = await fetch(`/api/careers?${params}`);
      const result = await res.json();
      
      if (result?.success && Array.isArray(result.data)) {
        setCareers(result.data);
        return;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    // Fallback to initialCareers
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      setCareers(
        initialCareers.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.excerpt.toLowerCase().includes(q)
        )
      );
    } else {
      setCareers(initialCareers);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  return (
    <PublicLayout>
      <PageBanner
        title="MORPANKH SAREE • CAREERS"
        heading="Careers"
        subtitle="Join our team and build your career with Morpankh Saree."
      />
      <div className="container mx-auto px-4 py-12">

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search careers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Career Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : careers.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No open positions available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map((career) => (
              <Link
                key={career._id}
                href={`/career/${career.slug}`}
                className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={career.image}
                    alt={career.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    {new Date(career.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {career.title}
                  </h3>
                  <p className="text-dark-grey text-sm line-clamp-3 mb-4">
                    {career.excerpt}
                  </p>
                  <span className="inline-flex items-center text-primary font-medium text-sm group-hover:underline">
                    View Details
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default CareerPage;
