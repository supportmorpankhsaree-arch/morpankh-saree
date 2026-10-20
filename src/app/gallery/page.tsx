"use client";

import { useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import logo from '@/assets/logo.png';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const galleryImages = [
    { id: 1, src: '/IMG_8328.JPG.jpeg', alt: 'Shop Collection 1 - Bridal Display', category: 'Collection' },
    { id: 2, src: '/IMG_8329.JPG.jpeg', alt: 'Shop Collection 2 - Silk Saree Showcase', category: 'Collection' },
    { id: 3, src: '/IMG_8330.JPG.jpeg', alt: 'Shop Collection 3 - Customer Experience', category: 'Collection' },
    { id: 4, src: '/IMG_8331.JPG.jpeg', alt: 'Shop Collection 4 - Paithani Wall', category: 'Collection' },
    { id: 5, src: '/IMG_8332.JPG.jpeg', alt: 'Shop Collection 5 - Traditional Drapes', category: 'Collection' },
    { id: 6, src: '/IMG_8333.JPG.jpeg', alt: 'Shop Collection 6 - Store Interior', category: 'Collection' },
    { id: 7, src: '/IMG_8334.JPG.jpeg', alt: 'Shop Collection 7 - Festive Racks', category: 'Collection' },
    { id: 8, src: '/IMG_8335.JPG.jpeg', alt: 'Shop Collection 8 - Handloom Treasures', category: 'Collection' },
    { id: 9, src: '/IMG_8338.JPG.jpeg', alt: 'Shop Collection 9 - Premium Silk Palette', category: 'Collection' },
    { id: 10, src: '/IMG_8339.JPG.jpeg', alt: 'Shop Collection 10 - Exclusive Zari Borders', category: 'Collection' },
    { id: 11, src: '/IMG_8340.JPG.jpeg', alt: 'Shop Collection 11 - Store Atmosphere', category: 'Collection' },
    { id: 12, src: '/IMG_8341.JPG.jpeg', alt: 'Shop Collection 12 - Bridal Consultation', category: 'Collection' },
    { id: 13, src: '/IMG_8342.JPG.jpeg', alt: 'Shop Collection 13 - Designer Ensemble', category: 'Collection' },
    { id: 14, src: '/IMG_8343.JPG.jpeg', alt: 'Shop Collection 14 - Royal Silk Corner', category: 'Collection' },
    { id: 15, src: '/IMG_8344.JPG.jpeg', alt: 'Shop Collection 15 - Colorful Motifs', category: 'Collection' },
    { id: 16, src: '/ShopImg.jpeg', alt: 'Shop Exterior & Grand Entrance', category: 'Store' },
  ];

  const currentModalImage = galleryImages.find((img) => img.id === selectedImage);

  return (
    <PublicLayout>
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}
        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}
        @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
        @keyframes zoomPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
        @keyframes cardReveal{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}

        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}

        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
        .spin-ring{animation:spinSlow 22s linear infinite}

        /* Pinterest grid */
        .pin-card{animation:cardReveal 0.5s ease both;transition:transform 0.3s ease,box-shadow 0.3s ease}
        .pin-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 20px 48px rgba(0,0,0,0.22);z-index:10}
        .pin-card img{transition:transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)}
        .pin-card:hover img{transform:scale(1.1)}
        .pin-overlay{background:linear-gradient(to top,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.2) 50%,transparent 100%);opacity:0;transition:opacity 0.35s ease}
        .pin-card:hover .pin-overlay{opacity:1}
        .pin-label{transform:translateY(8px);opacity:0;transition:transform 0.3s ease,opacity 0.3s ease}
        .pin-card:hover .pin-label{transform:translateY(0);opacity:1}

        /* Modal */
        .modal-backdrop{backdrop-filter:blur(12px)}
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        {/* Background gradient & decorative orbs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(160deg,hsl(var(--primary)/0.06) 0%,hsl(var(--background)) 50%,hsl(var(--secondary)/0.08) 100%)',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 380,
            height: 380,
            top: -80,
            right: -100,
            background: 'radial-gradient(circle,hsl(var(--primary)/0.12),transparent 70%)',
            animation: 'float1 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 260,
            height: 260,
            bottom: 60,
            left: -80,
            background: 'radial-gradient(circle,hsl(var(--secondary)/0.10),transparent 70%)',
            animation: 'float2 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 180,
            height: 180,
            top: '40%',
            left: '5%',
            background: 'radial-gradient(circle,hsl(var(--primary)/0.07),transparent 70%)',
            animation: 'float3 9s ease-in-out infinite',
          }}
        />

        {/* Hero Banner */}
        <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg,hsl(var(--primary)/0.95),hsl(168 60% 18%))',
            }}
          />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px,white 1px,transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          <div className="absolute" style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}>
            <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
          </div>
          <div className="absolute" style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}>
            <div className="w-12 h-12 rounded-full border-2 border-white/20" />
          </div>
          <div className="absolute" style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}>
            <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
          </div>
          <div className="absolute" style={{ top: '20%', right: '25%', animation: 'spinSlow 18s linear infinite' }}>
            <div className="w-20 h-20 rounded-full border border-dashed border-white/15" />
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">Morpankh Saree · Gallery</p>
            <h1 className="text-4xl font-bold mb-2">Our Gallery</h1>
            <p className="text-white/70 text-sm max-w-md">
              Explore our beautiful shop collection showcasing our finest products and store atmosphere.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Section heading */}
          <div className="text-center mb-14 fade-up-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Our Collection
            </div>
            <h2 className="text-3xl font-bold mb-3 text-foreground">A Glimpse into Morpankh Sarees</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our beautiful shop collection showcasing our finest products, rich textiles, and welcoming store atmosphere.
            </p>
          </div>

          {/* Logo card */}
          <div className="max-w-6xl mx-auto mb-12 fade-up-2">
            <div
              className="rounded-2xl p-8 border border-border/60 shadow-xl backdrop-blur-xl"
              style={{ background: 'hsl(var(--card)/0.85)' }}
            >
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div
                    className="absolute inset-0 rounded-full spin-ring"
                    style={{ border: '2px dashed hsl(var(--primary)/0.25)', margin: '-12px' }}
                  />
                  <div
                    className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center border border-primary/20 shadow-inner logo-pulse"
                    style={{ background: 'hsl(var(--primary)/0.08)' }}
                  >
                    <Image src={logo} alt="Morpankh Logo" height={72} width={72} className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                    Our Shop Experience
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                    Our gallery showcases the authentic atmosphere of our boutique store and the quality products we offer,
                    carefully curated to provide the ultimate saree shopping experience for our valued patrons.
                  </p>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm rounded-xl my-4 p-5 border border-primary/15"
                    style={{ background: 'hsl(var(--primary)/0.06)' }}
                  >
                    {[
                      'Beautiful shop ambiance',
                      'Quality handloom collections',
                      'Customer-first consultation',
                      'Traditional & modern designs',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-foreground font-medium">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: 'hsl(var(--primary))' }}
                        />
                        {item}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click any image below to zoom in and explore the fine details of our store.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pinterest Mosaic Grid */}
          <div className="max-w-6xl mx-auto fade-up-3 px-4">
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-[160px] gap-4"
              style={{ gridAutoFlow: 'dense' }}
            >
              {galleryImages.map((image, index) => {
                const layouts = [
                  'row-span-2',
                  '',
                  '',
                  'row-span-2 md:col-span-2',
                  'row-span-2',
                  '',
                  '',
                  'md:col-span-2',
                ];
                return (
                  <div
                    key={image.id}
                    onClick={() => setSelectedImage(image.id)}
                    className={`pin-card relative overflow-hidden rounded-2xl cursor-pointer group ${
                      layouts[index % layouts.length]
                    }`}
                    style={{ animationDelay: `${(index % 8) * 65}ms` }}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
                    />
                    <div className="pin-overlay absolute inset-0" />
                    <div className="pin-label absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                      <p className="text-white text-xs sm:text-sm font-semibold leading-tight drop-shadow">
                        {image.alt}
                      </p>
                      <span className="p-1.5 rounded-full bg-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {currentModalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-black/90 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-[70vh]">
              <Image
                src={currentModalImage.src}
                alt={currentModalImage.alt}
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="w-full p-4 bg-background/90 text-center border-t border-border">
              <p className="font-semibold text-foreground text-base">{currentModalImage.alt}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{currentModalImage.category} Collection</p>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}