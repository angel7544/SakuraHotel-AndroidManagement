"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash, X, Image as ImageIcon } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";

type Hotel = {
  id: string;
  name: string;
  address: string;
  status: string;
  image_url?: string;
};

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const { addToast } = useToast();
  
  // Form State
  const [formData, setFormData] = useState({ name: "", address: "", status: "Active", image_url: "" });
  const [file, setFile] = useState<File | null>(null);

  const supabase = getSupabaseClient();

  const fetchHotels = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      addToast("Failed to fetch hotels", "error");
    } else {
      setHotels(data || []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
    const interval = setInterval(() => {
      fetchHotels(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let uploadedUrl = formData.image_url;
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "sakura/hotels");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (json.ok) uploadedUrl = json.url;
      }
    } catch {}
    if (editingHotel) {
      // Update
      const { error } = await supabase.from("hotels").update({ ...formData, image_url: uploadedUrl }).eq("id", editingHotel.id);
      if (error) {
         addToast("Failed to update hotel", "error");
      } else {
         addToast("Hotel updated successfully", "success");
         setIsModalOpen(false);
         setEditingHotel(null);
         fetchHotels();
      }
    } else {
      // Create
      const { error } = await supabase.from("hotels").insert([{ ...formData, image_url: uploadedUrl }]);
      if (error) {
         addToast("Failed to create hotel", "error");
      } else {
         addToast("Hotel created successfully", "success");
         setIsModalOpen(false);
         fetchHotels();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel?")) return;
    const { error } = await supabase.from("hotels").delete().eq("id", id);
    if (error) {
       addToast("Failed to delete hotel", "error");
    } else {
       addToast("Hotel deleted", "success");
       fetchHotels();
    }
  };

  const openModal = (hotel?: Hotel) => {
    if (hotel) {
      setEditingHotel(hotel);
      setFormData({ name: hotel.name, address: hotel.address, status: hotel.status, image_url: hotel.image_url || "" });
    } else {
      setEditingHotel(null);
      setFormData({ name: "", address: "", status: "Active", image_url: "" });
    }
    setFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Hotels Management</h1>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Hotel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading hotels...</div>
        ) : hotels.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No hotels found. Create one to get started.</div>
        ) : (
          hotels.map((hotel) => (
            <div key={hotel.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col">
              <div className="relative h-48 bg-gray-200">
                {hotel.image_url ? (
                  <img src={hotel.image_url} alt={hotel.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-2">
                   <button onClick={() => openModal(hotel)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-blue-600">
                      <Edit className="h-4 w-4" />
                   </button>
                   <button onClick={() => handleDelete(hotel.id)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-red-600">
                      <Trash className="h-4 w-4" />
                   </button>
                </div>
                <div className="absolute bottom-2 left-2">
                   <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                       hotel.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                     }`}>
                      {hotel.status}
                    </span>
                </div>
              </div>
              <div className="px-4 py-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{hotel.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{hotel.address}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button onClick={() => setIsModalOpen(false)} className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {editingHotel ? "Edit Hotel" : "Add New Hotel"}
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Image</label>
                        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm" />
                        {formData.image_url && (
                          <img src={formData.image_url} alt="Hotel" className="mt-2 h-20 w-20 object-cover rounded" />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 text-base sm:text-sm">
                          <option value="Active">Active</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm">
                          Save
                        </button>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:w-auto sm:text-sm">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
