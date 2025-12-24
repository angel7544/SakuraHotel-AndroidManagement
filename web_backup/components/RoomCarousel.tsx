"use client";
import { useState, useEffect, useRef, ReactNode } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Star, Heart, Wifi, Coffee, Bed, MapPin, Bath, Home } from "lucide-react";
import Link from "next/link";

type Room = {
  name: ReactNode;
  id: string;
  room_number: string;
  type: string;
  price: number;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  amenities: string[] | null;
  bed_count: number | null;
  hotels: {
    name: string;
    address: string | null;
  } | null;
};

const dummyRating = 4.8; // Placeholder since we don't have ratings in DB yet

export default function RoomCarousel() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [width, setWidth] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const x = useMotionValue(0);

  const supabase = getSupabaseClient();

  // Auto-slide effect
  useEffect(() => {
    if (width === 0) return;
    
    const controls = animate(x, -width, {
      duration: 20, // Slow continuous scroll
      ease: "linear",
      repeat: Infinity,
      repeatType: "mirror", // Go back and forth
      repeatDelay: 1
    });

    return () => controls.stop();
  }, [width, x]);

  useEffect(() => {
    fetchRooms();
    
    // Real-time subscription
    const channel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
        console.log('Real-time update:', payload);
        fetchRooms(); // Refetch to get joined data easily, or optimistic update
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (carousel.current) {
      setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth);
    }
  }, [rooms]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id, 
          room_number, 
          type, 
          price, 
          description, 
          image_url,
          images,
          amenities,
          bed_count,
          hotels (
            name,
            address
          )
        `)
        .eq('status', 'Available') // Only show available rooms? Or all? Let's show all for catalog feel, or just available.
        .limit(10); // Limit for performance

      if (error) throw error;
      
      // Filter out rooms without images for better UI? Or provide placeholder.
      setRooms(data as any || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get icon for amenity
  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi')) return <Wifi size={14} />;
    if (lower.includes('coffee') || lower.includes('breakfast') || lower.includes('kitchen')) return <Coffee size={14} />;
    if (lower.includes('bed')) return <Bed size={14} />;
    if (lower.includes('bath') || lower.includes('spa')) return <Bath size={14} />;
    return <Home size={14} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return <div className="text-center text-gray-500 py-12">No rooms available at the moment.</div>;
  }

  return (
    <div className="w-full overflow-hidden py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Featured Stays</h2>
        <p className="text-gray-500 mt-2">Swipe to explore our premium collection</p>
      </div>

      <motion.div 
        ref={carousel} 
        className="cursor-grab active:cursor-grabbing overflow-hidden px-4 md:px-12"
      >
        <motion.div 
          drag="x" 
          dragConstraints={{ right: 0, left: -width }} 
          style={{ x }}
          onDragStart={() => x.stop()} // Stop auto-scroll on user interaction
          whileTap={{ cursor: "grabbing" }}
          className="flex gap-6"
        >
          {rooms.map((room) => (
            <motion.div 
              key={room.id} 
              className="min-w-[300px] md:min-w-[300px] h-[400px] rounded-3xl overflow-hidden relative bg-gray-900 shadow-xl group"
            >
              {/* Image Background with Auto-slideshow */}
              <div className="absolute inset-0 h-1/2">
                {room.images && room.images.length > 1 ? (
                  // Auto-sliding images
                  <motion.div
                    className="relative w-full h-full"
                    animate={{ x: [0, -100 * (room.images.length - 1) + "%"] }}
                    transition={{
                      x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: room.images.length * 2,
                        ease: "linear",
                      },
                    }}
                  >
                    {room.images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ left: `${idx * 100}%` }}
                      >
                        <Image
                          src={img}
                          alt={`${room.type} image ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  // Single image fallback
                  <Image
                    src={room.image_url || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80"}
                    alt={room.type}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-gray-900" />
              </div>

              {/* Card Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                {/* Top Badges */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-white text-xs font-medium border border-white/10">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  {dummyRating}/5
                </div>
                <button className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-pink-600 transition-colors border border-white/10">
                  <Heart size={16} />
                </button>

                {/* Text Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {room.room_number} {room.type} 
                    </h3>
                    <div className="flex flex-col text-sm">
                       <span className="font-semibold text-pink-400 mb-1">{room.hotels?.name || "Sakura Hotel"}</span>
                       <div className="flex items-center text-gray-400 text-xs">
                        <MapPin size={12} className="mr-1" />
                        {room.hotels?.address || "Gangtok, Sikkim"}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm line-clamp-2">
                    {room.description || `Experience luxury in our ${room.type}. Perfect for relaxation and comfort.`}
                  </p>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2">
                    {(room.amenities || ["Free Wifi", "Room Service", "TV"]).slice(0, 3).map((am, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs text-gray-300 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                        {getAmenityIcon(am)}
                        {am}
                      </span>
                    ))}
                    {room.bed_count && (
                       <span className="flex items-center gap-1 text-xs text-gray-300 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                        <Bed size={14} />
                        {room.bed_count} Beds
                      </span>
                    )}
                  </div>

                  {/* Footer: Price & Action */}
                  <div className="flex items-end justify-between pt-4 border-t border-white/10 mt-2">
                      <div>
                        <span className="text-2xl font-bold text-white">₹{room.price}</span>
                        <span className="text-gray-400 text-sm">/night</span>
                      </div>
                      <Link 
                         href={`/contact?interest=${encodeURIComponent(room.type)}&type=Room&details=${encodeURIComponent(`Price: ₹${room.price}/night\nDescription: ${room.description || 'N/A'}\nAmenities: ${room.amenities?.join(', ') || 'N/A'}`)}`} 
                         className="px-4 py-2 bg-white text-gray-900 rounded-full font-semibold text-sm hover:bg-pink-50 transition-colors"
                       >
                         Inquire Now
                       </Link>
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
