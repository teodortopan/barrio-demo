"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    window.location.replace("/dashboard/");
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#E9E7E1] p-6">
      <Link className="text-sm font-semibold text-[#2d5016] underline" href="/dashboard/">
        Abrir Barrio Demo
      </Link>
    </main>
  );
}
