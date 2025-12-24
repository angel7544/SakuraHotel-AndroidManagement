"use client";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  message: string;
  rating: number;
  image_url: string | null;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "Active")
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (data) setTestimonials(data);
    };
    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Loved by Guests</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            See what our customers have to say about their experience with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={`${i < t.rating ? "text-blue-500 fill-blue-500" : "text-gray-200"}`}
                    />
                  ))}
                </div>

                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  "{t.message}"
                </p>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                  {t.image_url ? (
                    <Image
                      src={t.image_url}
                      alt={t.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                      {t.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{t.name}</h4>
                  {t.role && (
                    <p className="text-sm text-gray-500 font-medium">{t.role}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
