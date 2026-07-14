import type { VecinoData } from "@/lib/demo/types";

export const ACCOUNT_DATA_UPDATED_EVENT = "sj:account-data-updated";
export const ACCOUNT_DATA_REFRESH_EVENT = "sj:account-data-refresh";

export interface AccountDataUpdatedDetail {
  vecino: VecinoData | null;
  prices?: {
    anticipadoEfectivo: string;
    vencido: string;
    termino: string;
    recargo: string;
  } | null;
}
