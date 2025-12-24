"use client";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";

export default function InquiryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const interest = params.get("interest");
    const type = params.get("type");
    const details = params.get("details");
    
    if (interest) {
      setMessage((prev) => {
        let text = `I am interested in booking the ${type ? type : "item"}: "${interest}".\n`;
        if (details) {
          text += `\nDetails:\n${details}\n`;
        }
        text += `\nPlease provide more information and availability.`;
        return prev.startsWith("I am interested") ? prev : text;
      });
    }
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          checkIn,
          checkOut,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit inquiry");
      }

      setStatus("success");
      setName(""); setPhone(""); setEmail(""); setCheckIn(""); setCheckOut(""); setMessage("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Send Inquiry / Book Now</h3>
      
      {status === "success" ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
          <p className="font-medium">Inquiry Submitted!</p>
          <p className="text-sm">We have received your reservation request and will contact you shortly.</p>
          <button onClick={() => setStatus(null)} className="text-sm underline mt-2">Send another</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
              placeholder="John Doe" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input 
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                placeholder="+1 234..." 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                placeholder="john@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <input 
                required
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                value={checkIn} 
                onChange={(e) => setCheckIn(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <input 
                required
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                value={checkOut} 
                onChange={(e) => setCheckOut(e.target.value)} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message / Requirements</label>
            <textarea 
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
              placeholder="Tell us about your needs..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : (
              <>
                Submit Inquiry <Send className="h-4 w-4" />
              </>
            )}
          </button>
          {status === "error" && <p className="text-red-600 text-sm text-center">Something went wrong. Please try again.</p>}
          <p className="text-xs text-gray-500 text-center mt-4">
            By submitting this form, you agree to be contacted by our staff manually.
          </p>
        </form>
      )}
    </div>
  );
}
