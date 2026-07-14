"use client";

import { useState } from "react";
import {
  BookOpen,
  Users,
  Map,
  FileText,
  Archive,
  MessageCircle,
  MessageSquare,
  Phone,
  X,
} from "lucide-react";
import { FAQSection } from "@/components/faq-section";
import { AsambleaModal } from "@/components/asamblea-modal";
import { demoAdministracion } from "@/lib/demo/seed";

interface BibliotecaFile {
  document_type: string;
  filename: string;
  file_url: string;
  updated_at: string;
}

interface ConsejoContactProfile {
  name: string;
  lot: string;
  phone: string;
}

interface InformacionPageContentProps {
  initialBibliotecaFiles?: BibliotecaFile[];
  consejoContactProfiles?: ConsejoContactProfile[];
}

function normalizePersonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function nameTokens(value: string): string[] {
  return normalizePersonName(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function namesMatch(leaderName: string, accountName: string): boolean {
  const leader = normalizePersonName(leaderName);
  const account = normalizePersonName(accountName);
  if (!leader || !account) return false;
  if (leader === account) return true;

  const leaderTokens = nameTokens(leaderName);
  const accountTokens = new Set(nameTokens(accountName));
  if (leaderTokens.length === 0 || accountTokens.size === 0) return false;

  return leaderTokens.every((token) => accountTokens.has(token));
}

function extractLotNumbers(value: string): Set<string> {
  const matches = value.match(/\d+/g) || [];
  return new Set(matches.map((lot) => String(Number(lot))));
}

function findContactPhone(
  contacts: ConsejoContactProfile[],
  name: string,
  lot: string
): string | null {
  const expectedName = normalizePersonName(name);
  const expectedLots = extractLotNumbers(lot);
  if (!expectedName || expectedLots.size === 0) return null;

  const match = contacts.find((contact) => {
    if (!namesMatch(name, contact.name)) return false;
    const accountLots = extractLotNumbers(contact.lot);
    return Array.from(expectedLots).some((expectedLot) => accountLots.has(expectedLot));
  });

  return match?.phone || null;
}

function ContactButton({ phone, name }: { phone: string; name: string }) {
  const [open, setOpen] = useState(false);
  const digits = phone.replace(/[^\d]/g, "");
  // Argentine mobile international format: 549 + area + number (without leading 0).
  const localDigits = digits.replace(/^0/, "");
  const waDigits = localDigits.startsWith("549")
    ? localDigits
    : localDigits.startsWith("54")
      ? `549${localDigits.slice(2).replace(/^9/, "")}`
      : `549${localDigits}`;
  const waUrl = `https://wa.me/${waDigits}`;
  const nativePhone = phone.replace(/[^\d+]/g, "");
  const smsUrl = `sms:${nativePhone}`;
  const telUrl = `tel:${nativePhone}`;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Contactar a ${name}`}
        className="absolute right-1 top-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2d5016]/10 text-[#2d5016] hover:bg-[#2d5016]/20 transition-colors"
      >
        <Phone className="w-3 h-3" strokeWidth={2} />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          style={{
            background: "rgba(26,38,23,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-dashed border-[#E9E2CE]">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                  Contactar
                </p>
                <h2 className="text-sm font-bold uppercase text-[#1a2617] truncate">
                  {name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              <a
                href={telUrl}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-3 rounded-[14px] border border-[#E9E2CE] bg-white hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors"
              >
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                  <Phone
                    className="w-4 h-4 text-[#2d5016]"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2617]">
                    Llamar
                  </p>
                  <p className="text-[11px] text-[#4d6547]">
                    App de teléfono
                  </p>
                </div>
                <span className="shrink-0 text-[#2d5016] text-sm">→</span>
              </a>
              <a
                href={smsUrl}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-3 rounded-[14px] border border-[#E9E2CE] bg-white hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors"
              >
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                  <MessageSquare
                    className="w-4 h-4 text-[#2d5016]"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2617]">
                    Mensaje
                  </p>
                  <p className="text-[11px] text-[#4d6547]">
                    SMS o app de mensajes
                  </p>
                </div>
                <span className="shrink-0 text-[#2d5016] text-sm">→</span>
              </a>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-3 rounded-[14px] border border-[#E9E2CE] bg-white hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors"
              >
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-green-500/15">
                  <MessageCircle
                    className="w-4 h-4 text-green-700"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2617]">
                    WhatsApp
                  </p>
                  <p className="text-[11px] text-[#4d6547]">
                    Abrir conversación
                  </p>
                </div>
                <span className="shrink-0 text-[#2d5016] text-sm">→</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function InformacionPageContent({
  initialBibliotecaFiles,
  consejoContactProfiles = [],
}: InformacionPageContentProps) {
  const [isAsambleaModalOpen, setIsAsambleaModalOpen] = useState(false);

  const bibliotecaFiles = initialBibliotecaFiles || [];

  // Biblioteca documents - mapped from database
  const documentos: Array<{
    id: string;
    name: string;
    icon: typeof BookOpen;
    subtitle?: string;
  }> = [
    { id: "plano", name: "Plano de los lotes", icon: Map },
    { id: "reglamento", name: "Reglamento aprobado", icon: FileText, subtitle: "Puede enviar sus propuestas de modificación o sugerencias directamente desde Mi panel" },
    { id: "asamblea", name: "Archivo de actas de asamblea", icon: Archive },
  ];

  // All names and lot numbers come from the fictional demo seed.
  const administracion = demoAdministracion();

  // FAQ questions and answers
  const faqs = [
    {
      question: "¿Cuáles son los días y horarios para el ingreso de proveedores y obras?",
      answer: (
        <div className="space-y-2">
          <p>El ingreso de personal de servicio, técnico o de obras está regulado para proteger el descanso de los propietarios:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Lunes a viernes:</strong> 07:00 a 17:00 hs.</li>
            <li><strong>Sábados:</strong> 08:00 a 13:00 hs.</li>
            <li><strong>Domingos y feriados:</strong> Queda prohibido el ingreso de personal de obra sin excepción.</li>
          </ul>
          <p className="mt-2"><strong>Nota:</strong> Todo ingreso debe ser autorizado previamente por el propietario, y la Guardia está facultada para inspeccionar bienes y herramientas.</p>
        </div>
      )
    },
    {
      question: "¿Cómo es el sistema de pago y actualización de cuotas?",
      answer: (
        <div className="space-y-2">
          <p>El reglamento establece un régimen económico estricto para asegurar el mantenimiento del barrio:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Plazo de pago:</strong> Las expensas deben abonarse del día 1 al 10 de cada mes.</li>
            <li><strong>Actualización:</strong> El monto se actualiza cada 120 días corridos. El incremento ordinario tiene un tope del 50% respecto al período anterior, salvo disposición contraria de la Asamblea.</li>
            <li><strong>Mora e intereses:</strong> El vencimiento del plazo genera mora automática. Se aplica un interés punitorio del 3% mensual o la tasa activa del Banco Nación (la que resulte mayor).</li>
          </ul>
        </div>
      )
    },
    {
      question: "¿Cuáles son las normas de convivencia respecto a ruidos y velocidad?",
      answer: (
        <div className="space-y-2">
          <p>El objetivo principal es preservar la paz y la seguridad del entorno rural:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Velocidad Máxima:</strong> El límite de circulación interna para cualquier vehículo es de 20 km/h. El incumplimiento deriva en multas liquidadas en las expensas.</li>
            <li><strong>Ruidos Molestos:</strong> Se debe evitar cualquier ruido que altere el descanso de los vecinos. Las reuniones sociales deben limitarse estrictamente al predio del organizador y el volumen de la música no debe trascender a los lotes vecinos.</li>
          </ul>
        </div>
      )
    },
    {
      question: "¿Qué obligaciones tengo respecto al mantenimiento de mi lote?",
      answer: (
        <div className="space-y-2">
          <p>Todo propietario, tenga su lote baldío o construido, es responsable de su estética:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Mantenimiento obligatorio:</strong> El pasto debe mantenerse corto y las veredas y cunetas desmalezadas.</li>
            <li><strong>Plazos de intimación:</strong> Ante falta de mantenimiento, la Administración otorgará 10 días corridos para regularizar la situación antes de aplicar multas o realizar la limpieza con cargo al dueño.</li>
            <li><strong>Horarios para corte de pasto:</strong> Los fines de semana, el uso de maquinaria ruidosa se limita a la mañana de 09:00 a 11:00 hs y por la tarde de 16:00 hs en adelante.</li>
          </ul>
        </div>
      )
    },
    {
      question: "¿Qué obligaciones tengo con mis mascotas?",
      answer: (
        <div className="space-y-2">
          <p>El reglamento exige una tenencia responsable para evitar molestias y riesgos:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Límites:</strong> Solo se permiten animales domésticos dentro del lote. Los animales salvajes o peligrosos están prohibidos.</li>
            <li><strong>Seguridad:</strong> El lote debe tener un cerramiento que impida que el animal se escape. Si circula suelto por áreas comunes, la multa es automática.</li>
            <li><strong>Paseos:</strong> En la calle deben usar collar, correa y placa, bajo supervisión constante.</li>
            <li><strong>Higiene:</strong> Es obligatorio recoger las heces. No hacerlo implica multas liquidadas en las expensas.</li>
          </ul>
        </div>
      )
    },
    {
      question: "¿Qué debo cumplir para construir o extraer árboles?",
      answer: (
        <div className="space-y-2">
          <p>Toda obra o cambio en el paisaje requiere autorización y cumplir normas técnicas:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Planos:</strong> Se debe presentar el anteproyecto para verificar retiros de 0,50 metros de las medianeras y el frente.</li>
            <li><strong>Instalaciones:</strong> Es obligatorio tener cisterna propia, biodigestor y desengrasadores.</li>
            <li><strong>Acceso:</strong> La entrada al lote debe ser en dos módulos independientes para no obstruir pluviales.</li>
            <li><strong>Árboles:</strong> Solo se permite talar lo que esté en la huella de la casa, con permiso previo. Por cada árbol extraído, se deben plantar dos nuevos.</li>
          </ul>
        </div>
      )
    },
  ];

  // Section panel: white outer card + bold uppercase title with forest-tinted icon badge.
  const SectionTitle = ({
    icon: Icon,
    title,
  }: {
    icon: typeof BookOpen;
    title: string;
  }) => (
    <div className="flex items-center gap-3 mb-3">
      <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
        <Icon className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
      </div>
      <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
        {title}
      </h2>
    </div>
  );

  // Forest-themed group card used in Administración (replaces the bright #2d5016 blocks).
  const AdminGroup = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
      <div className="px-3 py-2 bg-[#2d5016]/10 border-b border-dashed border-[#E9E2CE]">
        <span className="block text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#2d5016]">
          {title}
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );

  const PersonRow = ({ name, lot }: { name: string; lot: string }) => {
    const phone = lot ? findContactPhone(consejoContactProfiles, name, lot) : null;
    return (
      <div className="relative text-center text-[10px] sm:text-[11px] text-[#1a2617] leading-tight px-5 py-1">
        {phone && <ContactButton phone={phone} name={name} />}
        <span className="font-medium block">{name}</span>
        {lot ? (
          <span className="text-[#4d6547] block whitespace-nowrap">
            Lote {lot}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#E9E7E1] pb-16">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Welcome line — page title lives in the topbar */}
        <div className="mb-6">
          <p className="text-sm text-[#3c3c3c]">
            Todo lo que necesitás saber sobre vivir en
            <span className="font-semibold text-[#1a1a1a]"> Barrio Demo</span>.
            <span className="hidden sm:inline"> Documentación oficial, preguntas frecuentes y administración del barrio.</span>
          </p>
        </div>

        {/* Main Grid - biblioteca + FAQ on the left, administración on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-stretch">
          {/* Section A: Biblioteca Digital and FAQ together */}
          <div className="space-y-6 flex flex-col h-full">
            {/* Biblioteca Digital */}
            <div data-tour-id="barrio-biblioteca" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6">
              <SectionTitle icon={BookOpen} title="Biblioteca digital" />
              <div className="space-y-2">
                {documentos.map((doc, index) => {
                  const Icon = doc.icon;
                  const file = bibliotecaFiles.find((f) => f.document_type === doc.id);
                  const isAvailable = file && file.file_url && doc.id !== "asamblea";
                  const clickable = isAvailable || doc.id === "asamblea";
                  const content = (
                    <>
                      <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                        <Icon className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1a2617] font-medium">{doc.name}</p>
                        {"subtitle" in doc && doc.subtitle && (
                          <p className="text-[10px] leading-tight text-[#4d6547] mt-1">{doc.subtitle}</p>
                        )}
                      </div>
                      {!isAvailable && doc.id !== "asamblea" && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#ede4d2] text-[#8b6f47] text-[10px] font-semibold uppercase tracking-wide">
                          No disponible
                        </span>
                      )}
                      {clickable && (
                        <span className="shrink-0 self-center text-[#2d5016] text-sm">→</span>
                      )}
                    </>
                  );
                  const className = `w-full flex items-start gap-3 p-3 rounded-[14px] border transition-colors text-left ${
                    clickable
                      ? "bg-[#FBF8EF] border-[#E9E2CE]/70 hover:border-[#2d5016]/40 hover:bg-white cursor-pointer"
                      : "bg-[#FBF8EF]/50 border-[#E9E2CE]/40 opacity-60 cursor-not-allowed"
                  }`;
                  if (doc.id === "asamblea") {
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setIsAsambleaModalOpen(true)}
                        className={className}
                      >
                        {content}
                      </button>
                    );
                  }
                  if (isAvailable && file?.file_url) {
                    return (
                      <a
                        key={index}
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {content}
                      </a>
                    );
                  }
                  return (
                    <div
                      key={index}
                      className={className}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preguntas Frecuentes */}
            <div data-tour-id="barrio-faq" className="flex-1">
              <FAQSection faqs={faqs} />
            </div>
          </div>

          {/* Section B: Consejo */}
          <div data-tour-id="barrio-consejo" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col">
            <SectionTitle icon={Users} title="Consejo" />
            <p className="text-xs text-[#3c3c3c] mb-4 leading-relaxed">
              Conocé a las personas que gestionan nuestro barrio
            </p>
            <div className="flex-1 flex flex-col gap-6">
              {/* Consejo */}
              <AdminGroup title="Consejo">
                {/* Flattened to a single 2-column grid (4 children) so each
                    row's two cards are direct siblings — the grid then forces
                    them to equal heights. The previous nested-column layout
                    let one column's first card grow taller than the other's,
                    pushing the second-row cards out of horizontal alignment. */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] bg-white border border-[#E9E2CE] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a2617] text-center mb-2">
                      Coordinación
                    </p>
                    <div className="space-y-1">
                      {administracion.consejo.coordinacion.map((person, i) => (
                        <PersonRow key={i} name={person.name} lot={person.lot} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[14px] bg-white border border-[#E9E2CE] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a2617] text-center mb-2">
                      Cuentas
                    </p>
                    <div className="space-y-1">
                      {administracion.consejo.cuentas.map((person, i) => (
                        <PersonRow key={i} name={person.name} lot={person.lot} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[14px] bg-white border border-[#E9E2CE] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a2617] text-center mb-2">
                      Mantenimiento
                    </p>
                    <div className="space-y-1">
                      {administracion.consejo.mantenimiento.map((person, i) => (
                        <PersonRow key={i} name={person.name} lot={person.lot} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[14px] bg-white border border-[#E9E2CE] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a2617] text-center mb-2">
                      Seguridad
                    </p>
                    <div className="space-y-1">
                      {administracion.consejo.seguridad.map((person, i) => (
                        <PersonRow key={i} name={person.name} lot={person.lot} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[14px] bg-white border border-[#E9E2CE] p-3 col-span-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a2617] text-center mb-2">
                      Urbanismo
                    </p>
                    <div className="space-y-1">
                      {administracion.consejo.urbanismo.length > 0 ? (
                        administracion.consejo.urbanismo.map((person, i) => (
                          <PersonRow key={i} name={person.name} lot={person.lot} />
                        ))
                      ) : (
                        <p className="text-center text-[11px] text-[#4d6547] italic">
                          Por designar próximamente
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </AdminGroup>

              {/* Delegados */}
              <AdminGroup title="Delegados">
                <div className="grid grid-cols-2 gap-2">
                  {administracion.delegados.map((person, i) => (
                    <div key={i} className="rounded-[14px] bg-white border border-[#E9E2CE] p-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#2d5016] mb-1">
                        {person.manzana}
                      </p>
                      <PersonRow name={person.name} lot={person.lot} />
                    </div>
                  ))}
                </div>
              </AdminGroup>

            </div>
          </div>
        </div>
      </div>

      {/* Asamblea Modal */}
      <AsambleaModal
        isOpen={isAsambleaModalOpen}
        onClose={() => setIsAsambleaModalOpen(false)}
      />
    </div>
  );
}
