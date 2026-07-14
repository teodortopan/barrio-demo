"use client";

import { useState, useEffect } from "react";
import { Banknote, Smartphone, X, Upload as UploadIcon, Eye, EyeOff, ShieldCheck, Wallet } from "lucide-react";
import type { VecinoData } from "@/lib/demo/types";
import { ACCOUNT_DATA_UPDATED_EVENT, type AccountDataUpdatedDetail } from "@/lib/account-events";

interface PaymentDisplayProps {
  initialPrices?: {
    anticipadoEfectivo: string;
    vencido: string;
    termino: string;
    recargo: string;
  };
  initialVecino?: VecinoData | null;
}

function formatARS(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$ 0";
  const rounded = Math.round(value);
  return "$ " + rounded.toLocaleString("es-AR");
}

const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

function getArgDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
}

function cuotaLabel(d: Date): string {
  return `CUOTA DE ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function vencimientoLabel(d: Date): string {
  // The "termino" tier ends on the 10th — last day before recargo applies.
  const dd = "10";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function computePaymentData(allPrices: { anticipadoEfectivo: string; vencido: string; termino: string; recargo: string }) {
  const argTime = new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" });
  const dayOfMonth = new Date(argTime).getDate();
  let efectivo = "", transferencia = "", montoHoy = "";
  if (dayOfMonth >= 1 && dayOfMonth <= 5) {
    efectivo = allPrices.anticipadoEfectivo || "$100.000";
    transferencia = allPrices.anticipadoEfectivo || "$100.000";
    montoHoy = efectivo;
  } else if (dayOfMonth >= 6 && dayOfMonth <= 10) {
    efectivo = allPrices.termino || "$120.000";
    transferencia = allPrices.termino || "$120.000";
    montoHoy = efectivo;
  } else {
    efectivo = allPrices.recargo || "$130.000";
    transferencia = allPrices.recargo || "$130.000";
    montoHoy = efectivo;
  }
  return { efectivo, transferencia, montoHoy };
}

export function PaymentDisplay({ initialPrices, initialVecino }: PaymentDisplayProps) {
  const [paymentData, setPaymentData] = useState<{
    efectivo: string;
    transferencia: string;
    montoHoy: string;
  } | null>(initialPrices ? computePaymentData(initialPrices) : null);
  const [vecino, setVecino] = useState<VecinoData | null>(initialVecino ?? null);
  const [loading, setLoading] = useState(!initialPrices);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [isInformarPagoModalOpen, setIsInformarPagoModalOpen] = useState(false);

  useEffect(() => {
    if (initialPrices) return;
    async function fetchPaymentData() {
      try {
        const response = await fetch("/api/payments");
        const data = await response.json();
        if (data.allPrices) {
          setPaymentData(computePaymentData(data.allPrices));
        }
      } catch (error) {
        console.error("Error fetching payment data:", error);
        const fallback = {
          anticipadoEfectivo: "$100.000",
          vencido: "$140.000",
          termino: "$120.000",
          recargo: "$130.000",
        };
        setPaymentData(computePaymentData(fallback));
      } finally {
        setLoading(false);
      }
    }
    fetchPaymentData();
  }, [initialPrices]);

  useEffect(() => {
    const handleAccountUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AccountDataUpdatedDetail>).detail;
      if ("vecino" in detail) setVecino(detail.vecino);
      if (detail.prices) setPaymentData(computePaymentData(detail.prices));
    };

    window.addEventListener(ACCOUNT_DATA_UPDATED_EVENT, handleAccountUpdate);
    return () => {
      window.removeEventListener(ACCOUNT_DATA_UPDATED_EVENT, handleAccountUpdate);
    };
  }, []);

  if (loading || !paymentData) {
    return (
      <div className="rounded-[14px] p-7" style={{ background: "#293219", color: "var(--cream-100)" }}>
        <div>Cargando…</div>
      </div>
    );
  }

  // Use the same stored account row as Cuenta corriente so both widgets agree.
  const cargoNumber = vecino?.cargo ?? 0;
  const saldoNumber = (vecino?.saldo ?? 0);
  const isAlDia = saldoNumber <= 0;
  const bigAmount = formatARS(cargoNumber);
  const today = getArgDate();
  const eyebrowLabel = `Estado de cuenta · ${cuotaLabel(today)}`;
  const statusLabel = isAlDia ? "Estás al día" : "Saldo a pagar";
  const subtitleLabel = `${statusLabel} · Vencimiento: ${vencimientoLabel(today)}`;

  return (
    <>
      <section
        data-tour-id="estado-cuenta"
        className="relative overflow-hidden rounded-[14px] border h-full flex flex-col justify-center text-center"
        style={{
          background: "#293219",
          borderColor: "#293219",
          color: "var(--cream-100)",
          padding: 28,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--forest-300)",
            marginBottom: 12,
          }}
        >
          {eyebrowLabel}
        </div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 40,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--cream-50)",
          }}
        >
          {bigAmount}
        </div>
        <div style={{ color: "var(--cream-200)", marginTop: 8, fontSize: 13 }}>
          {subtitleLabel}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 24,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setIsInformarPagoModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-sm font-medium border transition-colors hover:opacity-90"
            style={{
              background: "var(--earth-600)",
              color: "var(--cream-50)",
              borderColor: "var(--earth-700)",
            }}
          >
            <UploadIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Informar pago
          </button>
        </div>
      </section>

      {/* Coming Soon Modal */}
      {isComingSoonModalOpen && (
        <div
          onClick={() => setIsComingSoonModalOpen(false)}
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
              style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
            >
              <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
                <Wallet className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                  Pagar en línea
                </div>
                <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
                  Próximamente
                </h2>
              </div>
              <button
                onClick={() => setIsComingSoonModalOpen(false)}
                className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-sm text-[#3c3c3c] leading-relaxed">
                Estamos terminando la integración con la pasarela de pagos para que
                puedas saldar tu cuota directamente desde acá.
              </p>
              <p className="text-xs text-[#4d6547] mt-3 leading-relaxed">
                Mientras tanto, podés usar el botón <span className="font-semibold text-[#1a2617]">Informar pago</span> para
                avisarle a la administración de un pago en efectivo o por transferencia.
              </p>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setIsComingSoonModalOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informar Pago Modal */}
      {isInformarPagoModalOpen && (
        <InformarPagoModal
          isOpen={isInformarPagoModalOpen}
          onClose={() => setIsInformarPagoModalOpen(false)}
          saldo={saldoNumber}
        />
      )}
    </>
  );
}

interface InformarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  saldo: number;
}

function InformarPagoModal({ isOpen, onClose, saldo }: InformarPagoModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"efectivo" | "transferencia" | null>(null);
  const defaultAmount = Math.max(0, Math.round(Number(saldo) || 0));
  const [amount, setAmount] = useState(String(defaultAmount));
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Código state
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [confirmStep, setConfirmStep] = useState(0); // 0=none, 1=first, 2=second
  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedMethod(null);
      setAmount(String(defaultAmount));
      setFile(null);
      setShowConfirmation(false);
      setConfirmStep(0);
      // Don't reset generatedCode/showCode — we want it to persist across re-opens
    }
  }, [isOpen, defaultAmount]);

  // Fetch existing code when efectivo is selected
  useEffect(() => {
    if (selectedMethod === "efectivo" && !generatedCode) {
      setIsCheckingCode(true);
      (async () => {
        try {
          const res = await fetch("/api/resident/generate-code");
          const data = await res.json();
          if (data.codigo) {
            setGeneratedCode(data.codigo);
            setShowCode(false);
          }
        } catch { /* ignore */
        } finally {
          setIsCheckingCode(false);
        }
      })();
    }
  }, [selectedMethod, generatedCode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerateCode = async () => {
    if (isGeneratingCode || isCheckingCode || generatedCode) return;
    setIsGeneratingCode(true);
    try {
      const res = await fetch("/api/resident/generate-code", { method: "POST" });
      const data = await res.json();
      if (data.codigo) {
        setGeneratedCode(data.codigo);
        setShowCode(true);
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Error al generar el código");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSubmitClick = () => {
    if (isSubmitting) return;
    if (!selectedMethod || !amount) return;
    if (selectedMethod === "transferencia" && !file) {
      alert("Por favor, sube el comprobante de transferencia");
      return;
    }
    if (selectedMethod === "efectivo") {
      // Start 2-step confirmation
      setConfirmStep(1);
    } else {
      // Transferencia: submit directly
      doSubmit();
    }
  };

  const doSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setConfirmStep(0);
    try {
      const formData = new FormData();
      formData.append("paymentMethod", selectedMethod!);
      formData.append("amount", amount.trim());
      if (file) formData.append("file", file);

      const response = await fetch("/api/payments/informar-pago", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        alert(`Error: ${result.error || "Error al enviar el aviso de pago"}`);
        return;
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error submitting payment:", error);
      alert("Error al enviar el aviso de pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Confirmation step 1: Remind about code & envelope
  if (confirmStep === 1) {
    return (
      <div
        className="fixed inset-0 z-[100] grid place-items-center p-4"
        style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
            style={{ background: "linear-gradient(180deg, #fdf6e3, #faf6ec)" }}
          >
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-amber-100">
              <ShieldCheck className="w-5 h-5 text-amber-700" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-amber-700">
                Antes de enviar
              </div>
              <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
                Recordatorio importante
              </h2>
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-[#3c3c3c] leading-relaxed">
              Asegurate de haber <strong className="text-[#1a2617]">anotado tu código de verificación</strong> y
              de incluirlo <strong className="text-[#1a2617]">dentro del sobre</strong> junto con el dinero.
            </p>
            {generatedCode && (
              <div className="mt-4 rounded-[14px] bg-white border border-[#E9E2CE] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1 text-center">
                  Tu código
                </div>
                <p className="text-2xl font-mono font-bold text-[#2d5016] tracking-widest text-center">
                  {generatedCode}
                </p>
              </div>
            )}
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setConfirmStep(0)}
                className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium"
              >
                Volver
              </button>
              <button
                onClick={() => setConfirmStep(2)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation step 2: Final confirmation
  if (confirmStep === 2) {
    return (
      <div
        className="fixed inset-0 z-[100] grid place-items-center p-4"
        style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
            style={{ background: "linear-gradient(180deg, #fdecea, #faf6ec)" }}
          >
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-red-100">
              <ShieldCheck className="w-5 h-5 text-red-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-red-600">
                Última verificación
              </div>
              <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
                Confirmación final
              </h2>
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-[#3c3c3c] leading-relaxed">
              ¿Confirmás que el código{" "}
              <strong className="font-mono text-[#2d5016]">{generatedCode}</strong>{" "}
              está escrito e incluido dentro del sobre con el dinero?
            </p>
            <div className="mt-3 rounded-[14px] bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-[11px] text-red-700 leading-relaxed">
                Sin el código en el sobre, el pago no podrá ser verificado.
              </p>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setConfirmStep(1)}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
              >
                Volver
              </button>
              <button
                onClick={doSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Enviando…" : "Confirmar envío"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success confirmation screen
  if (showConfirmation) {
    return (
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[100] grid place-items-center p-4"
        style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
            style={{ background: "linear-gradient(180deg, #e8f1e0, #faf6ec)" }}
          >
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-green-100">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-green-700">
                Listo
              </div>
              <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
                Aviso enviado
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-[#3c3c3c] leading-relaxed">
              La administración verificará el pago y tu saldo se actualizará pronto.
            </p>
            {selectedMethod === "efectivo" && generatedCode && (
              <div className="mt-4 rounded-[14px] bg-white border border-[#E9E2CE] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1 text-center">
                  Tu código de verificación
                </div>
                <p className="text-2xl font-mono font-bold text-[#2d5016] tracking-widest text-center">
                  {generatedCode}
                </p>
                <p className="text-[11px] text-[#4d6547] mt-2 text-center">
                  Escribilo en el sobre con el dinero.
                </p>
              </div>
            )}
            <div className="flex justify-end mt-5">
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <UploadIcon className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Mi panel
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Informar pago
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Method Selection */}
          {!selectedMethod && (
            <>
              <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-3">
                Método de pago
              </div>
              <p className="text-xs text-[#3c3c3c] mb-4 leading-relaxed">
                Elegí cómo realizaste el pago para que la administración pueda verificarlo.
              </p>
              <div className="space-y-2.5 mb-2">
                {/* Efectivo Option */}
                <button
                  onClick={() => {
                    // Mark "checking" synchronously so the código block renders
                    // the spinner on the very first paint instead of briefly
                    // flashing the "Generar código" button before the GET fires.
                    if (!generatedCode) setIsCheckingCode(true);
                    setSelectedMethod("efectivo");
                  }}
                  className="w-full p-3 rounded-[14px] border border-[#E9E2CE] bg-white hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                      <Banknote className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">
                        Efectivo
                      </div>
                    </div>
                    <span className="shrink-0 text-[#2d5016] text-sm">→</span>
                  </div>
                </button>

                {/* Transferencia Option */}
                <button
                  onClick={() => setSelectedMethod("transferencia")}
                  className="w-full p-3 rounded-[14px] border border-[#E9E2CE] bg-white hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                      <Smartphone className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">
                        Transferencia
                      </div>
                    </div>
                    <span className="shrink-0 text-[#2d5016] text-sm">→</span>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Form when method is selected */}
          {selectedMethod && (
            <div className="space-y-4">
              {/* Method tag (so the user remembers which flow they're in) */}
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
                  {selectedMethod === "efectivo" ? (
                    <>
                      <Banknote className="w-3 h-3" strokeWidth={2} />
                      Efectivo
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3 h-3" strokeWidth={2} />
                      Transferencia
                    </>
                  )}
                </span>
              </div>

              {/* Código section for Efectivo */}
              {selectedMethod === "efectivo" && (
                <div className="rounded-[14px] bg-white border border-[#E9E2CE] px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-[14px] bg-[#2d5016]/10">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2d5016]" strokeWidth={1.8} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-[#1a2617]">
                      Código de verificación
                    </span>
                  </div>
                  {isCheckingCode ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-[11px] text-[#4d6547]">
                      <span className="inline-block w-3 h-3 rounded-full border-2 border-[#2d5016]/30 border-t-[#2d5016] animate-spin" />
                      Comprobando si ya tenés un código…
                    </div>
                  ) : !generatedCode ? (
                    <>
                      <p className="text-[11px] text-[#4d6547] mb-4 leading-relaxed">
                        Generá un código único para incluir en el sobre con el dinero. Permite que la administración verifique tu pago.
                      </p>
                      <button
                        onClick={handleGenerateCode}
                        disabled={isGeneratingCode || isCheckingCode}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {isGeneratingCode ? "Generando…" : "Generar código"}
                      </button>
                    </>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                          Tu código
                        </span>
                        <button
                          onClick={() => setShowCode(!showCode)}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
                          title={showCode ? "Ocultar código" : "Ver código"}
                        >
                          {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {showCode ? (
                        <p className="text-2xl font-mono font-bold text-[#2d5016] tracking-widest text-center py-1">
                          {generatedCode}
                        </p>
                      ) : (
                        <p className="text-2xl font-mono font-bold text-[#d9d2bf] tracking-widest text-center py-1">
                          ••••••
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5">
                  Monto pagado
                </label>
                <div className="flex items-stretch bg-white border border-[#E9E2CE] rounded-[14px] overflow-hidden focus-within:border-[#2d5016] transition-colors">
                  <span className="shrink-0 inline-flex items-center justify-center px-3 text-sm font-medium text-[#4d6547] bg-[#FBF8EF] border-r border-[#E9E2CE]">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Tu saldo actual: ${defaultAmount.toLocaleString("es-AR")}`}
                    className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent text-[#1a2617] placeholder:text-[#c9b893] focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#4d6547]">
                  Este valor corresponde a tu saldo actual. Podés cambiarlo si pagaste otro monto.
                </p>
              </div>

              {/* File Upload for Transferencia */}
              {selectedMethod === "transferencia" && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5">
                    Comprobante de transferencia <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-[#E9E2CE] rounded-[14px] p-4 bg-white hover:border-[#2d5016]/40 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10 mb-2">
                        <UploadIcon className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                      </div>
                      <span className="text-xs font-medium text-[#1a2617] text-center">
                        {file ? file.name : "Tocá para subir o arrastrá el archivo"}
                      </span>
                      <span className="text-[10px] text-[#4d6547] mt-1">
                        PDF, JPG, PNG, GIF o WEBP · máx. 10 MB
                      </span>
                    </label>
                  </div>
                  {file && (
                    <p className="mt-2 text-[11px] text-[#4d6547]">
                      Archivo seleccionado: <span className="font-medium text-[#1a2617]">{file.name}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  onClick={() => {
                    setSelectedMethod(null);
                    setAmount("");
                    setFile(null);
                  }}
                  className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium"
                >
                  Volver
                </button>
                <button
                  onClick={handleSubmitClick}
                  disabled={!amount || (selectedMethod === "efectivo" && !generatedCode) || (selectedMethod === "transferencia" && !file) || isSubmitting}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] text-xs font-semibold transition-colors ${
                    amount && (selectedMethod === "efectivo" ? generatedCode : file) && !isSubmitting
                      ? "bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec]"
                      : "bg-[#ede4d2] text-[#c9b893] cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? "Enviando…" : "Enviar aviso"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
