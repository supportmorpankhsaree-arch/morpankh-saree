"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Calendar } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';

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

const BlogPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      
      const res = await fetch(`/api/blogs?${params}`);
      const result = await res.json();
      
      if (result.success) {
        setBlogs(result.data);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch blogs', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast({ title: 'Error', description: 'Failed to fetch blogs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <PublicLayout>
      <PageBanner
        title="MORPANKH SAREE • BLOG"
        heading="Blog"
        subtitle="Stay updated with the latest saree trends, styling tips, and fashion insights."
      />
      <div className="container mx-auto px-4 py-12">

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">No blogs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                href={`/blog/${blog.slug}`}
                className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    {new Date(blog.blogDate || blog.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-dark-grey text-sm line-clamp-3 mb-4">
                    {blog.excerpt}
                  </p>
                  <span className="inline-flex items-center text-primary font-medium text-sm group-hover:underline">
                    Read More
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

export default BlogPage;
