"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Calendar, ArrowLeft, Briefcase } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';

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

const CareerDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [career, setCareer] = useState<Career | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCareer = useCallback(async () => {
    try {
      const res = await fetch(`/api/careers`);
      const result = await res.json();
      
      if (result?.success && Array.isArray(result.data)) {
        const foundCareer = result.data.find((c: Career) => c.slug === params?.slug);
        if (foundCareer) {
          setCareer(foundCareer);
          return;
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    // Fallback to initialCareers
    const fallback =
      initialCareers.find((c) => c.slug === params?.slug) || null;
    setCareer(fallback);
  }, [params?.slug]);

  useEffect(() => {
    if (params?.slug) fetchCareer();
  }, [params?.slug, fetchCareer]);

  const handleApply = () => {
    toast({ 
      title: 'Application', 
      description: 'Thank you for your interest! Please send your resume to careers@morpankh.com',
    });
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!career) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">Career not found</p>
            <Link href="/career" className="inline-block mt-4 text-primary hover:underline">
              Back to Careers
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/career"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Careers
        </Link>

        {/* Featured Image */}
        <div className="relative aspect-[16/9] w-full max-w-4xl mx-auto mb-8 rounded-xl overflow-hidden">
          <Image
            src={career.image}
            alt={career.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Career Content */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            Posted on {new Date(career.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">{career.title}</h1>

          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {career.description}
            </p>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Briefcase className="h-5 w-5" />
            Apply Now
          </button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default CareerDetailPage;
