"use client";

import { useState } from "react";

export function CalendarEventForm() {
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    // The native <input type="date"> yields YYYY-MM-DD; the API expects
    // DD/MM/YYYY. Convert before sending so the server contract is unchanged.
    const [y, m, d] = eventDate.split("-");
    const eventDateDDMMYYYY = y && m && d ? `${d}/${m}/${y}` : eventDate;

    try {
      const response = await fetch("/api/calendar-events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDate: eventDateDDMMYYYY,
          eventTime,
          title,
        }),
      });

      const result = await response.json();

      if (result.error) {
        console.error("Error creating calendar event:", result.error);
        alert("Error al crear el evento del calendario");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);

      // Reset form after showing success
      setTimeout(() => {
        setEventDate("");
        setEventTime("");
        setTitle("");
        setIsSubmitted(false);
        // Trigger a page refresh to show the new event
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error submitting calendar event:", error);
      alert("Error al crear el evento del calendario");
      setIsSubmitting(false);
    }
  };

  return (
    <div data-tour-id="gestion-calendario" className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#2d5016] mb-2">
        Calendario de eventos
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-1.5 text-xs text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
            required
            disabled={isSubmitting}
          />
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-1.5 text-xs text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
            required
            disabled={isSubmitting}
          />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título del evento"
          className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-1.5 text-xs text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
          required
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          {isSubmitted ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-green-50 text-green-700 text-[10px] font-semibold">
              ¡Enviado!
            </span>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Enviando…" : "Crear evento"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
