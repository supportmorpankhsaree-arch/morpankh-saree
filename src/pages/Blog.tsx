"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Calendar, ArrowRight, Sparkles, Clock } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';

import { initialBlogs } from '@/data/mockData';

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
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBlogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      
      const res = await fetch(`/api/blogs?${params}`);
      const result = await res.json();
      
      if (result?.success && Array.isArray(result.data)) {
        setBlogs(result.data);
        return;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    // Fallback to initialBlogs
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      setBlogs(
        initialBlogs.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.excerpt.toLowerCase().includes(q)
        )
      );
    } else {
      setBlogs(initialBlogs);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, idx) => (
              <Link
                key={blog._id}
                href={`/blog/${blog.slug}`}
                className="group relative flex flex-col bg-card rounded-2xl overflow-hidden border border-border/70 hover:border-primary/50 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* Image Container with Luxury Aspect Ratio & Overlay Badges */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-muted/30">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-top group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  {/* Subtle bottom gradient to blend image nicely */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-black/90 text-primary shadow-sm backdrop-blur-md border border-white/30">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {idx % 3 === 0 ? 'Heritage Guide' : idx % 3 === 1 ? 'Styling Tips' : 'Saree Care'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 text-white shadow-sm backdrop-blur-md">
                      <Clock className="w-3 h-3" />
                      4 min read
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <span>
                        {new Date(blog.blogDate || blog.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-serif mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {blog.title}
                    </h3>

                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mb-6">
                      {blog.excerpt}
                    </p>
                  </div>

                  {/* Card Action */}
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Read Story
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                      Morpankh Stories
                    </span>
                  </div>
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
