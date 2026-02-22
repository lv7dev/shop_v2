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

const ITEMS_PER_VIEW = 3;
const TOTAL_SLIDES = Math.ceil(benefits.length / ITEMS_PER_VIEW);

export function BenefitsCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TOTAL_SLIDES);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="border-y bg-muted/30">
      {/*
       * Fixed height prevents CLS — the carousel always occupies the same
       * vertical space regardless of hydration or slide transitions.
       */}
      <div className="mx-auto max-w-7xl px-4 py-8" style={{ minHeight: 140 }}>
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
              className="flex will-change-transform transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {Array.from({ length: TOTAL_SLIDES }).map((_, slideIdx) => (
                <div key={slideIdx} className="flex min-w-full justify-center gap-12">
                  {benefits
                    .slice(slideIdx * ITEMS_PER_VIEW, slideIdx * ITEMS_PER_VIEW + ITEMS_PER_VIEW)
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

          {/* Dots indicator — use fixed width + opacity/scale instead of width animation to avoid layout shifts */}
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 w-6 rounded-full transition-all duration-300 ${
                  i === current
                    ? "bg-primary"
                    : "bg-muted-foreground/30 scale-x-[0.33] origin-center"
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
