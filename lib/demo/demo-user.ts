export const DEMO_USER_ID = "demo00000-0000-4000-a000-000000000001";
export const DEMO_PROFILE_ID = "demo00000-0000-4000-b000-000000000001";
export const DEMO_USER_NAME = "Martín Gómez";
export const DEMO_USER_EMAIL = "demo@example.com";
export const DEMO_USER_LOT = "7";

export const DEMO_PROFILE = {
  id: DEMO_PROFILE_ID,
  user_id: DEMO_USER_ID,
  name: DEMO_USER_NAME,
  email: DEMO_USER_EMAIL,
  lot: DEMO_USER_LOT,
  role: "administrador",
} as const;
