"use client";
import { useState, useEffect } from "react";
import { Calendar, Search, CheckCircle, XCircle, Clock, FileText, Plus, X, Phone, Mail, MessageCircle, BedDouble, Hotel, MoreVertical } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import jsPDF from "jspdf";
import Link from "next/link";

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  hotels: { name: string; address?: string } | null;
  rooms: { id: string; room_number: string; type: string; price: number } | null;
  room_id?: string;
}

interface Room {
    id: string;
    room_number: string;
    type: string;
    price: number;
    hotel_id: string;
    hotels: { name: string } | null;
    status?: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { addToast } = useToast();
  const supabase = getSupabaseClient();
  
  // Create Reservation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      check_in: "",
      check_out: "",
      room_id: "",
      notes: ""
  });

  // Assign Room Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState("");

  const fetchReservations = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        hotels (name, address),
        rooms (id, room_number, type, price)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reservations:", error);
      addToast("Failed to fetch reservations", "error");
    } else {
      setReservations(data as any);
    }
    if (!silent) setLoading(false);
  };

  const fetchAvailableRooms = async () => {
      // Fetch all available rooms
      const { data } = await supabase
        .from("rooms")
        .select("id, room_number, type, price, hotel_id, hotels(name), status")
        .eq("status", "Available");
      if (data) setAvailableRooms(data as any);
  };

  useEffect(() => {
    fetchReservations();
    fetchAvailableRooms();

    // Supabase Realtime Subscription (Instant updates)
    const channel = supabase
      .channel('realtime-reservations-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          fetchReservations(true);
          fetchAvailableRooms();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          fetchAvailableRooms();
          fetchReservations(true);
        }
      )
      .subscribe();
    
    // Polling fallback (every 3 seconds)
    const interval = setInterval(() => {
        fetchReservations(true);
        fetchAvailableRooms();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Get current reservation to check for room assignment
    const { data: currentRes } = await supabase
        .from("reservations")
        .select("room_id")
        .eq("id", id)
        .single();

    const { error } = await supabase
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      addToast("Failed to update status", "error");
    } else {
      // If cancelling, free up the room
      if (newStatus === "Cancelled" && currentRes?.room_id) {
          await supabase
            .from("rooms")
            .update({ status: "Available" })
            .eq("id", currentRes.room_id);
      }

      addToast(`Status updated to ${newStatus}`, "success");
      fetchReservations();
      fetchAvailableRooms(); // Refresh room availability
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!createFormData.customer_name || !createFormData.check_in || !createFormData.check_out) {
          addToast("Please fill all required fields", "error");
          return;
      }

      // If room selected, calculate total
      let total = 0;
      let hotelId = null;
      
      if (createFormData.room_id) {
          const room = availableRooms.find(r => r.id === createFormData.room_id);
          if (room) {
              const start = new Date(createFormData.check_in);
              const end = new Date(createFormData.check_out);
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
              total = (days > 0 ? days : 1) * room.price;
              hotelId = room.hotel_id;
          }
      }

      const { error } = await supabase.from("reservations").insert([{
          customer_name: createFormData.customer_name,
          customer_phone: createFormData.customer_phone,
          customer_email: createFormData.customer_email,
          check_in: createFormData.check_in,
          check_out: createFormData.check_out,
          room_id: createFormData.room_id || null,
          hotel_id: hotelId, // Might be null if no room selected (enquiry)
          total_amount: total,
          status: createFormData.room_id ? "Confirmed" : "Pending",
          notes: createFormData.notes
      }]);

      if (error) {
          console.error(error);
          addToast("Failed to create reservation", "error");
      } else {
          // If room was selected, mark it as Booked
          if (createFormData.room_id) {
              await supabase
                .from("rooms")
                .update({ status: "Booked" })
                .eq("id", createFormData.room_id);
          }

          addToast("Reservation created", "success");
          setIsCreateModalOpen(false);
          setCreateFormData({
            customer_name: "",
            customer_phone: "",
            customer_email: "",
            check_in: "",
            check_out: "",
            room_id: "",
            notes: ""
          });
          fetchReservations();
          fetchAvailableRooms();
      }
  };

  const openAssignModal = (res: Reservation) => {
    setSelectedReservation(res);
    setIsAssignModalOpen(true);
    fetchAvailableRooms(); // Refresh rooms
  };

  const handleAssignRoom = async (room: Room) => {
      if (!selectedReservation) return;

      const { error } = await supabase
        .from("reservations")
        .update({ 
            room_id: room.id,
            hotel_id: room.hotel_id,
            status: "Confirmed" // Auto confirm when assigning room
        })
        .eq("id", selectedReservation.id);

      if (error) {
          console.error(error);
          addToast("Failed to assign room", "error");
      } else {
          // 1. If reservation already had a room, free it up
          if (selectedReservation.rooms) {
               await supabase
                .from("rooms")
                .update({ status: "Available" })
                .eq("id", selectedReservation.rooms.id);
          }

          // 2. Mark new room as Booked
          await supabase
            .from("rooms")
            .update({ status: "Booked" })
            .eq("id", room.id);

          addToast(`Assigned Room ${room.room_number} to ${selectedReservation.customer_name}`, "success");
          setIsAssignModalOpen(false);
          setSelectedReservation(null);
          fetchReservations();
          fetchAvailableRooms();
      }
  };

  const generateInvoice = async (res: Reservation) => {
    try {
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("*")
        .eq("reservation_id", res.id)
        .maybeSingle();

      let invoiceNumber = existingInvoice?.invoice_number;

      if (!existingInvoice) {
        invoiceNumber = `INV-${Date.now()}`;
        const { error } = await supabase.from("invoices").insert([{
          reservation_id: res.id,
          invoice_number: invoiceNumber,
          amount: res.total_amount || 0,
          status: 'Unpaid'
        }]);
        
        if (error) {
          console.error(error);
          addToast("Failed to create invoice record", "error");
          return;
        }
      }

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(219, 39, 119);
      doc.text("Hotel Sakura", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Invoice", 105, 30, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Invoice Number: ${invoiceNumber}`, 20, 50);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
      
      doc.text(`Bill To:`, 20, 70);
      doc.text(`Name: ${res.customer_name}`, 20, 75);
      doc.text(`Email: ${res.customer_email || "N/A"}`, 20, 80);
      doc.text(`Phone: ${res.customer_phone || "N/A"}`, 20, 85);

      doc.text(`Hotel: ${res.hotels?.name || "N/A"}`, 120, 70);
      if (res.hotels?.address) {
          doc.text(`Address: ${res.hotels.address}`, 120, 75);
      }
      
      let y = 100;
      doc.line(20, y, 190, y);
      y += 10;
      doc.text("Description", 20, y);
      doc.text("Amount", 160, y);
      y += 5;
      doc.line(20, y, 190, y);
      
      y += 10;
      doc.text(`Room Charges (${res.rooms?.type || 'Unassigned'} - Room ${res.rooms?.room_number || 'N/A'})`, 20, y);
      doc.text(`${res.total_amount || 0}`, 160, y);
      
      y += 10;
      doc.text(`Check-in: ${res.check_in}`, 20, y);
      
      y += 5;
      doc.text(`Check-out: ${res.check_out}`, 20, y);

      y += 20;
      doc.line(20, y, 190, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Total: ${res.total_amount || 0}`, 160, y);
      
      doc.setFontSize(10);
      doc.text("Thank you for choosing Hotel Sakura!", 105, 280, { align: "center" });

      doc.save(`Invoice_${invoiceNumber}.pdf`);
      addToast("Invoice generated successfully", "success");

    } catch (e) {
      console.error(e);
      addToast("Failed to generate invoice", "error");
    }
  };

  const getWhatsAppLink = (res: Reservation) => {
      if (!res.customer_phone) return "#";
      
      let message = "";
      const phone = res.customer_phone.replace(/\D/g, ""); // Clean phone number
      
      if (res.status === "Confirmed" && res.rooms) {
          message = `Hello ${res.customer_name}, your reservation at ${res.hotels?.name || 'Hotel Sakura'} for Room ${res.rooms.room_number} is confirmed. We look forward to hosting you!`;
      } else if (res.status === "Confirmed") {
           message = `Hello ${res.customer_name}, your reservation at ${res.hotels?.name || 'Hotel Sakura'} is confirmed. We will assign your room shortly.`;
      } else {
          message = `Hello ${res.customer_name}, thank you for your enquiry at ${res.hotels?.name || 'Hotel Sakura'}. We are processing your request.`;
      }
      
      return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const filteredReservations = reservations.filter(
    (res) =>
      res.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = availableRooms.filter(room => 
      room.room_number.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
      room.hotels?.name?.toLowerCase().includes(assignSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Enquires/Reservations</h1>
        <div className="flex w-full sm:w-auto gap-2">
           <div className="relative flex-grow sm:flex-grow-0">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search guest or ID..." 
               className="pl-10 pr-4 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 w-full"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
           >
             <Plus className="h-4 w-4 mr-2" /> New Reservation
           </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading reservations...</div>
      ) : filteredReservations.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            No reservations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReservations.map((res) => (
                <div key={res.id} className="bg-white rounded-lg shadow border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{res.customer_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    res.status === "Confirmed" ? "bg-green-100 text-green-800" :
                                    res.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                                    res.status === "Cancelled" ? "bg-red-100 text-red-800" :
                                    "bg-blue-100 text-blue-800"
                                }`}>
                                    {res.status}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">ID: {res.id.substring(0,6)}</span>
                            </div>
                        </div>
                        {res.rooms ? (
                            <div className="text-right">
                                <div className="text-sm font-bold text-pink-600">Room {res.rooms.room_number}</div>
                                <div className="text-xs text-gray-500">{res.rooms.type}</div>
                            </div>
                        ) : (
                            <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Unassigned</div>
                        )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-grow space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(res.check_in).toLocaleDateString()} - {new Date(res.check_out).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Hotel className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{res.hotels?.name || "Hotel Sakura"}</span>
                        </div>
                         {res.notes && (
                            <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                                "{res.notes}"
                            </div>
                        )}
                    </div>

                    {/* Contact Actions */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-around">
                        <a 
                            href={`tel:${res.customer_phone}`} 
                            className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Call Guest"
                        >
                            <div className="p-2 bg-white rounded-full shadow-sm">
                                <Phone className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-medium">Call</span>
                        </a>
                        <a 
                            href={`mailto:${res.customer_email}`} 
                            className="flex flex-col items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                            title="Email Guest"
                        >
                            <div className="p-2 bg-white rounded-full shadow-sm">
                                <Mail className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-medium">Email</span>
                        </a>
                        <a 
                            href={getWhatsAppLink(res)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
                            title="WhatsApp Message"
                        >
                            <div className="p-2 bg-white rounded-full shadow-sm">
                                <MessageCircle className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-medium">WhatsApp</span>
                        </a>
                    </div>

                    {/* Primary Actions */}
                    <div className="p-4 border-t border-gray-200 flex flex-wrap gap-2">
                         {/* Assign Room / Confirm */}
                        {(!res.rooms || res.status === "Pending") && res.status !== "Cancelled" && (
                             <button 
                                onClick={() => openAssignModal(res)}
                                className="flex-1 bg-pink-600 text-white text-sm py-2 rounded hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                             >
                                <BedDouble className="h-4 w-4" />
                                {res.rooms ? "Change Room" : "Confirm / Assign"}
                             </button>
                        )}

                        {/* Invoice */}
                        {(res.status === "Confirmed" || res.status === "Checked In") && (
                             <button 
                                onClick={() => generateInvoice(res)}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 text-sm py-2 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                             >
                                <FileText className="h-4 w-4" />
                                Invoice
                             </button>
                        )}
                        
                        {/* Cancel */}
                         {res.status !== "Cancelled" && (
                             <button 
                                onClick={() => {
                                    if(confirm("Are you sure you want to cancel this reservation?")) {
                                        handleStatusChange(res.id, "Cancelled");
                                    }
                                }}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Cancel Reservation"
                             >
                                <XCircle className="h-5 w-5" />
                             </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Create Reservation Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="text-xl font-bold">New Reservation</h2>
                      <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-6 w-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                          <input 
                              type="text" 
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                              value={createFormData.customer_name}
                              onChange={(e) => setCreateFormData({...createFormData, customer_name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input 
                              type="tel" 
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                              value={createFormData.customer_phone}
                              onChange={(e) => setCreateFormData({...createFormData, customer_phone: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input 
                              type="email" 
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                              value={createFormData.customer_email}
                              onChange={(e) => setCreateFormData({...createFormData, customer_email: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Check In</label>
                              <input 
                                  type="date" 
                                  required
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                  value={createFormData.check_in}
                                  onChange={(e) => setCreateFormData({...createFormData, check_in: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Check Out</label>
                              <input 
                                  type="date" 
                                  required
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                  value={createFormData.check_out}
                                  onChange={(e) => setCreateFormData({...createFormData, check_out: e.target.value})}
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Room (Optional)</label>
                          <select 
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                              value={createFormData.room_id}
                              onChange={(e) => setCreateFormData({...createFormData, room_id: e.target.value})}
                          >
                              <option value="">-- Select Room --</option>
                              {availableRooms.map(room => (
                                  <option key={room.id} value={room.id}>
                                      Room {room.room_number} ({room.type}) - ₹{room.price}
                                  </option>
                              ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">Leave empty to create an enquiry/pending reservation.</p>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Notes</label>
                          <textarea 
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                              rows={3}
                              value={createFormData.notes}
                              onChange={(e) => setCreateFormData({...createFormData, notes: e.target.value})}
                          />
                      </div>
                      <div className="pt-4 flex justify-end gap-3">
                          <button
                              type="button"
                              onClick={() => setIsCreateModalOpen(false)}
                              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                          >
                              Cancel
                          </button>
                          <button
                              type="submit"
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                          >
                              Create Reservation
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Assign Room Modal */}
      {isAssignModalOpen && selectedReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="text-xl font-bold">Assign Room to {selectedReservation.customer_name}</h2>
                      <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-6 w-6" />
                      </button>
                  </div>
                  
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search rooms..." 
                            className="pl-10 pr-4 py-2 border rounded-md w-full"
                            value={assignSearchTerm}
                            onChange={(e) => setAssignSearchTerm(e.target.value)}
                        />
                      </div>
                  </div>

                  <div className="flex-grow overflow-y-auto p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {filteredRooms.length === 0 ? (
                              <div className="col-span-full text-center text-gray-500 py-8">
                                  No available rooms found.
                              </div>
                          ) : (
                              filteredRooms.map(room => (
                                  <div 
                                    key={room.id} 
                                    className="border rounded-lg p-4 cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all"
                                    onClick={() => handleAssignRoom(room)}
                                  >
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <div className="font-bold text-lg">Room {room.room_number}</div>
                                              <div className="text-sm text-gray-500">{room.type}</div>
                                              <div className="text-xs text-gray-400 mt-1">{room.hotels?.name}</div>
                                          </div>
                                          <div className="text-pink-600 font-bold">
                                              ₹{room.price}
                                          </div>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
