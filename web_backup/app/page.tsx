"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bed, Utensils, Car, Camera, PartyPopper } from "lucide-react";
import { useState, useEffect } from "react";
import RoomCarousel from "@/components/RoomCarousel";
import LocationMap from "@/components/LocationMap";
import TestimonialsSection from "@/components/TestimonialsSection";

const gangtokImages = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop", // Mountains
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1000&auto=format&fit=crop", // Sikkim landscape
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2070&auto=format&fit=crop", // Tea garden type view
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"  // Luxury hotel
];
export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % gangtokImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden bg-gray-900 text-white h-[500px] flex items-center">
        {/* Carousel Background */}
        {gangtokImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image 
              src={img} 
              alt={`Gangtok View ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/50" /> {/* Overlay */}
          </div>
        ))}
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
            Experience <span className="text-pink-400">Gangtok</span> Like Never Before
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-8 drop-shadow-md max-w-2xl mx-auto">
            Luxury stays in the heart of Sikkim. Discover mountains, culture, and comfort at Hotel Sakura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-white bg-pink-600 hover:bg-pink-700 transition-all hover:scale-105 shadow-lg">
              Explore Rooms
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-medium rounded-full text-white hover:bg-white hover:text-gray-900 transition-all hover:scale-105 shadow-lg backdrop-blur-sm">
              Inquire Now
            </Link>
          </div>
          
          {/* Carousel Indicators */}
          {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
            {gangtokImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentImage ? "bg-pink-500 w-8" : "bg-white/50 hover:bg-white"
                }`}
              />
            ))}
          </div> */}
        </div>
      </section>

      {/* Featured Rooms Carousel */}
      <RoomCarousel />

      {/* Services Highlights */}
      <section className="px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Our Premium Services</h2>
          <p className="mt-4 text-gray-500">Everything you need for a perfect stay and experience.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Bed, title: "Lodging", desc: "Comfortable rooms and suites across multiple locations.", link: "/catalog?filter=lodging" },
            { icon: Utensils, title: "Fooding", desc: "Exquisite cuisines and dining experiences.", link: "/catalog?filter=fooding" },
            { icon: Car, title: "Travel", desc: "Hassle-free transportation and rental services.", link: "/catalog?filter=travel" },
            { icon: Camera, title: "Sightseeing", desc: "Guided tours to beautiful local attractions.", link: "/catalog?filter=sightseeing" },
            { icon: PartyPopper, title: "Events & Party", desc: "Venues and planning for your special moments.", link: "/catalog?filter=party" },
            { icon: ArrowRight, title: "Packages", desc: "All-in-one bundles for the best value.", link: "/packages" },
          ].map((service, idx) => (
            <Link key={idx} href={service.link} className="group relative rounded-xl border bg-white p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="inline-flex items-center justify-center p-3 bg-pink-100 rounded-lg text-pink-600 mb-4 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-500">{service.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* World Map Section */}
      <LocationMap />

      {/* Featured Rooms Carousel */}
      {/* <RoomCarousel /> */}
    </div>
  );
}
