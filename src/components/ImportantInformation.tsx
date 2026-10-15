'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

const ImportantInformation = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  const items = [
    {
      id: 'product-description',
      title: 'Product Description',
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Our sarees are handcrafted with love and precision by skilled artisans. Each piece tells a story of tradition and artistry.
          </p>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Product Specification</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Material: Premium silk, cotton, or blended fabric</li>
              <li>Length: Standard 5.5 to 6.5 meters</li>
              <li>Width: 44-46 inches</li>
              <li>Blouse piece: 0.8 meters included</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Product Details</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Handwoven with traditional techniques</li>
              <li>Authentic zari work</li>
              <li>Vibrant, long-lasting colors</li>
              <li>Comfortable and lightweight</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="font-medium text-foreground">Important Note:</p>
            <p>Actual product colors may vary slightly from images due to lighting and screen settings.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'shipping',
      title: 'Shipping & Delivery',
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Shipping Charges</h4>
            <p>Free shipping on orders above ₹999. Standard shipping charges of ₹49 apply for orders below ₹999.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Delivery Timeline</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Metro cities: 3-5 business days</li>
              <li>Other cities: 5-7 business days</li>
              <li>Remote areas: 7-10 business days</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">International Shipping</h4>
            <p>International shipping available to select countries. Delivery time varies by destination (10-15 business days).</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Tracking Information</h4>
            <p>Once shipped, you will receive tracking details via email and SMS to track your order in real-time.</p>
          </div>
          <button className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            View Full Shipping Policy <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      id: 'returns',
      title: 'Returns & Exchange',
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Return Eligibility</h4>
            <p>Returns accepted within 7 days of delivery for eligible products. Items must be unused, unwashed, and in original packaging.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Return Period</h4>
            <p>Initiate return request within 7 days of delivery. Refund will be processed within 7-10 business days after we receive the returned item.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Product Conditions</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Original tags and packaging must be intact</li>
              <li>No signs of wear, damage, or alteration</li>
              <li>Free from stains, odors, or pet hair</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Refund Information</h4>
            <p>Refunds will be credited to the original payment method. For COD orders, refund will be processed via bank transfer or UPI.</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="font-medium text-foreground">Important Note:</p>
            <p>Customized or personalized items are not eligible for return or exchange unless defective.</p>
          </div>
          <button className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            View Full Return Policy <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      id: 'care',
      title: 'Care Instructions',
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-2">
            <li>Dry clean only for best results</li>
            <li>Use mild detergent if hand washing</li>
            <li>Do not bleach or use harsh chemicals</li>
            <li>Dry in shade to preserve colors</li>
            <li>Iron on low heat or use steam</li>
            <li>Store in a cool, dry place</li>
            <li>Avoid direct sunlight for prolonged periods</li>
            <li>Use saree covers for protection</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto mt-16 mb-12">
      <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'hsl(var(--primary))' }}>
        Important Information
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border/60 shadow-lg overflow-hidden transition-all duration-300"
            style={{ background: 'hsl(var(--card)/0.85)' }}
          >
            <button
              onClick={() => toggleAccordion(item.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-primary/5 transition-colors"
            >
              <span className="font-semibold text-base" style={{ color: 'hsl(var(--primary))' }}>
                {item.title}
              </span>
              {openAccordion === item.id ? (
                <ChevronUp className="h-5 w-5 text-primary" />
              ) : (
                <ChevronDown className="h-5 w-5 text-primary" />
              )}
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openAccordion === item.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
              style={{
                maxHeight: openAccordion === item.id ? '2000px' : '0px',
              }}
            >
              <div className="px-6 pb-6 pt-2">{item.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImportantInformation;
