"use client";
import { useState, useEffect } from "react";
import { Plus, Filter, MoreHorizontal, X, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import { useSettings } from "@/context/SettingsContext";

interface Room {
  id: string;
  room_number: string;
  type: string;
  price: number;
  status: string;
  description: string;
  hotel_id: string;
  hotels: { name: string } | null;
  image_url?: string;
  images?: string[];
  capacity?: number;
  bed_type?: string;
  bed_count?: number;
  amenities?: string[];
  view_type?: string;
}

interface Hotel {
  id: string;
  name: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_number: "",
    type: "Standard",
    price: 100,
    status: "Available",
    hotel_id: "",
    description: "",
    image_url: "",
    images: [] as string[],
    capacity: 2,
    bed_type: "Queen",
    bed_count: 1,
    amenities: "",
    view_type: "City View"
  });
  const [files, setFiles] = useState<File[]>([]);
  
  const { addToast } = useToast();
  const supabase = getSupabaseClient();

  const fetchRooms = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("rooms")
      .select("*, hotels(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      addToast("Failed to fetch rooms", "error");
    } else {
      setRooms(data as any);
    }
    if (!silent) setLoading(false);
  };

  const fetchHotels = async () => {
    const { data } = await supabase.from("hotels").select("id, name").eq("status", "Active");
    if (data) setHotels(data);
  };

  useEffect(() => {
    fetchRooms();
    fetchHotels();

    const channel = supabase
      .channel('realtime-rooms-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          fetchRooms(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        room_number: room.room_number,
        type: room.type,
        price: room.price,
        status: room.status,
        hotel_id: room.hotel_id,
        description: room.description || "",
        image_url: room.image_url || "",
        images: room.images || (room.image_url ? [room.image_url] : []),
        capacity: room.capacity || 2,
        bed_type: room.bed_type || "Queen",
        bed_count: room.bed_count || 1,
        amenities: room.amenities ? room.amenities.join(", ") : "",
        view_type: room.view_type || "City View"
      });
    } else {
      setEditingRoom(null);
      setFormData({
        room_number: "",
        type: "Standard",
        price: 100,
        status: "Available",
        hotel_id: hotels.length > 0 ? hotels[0].id : "",
        description: "",
        image_url: "",
        images: [],
        capacity: 2,
        bed_type: "Queen",
        bed_count: 1,
        amenities: "",
        view_type: "City View"
      });
    }
    setIsModalOpen(true);
    setFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        if (formData.images.length + files.length + newFiles.length > 4) {
             addToast("Maximum 4 images allowed", "error");
             return;
        }
        setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({...formData, images: newImages});
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hotel_id) {
        addToast("Please select a hotel", "error");
        return;
    }
    
    let uploadedUrls: string[] = [];
    
    try {
      if (files.length > 0) {
        for (const file of files) {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", "sakura/rooms");
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const json = await res.json();
            if (json.ok) uploadedUrls.push(json.url);
        }
      }
    } catch (error) {
        console.error("Upload error:", error);
        addToast("Failed to upload some images", "error");
    }

    const finalImages = [...formData.images, ...uploadedUrls];
    const finalImageUrl = finalImages.length > 0 ? finalImages[0] : "";

    const amenitiesArray = formData.amenities.split(",").map(i => i.trim()).filter(i => i !== "");

    const payload = {
      room_number: formData.room_number,
      type: formData.type,
      price: formData.price,
      status: formData.status,
      hotel_id: formData.hotel_id,
      description: formData.description,
      image_url: finalImageUrl,
      images: finalImages,
      capacity: formData.capacity,
      bed_type: formData.bed_type,
      bed_count: formData.bed_count,
      amenities: amenitiesArray,
      view_type: formData.view_type
    };

    if (editingRoom) {
      const { error } = await supabase.from("rooms").update(payload).eq("id", editingRoom.id);
      if (error) {
         addToast("Failed to update room", "error");
      } else {
         addToast("Room updated successfully", "success");
         setIsModalOpen(false);
         fetchRooms();
      }
    } else {
      const { error } = await supabase.from("rooms").insert([payload]);
      if (error) {
         addToast("Failed to create room", "error");
      } else {
         addToast("Room created successfully", "success");
         setIsModalOpen(false);
         fetchRooms();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) {
      if (error.code === '23503') {
          // Foreign Key Constraint Violation
          if (confirm("This room has existing reservations. Do you want to FORCE DELETE the room and ALL associated reservations? This action cannot be undone.")) {
             // Delete invoices first
             const { error: invError } = await supabase.from("invoices").delete().in("reservation_id", 
                (await supabase.from("reservations").select("id").eq("room_id", id)).data?.map(r => r.id) || []
             );
             if (invError) {
                console.error("Failed to delete invoices", invError);
                // Continue trying to delete reservations anyway, though it might fail if FK is strict and not cascading
             }

             // Delete reservations first
             const { error: resError } = await supabase.from("reservations").delete().eq("room_id", id);
             if (resError) {
                 addToast("Failed to delete associated reservations: " + resError.message, "error");
                 return;
             }
             
             // Try deleting room again
             const { error: retryError } = await supabase.from("rooms").delete().eq("id", id);
             if (retryError) {
                 addToast("Failed to delete room after clearing reservations: " + retryError.message, "error");
             } else {
                 addToast("Room and associated reservations deleted successfully", "success");
                 fetchRooms(true);
             }
          }
      } else {
          addToast("Failed to delete room: " + error.message, "error");
      }
    } else {
      addToast("Room deleted successfully", "success");
      fetchRooms(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
        <div className="flex space-x-2">
          <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700">
            <Plus className="h-4 w-4 mr-2" /> Add Room
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No rooms found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
            <div key={room.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col">
                <div className="relative h-48 bg-gray-200">
                    {room.image_url ? (
                        <img src={room.image_url} alt={`Room ${room.room_number}`} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                        <button onClick={() => handleOpenModal(room)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-blue-600">
                            <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(room.id)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-red-600">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            room.status === "Available" ? "bg-green-100 text-green-800" :
                            room.status === "Occupied" ? "bg-red-100 text-red-800" :
                            room.status === "Reserved" || room.status === "Booked" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                        }`}>
                        {room.status}
                        </span>
                    </div>
                </div>
                <div className="px-4 py-4 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                             <h3 className="text-lg font-medium text-gray-900">Room {room.room_number}</h3>
                             <span className="text-sm font-medium text-gray-500">{room.type}</span>
                        </div>
                        <p className="text-sm text-gray-500">{room.hotels?.name || "Unknown Hotel"}</p>
                        <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-1">
                             <div>Cap: {room.capacity}</div>
                             <div>Beds: {room.bed_count} ({room.bed_type})</div>
                             <div className="col-span-2 truncate">{room.view_type}</div>
                        </div>
                        <p className="mt-2 text-lg font-bold text-pink-600">${room.price}</p>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold leading-6 text-gray-900" id="modal-title">
                        {editingRoom ? "Edit Room" : "Add New Room"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Number</label>
                <input 
                  required
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                  value={formData.room_number}
                  onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Hotel</label>
                <select 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                  value={formData.hotel_id}
                  onChange={(e) => setFormData({...formData, hotel_id: e.target.value})}
                >
                  <option value="">Select a hotel</option>
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Family">Family</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input 
                    required
                    type="number" 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                    <input 
                    required
                    type="number"
                    min="1" 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">View Type</label>
                    <input 
                    type="text" 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                    value={formData.view_type}
                    onChange={(e) => setFormData({...formData, view_type: e.target.value})}
                    placeholder="e.g. Sea View"
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Bed Count</label>
                    <input 
                    required
                    type="number"
                    min="1" 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                    value={formData.bed_count}
                    onChange={(e) => setFormData({...formData, bed_count: Number(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Bed Type</label>
                    <select 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                    value={formData.bed_type}
                    onChange={(e) => setFormData({...formData, bed_type: e.target.value})}
                    >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Queen">Queen</option>
                    <option value="King">King</option>
                    <option value="Twin">Twin</option>
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amenities (comma separated)</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                  value={formData.amenities}
                  onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                  placeholder="WiFi, TV, AC..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Images (Max 4)</label>
                <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleFileChange} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm" 
                    disabled={formData.images.length + files.length >= 4}
                />
                
                <div className="mt-4 grid grid-cols-4 gap-2">
                    {/* Existing Images */}
                    {formData.images.map((url, index) => (
                        <div key={url} className="relative group">
                            <img src={url} alt={`Room ${index}`} className="h-20 w-20 object-cover rounded" />
                            <button 
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    
                    {/* New Files */}
                    {files.map((file, index) => (
                         <div key={index} className="relative group">
                            <div className="h-20 w-20 bg-gray-200 flex items-center justify-center rounded text-xs text-center p-1 overflow-hidden">
                                {file.name}
                            </div>
                            <button 
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-base sm:text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 mt-6 -mx-6 -mb-4">
                <button type="submit" className="inline-flex w-full justify-center rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 sm:ml-3 sm:w-auto">
                  {editingRoom ? "Save Changes" : "Create Room"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                  Cancel
                </button>
              </div>
            </form>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
