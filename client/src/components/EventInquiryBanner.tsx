import { useState } from "react";
import { ChevronRight, X, PartyPopper, Loader2 } from "lucide-react";

export default function EventInquiryBanner() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    eventName: "",
    eventLocation: "",
    phone: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit() {
    if (!form.name || !form.eventName || !form.eventLocation || !form.phone) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/event-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-[#3E2723]">
      {/* ── Banner strip ── */}
      <button
        onClick={() => { setOpen(!open); setSubmitted(false); setError(""); }}
        className="w-full flex items-center justify-between px-4 md:px-8 py-3 text-left group"
      >
        <div className="flex items-center gap-2.5">
          <PartyPopper className="h-5 w-5 text-[#F5C842] flex-shrink-0" />
          <span className="text-white text-sm font-semibold tracking-wide">
            Planning an Event?{" "}
            <span className="text-[#F5C842] font-bold">
              Let our experts create the perfect spread for you!
            </span>
          </span>
        </div>
        <span className="flex items-center gap-1 text-[#F5C842] text-xs font-semibold flex-shrink-0 ml-2">
          {open ? "Close" : "Enquire Now"}
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
        </span>
      </button>

      {/* ── Collapsible form ── */}
      {open && (
        <div className="bg-[#F5EFE6] px-4 md:px-8 py-5 border-t border-[#6B3E2E]/30">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[#3E2723] font-bold text-lg text-center">
                Our experts will call you shortly!
              </p>
              <p className="text-gray-500 text-sm text-center">
                We've received your request. Expect a call within 30 minutes.
              </p>
              <button
                onClick={() => { setOpen(false); setSubmitted(false); setForm({ name: "", eventName: "", eventLocation: "", phone: "" }); }}
                className="mt-1 text-sm text-[#6B3E2E] underline"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-[#3E2723] font-semibold text-sm mb-4">
                Fill in the details below and we'll get back to you with a custom quote.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B3E2E] mb-1 uppercase tracking-wide">
                    Your Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#D4B896] bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B3E2E]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B3E2E] mb-1 uppercase tracking-wide">
                    Event Name
                  </label>
                  <input
                    name="eventName"
                    value={form.eventName}
                    onChange={handleChange}
                    placeholder="e.g. Birthday Party / Wedding"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#D4B896] bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B3E2E]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B3E2E] mb-1 uppercase tracking-wide">
                    Event Location
                  </label>
                  <input
                    name="eventLocation"
                    value={form.eventLocation}
                    onChange={handleChange}
                    placeholder="e.g. Civil Lines, Prayagraj"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#D4B896] bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B3E2E]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B3E2E] mb-1 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#D4B896] bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B3E2E]/40"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-2 text-red-600 text-xs font-medium">{error}</p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#6B3E2E] hover:bg-[#8B5E3C] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {loading ? "Submitting…" : "Submit Request"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
