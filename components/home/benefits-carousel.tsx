"use client";

import { useEffect, useState } from "react";
import { Truck, ShieldCheck, RotateCcw, Headphones, CreditCard, Gift } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% secure transactions",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "30-day return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "We're always here to help",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description: "Multiple payment options",
  },
  {
    icon: Gift,
    title: "Special Offers",
    description: "Exclusive deals for members",
  },
];

export function BenefitsCarousel() {
  const [current, setCurrent] = useState(0);

  // Show 3 at a time on desktop, cycle through
  const itemsPerView = 3;
  const totalSlides = Math.ceil(benefits.length / itemsPerView);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  return (
    <section className="border-y bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Mobile: single scrollable row */}
        <div className="flex gap-6 overflow-x-auto pb-2 sm:hidden scrollbar-hide">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex min-w-[200px] flex-col items-center gap-2 text-center"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <b.icon className="size-6" />
              </div>
              <h3 className="text-sm font-semibold">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>

        {/* Desktop: carousel with auto-rotate */}
        <div className="hidden sm:block">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIdx) => (
                <div key={slideIdx} className="flex min-w-full justify-center gap-12">
                  {benefits
                    .slice(slideIdx * itemsPerView, slideIdx * itemsPerView + itemsPerView)
                    .map((b) => (
                      <div
                        key={b.title}
                        className="flex flex-col items-center gap-3 text-center"
                      >
                        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <b.icon className="size-7" />
                        </div>
                        <h3 className="font-semibold">{b.title}</h3>
                        <p className="text-sm text-muted-foreground">{b.description}</p>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
