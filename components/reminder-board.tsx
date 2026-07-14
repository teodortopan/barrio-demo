"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

export function ReminderBoard() {
  const [type, setType] = useState<"recordatorio" | "novedad">("recordatorio");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // TODO: Upload image to storage if imageFile exists
      // For now, we'll just store the image URL if provided
      // The static demo intercepts this request and leaves seeded data unchanged.

      const response = await fetch("/api/reminders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: type,
          title: title,
          content: content,
          imageUrl: imageUrl, // TODO: Replace with actual storage URL
        }),
      });

      const result = await response.json();

      if (result.error) {
        console.error("Error creating reminder:", result.error);
        alert("Error al crear el recordatorio/novedad");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);

      // Reset form after showing success
      setTimeout(() => {
        setTitle("");
        setContent("");
        setImageUrl(null);
        setIsSubmitted(false);
        // Trigger a page refresh to show the new reminder/novedad
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error submitting reminder:", error);
      alert("Error al crear el recordatorio/novedad");
      setIsSubmitting(false);
    }
  };

  return (
    <div data-tour-id="gestion-recordatorios" className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#2d5016] mb-2">
        Recordatorios o novedades
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as "recordatorio" | "novedad");
            setImageUrl(null);
          }}
          className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-1.5 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
          disabled={isSubmitting}
        >
          <option value="recordatorio">Recordatorio</option>
          <option value="novedad">Novedad</option>
        </select>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-1.5 text-xs text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
          required
          disabled={isSubmitting}
        />
        {type === "novedad" && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="image-upload"
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[14px] bg-white border border-[#E9E2CE] text-[#2d5016] hover:bg-[#FBF8EF] hover:border-[#2d5016]/40 transition-colors cursor-pointer text-[10px] font-semibold"
            >
              <Upload className="w-3 h-3" />
              Subir imagen
            </label>
            {imageUrl && (
              <span className="text-[10px] text-[#4d6547]">Imagen seleccionada</span>
            )}
          </div>
        )}
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenido"
          className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-1.5 text-xs text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors resize-none"
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
              {isSubmitting ? "Enviando…" : "Publicar"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
