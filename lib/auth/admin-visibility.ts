export interface AdminVisibility {
  role: string;
  isAdmin: boolean;
  canSeeCommunity: boolean;
  canSeeUsuarios: boolean;
  canSeeInfo: boolean;
  canSeeReclamos: boolean;
  canSeeReclamosFeed: boolean;
  canSeeGestion: boolean;
  canSeeFinance: boolean;
  canSeeEgresos: boolean;
  canSeeConsumo: boolean;
  canSeeFinanceArchive: boolean;
  canSeeSecurityArchive: boolean;
  canEditFinance: boolean;
  canCreateEgresos: boolean;
  canEditEgresos: boolean;
  canEditInfo: boolean;
  canManageRoles: boolean;
}

export const DEMO_ADMIN_VISIBILITY: AdminVisibility = {
  role: "administrador",
  isAdmin: true,
  canSeeCommunity: true,
  canSeeUsuarios: true,
  canSeeInfo: true,
  canSeeReclamos: true,
  canSeeReclamosFeed: true,
  canSeeGestion: true,
  canSeeFinance: true,
  canSeeEgresos: true,
  canSeeConsumo: true,
  canSeeFinanceArchive: true,
  canSeeSecurityArchive: true,
  canEditFinance: true,
  canCreateEgresos: true,
  canEditEgresos: true,
  canEditInfo: true,
  canManageRoles: true,
};
