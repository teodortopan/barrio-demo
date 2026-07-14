export interface PaymentPricesData {
  anticipadoEfectivo: string;
  termino: string;
  recargo: string;
  vencido: string;
}

export interface CuotaDetailRow {
  id: string;
  label: string;
  amount: string;
  position: number;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  name: string | null;
  lot: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

export interface AdminComplaint {
  id: string;
  user_id: string;
  profile_id: string;
  title: string;
  description: string;
  category: string;
  complaint_type: string | null;
  admin_comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: { name: string; lot: string } | null;
}

export interface UserComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  complaint_type: string | null;
  admin_comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserVisit {
  id: string;
  visitor_name: string;
  visitor_dni: string;
  visit_date: string;
  visit_time: string;
  license_plate: string | null;
  relationship: string;
  notes: string | null;
  guard_comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  type: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_role: string | null;
}

export interface VecinoData {
  id?: string;
  lote: string;
  propietario: string;
  concepto: string;
  cuotas: string | null;
  cargo: number;
  pago: number;
  saldo: number;
  estado: string;
  mes_corriente?: number;
  saldo_anterior?: number;
  fecha_pago: string | null;
  codigo: string | null;
  comprobante_url: string | null;
}

export interface VecinoHistoryEntry {
  id: string;
  lote: string;
  propietario: string;
  concepto: string;
  cargo: number;
  pago: number;
  saldo: number;
  estado: string;
  fecha_pago: string | null;
  comprobante_url: string | null;
  period_year: number;
  period_month: number;
  archived_at: string;
}

export interface DeudorRow {
  id: string;
  lote: string;
  propietario: string;
  concepto: string;
  cargo: number;
  saldo: number;
  estado: string;
}

export interface ExpenseRow {
  id: string;
  fecha: string;
  vencimiento: string;
  concepto: string;
  categoria: string;
  proveedor: string;
  saldo: string;
  comprobante: string;
  factura: string;
  estado: string;
}

export interface ConsejoContactProfile {
  name: string;
  lot: string;
  phone: string;
}

export interface ConsumoElectricoRow {
  id: string;
  propietario: string;
  lote: string;
  pilar: boolean;
  jabalina: boolean;
  termica: boolean;
  fecha_medicion: string | null;
  numero_medidor: string | null;
  lectura: number | null;
  lectura_anterior: number | null;
}

export interface TotalPaymentsData {
  total: number;
  totalGastos: number;
  totalPendientes: number;
}

export interface CalendarEvent {
  id: string;
  date: number;
  month: number;
  year: number;
  event: string;
}

export interface Ingresante {
  id: string;
  lote: string;
  nombre_apellido: string;
  tipo: "Propietario" | "Visita" | "Empleado";
  horario: string;
  documentacion: string | null;
}

export interface BibliotecaFile {
  document_type: string;
  filename: string;
  file_url: string;
  updated_at: string;
}

export interface AsambleaFile {
  id: string;
  filename: string;
  file_url: string;
  year: number | null;
  month: number | null;
  created_at: string;
}

export interface CurrentShift {
  guard_name: string;
  next_shift_guard: string | null;
  next_shift_time: string | null;
}

export interface Recorrido {
  id: string;
  recorrido_time: string;
  notes: string | null;
  recorrido_date: string;
}

export interface GuardShift {
  id: string;
  guard_name: string;
  shift_date: string;
  shift_time: string;
  notes: string | null;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}
