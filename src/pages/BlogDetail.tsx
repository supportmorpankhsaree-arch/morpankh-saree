"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Calendar, ArrowLeft } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';

interface Blog {
  _id: string;
  title: string;
  excerpt: string;
  description: string;
  image: string;
  status: string;
  slug: string;
  blogDate?: string;
  createdAt: Date;
}

const BlogDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBlog = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blogs`);
      const result = await res.json();
      
      if (result.success) {
        const foundBlog = result.data.find((b: Blog) => b.slug === params?.slug);
        if (foundBlog) {
          setBlog(foundBlog);
        } else {
          toast({ title: 'Error', description: 'Blog not found', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Error', description: 'Failed to fetch blog', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast({ title: 'Error', description: 'Failed to fetch blog', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [params?.slug]);

  useEffect(() => {
    if (params?.slug) fetchBlog();
  }, [params?.slug, fetchBlog]);

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

  if (!blog) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">Blog not found</p>
            <Link href="/blog" className="inline-block mt-4 text-primary hover:underline">
              Back to Blog
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
          href="/blog"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Featured Image */}
        <div className="relative aspect-[16/9] w-full max-w-4xl mx-auto mb-8 rounded-xl overflow-hidden bg-muted">
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Blog Content */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            {new Date(blog.blogDate || blog.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">{blog.title}</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {blog.description}
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default BlogDetailPage;
