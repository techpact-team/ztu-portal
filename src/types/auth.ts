import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { PermissionCode } from "@/lib/constants/permissions";
import type { RoleName } from "@/lib/constants/roles";
import type { Database } from "@/types/database";

export type AuthProfile = {
  id: string;
  authUserId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  accountStatus: "active" | "pending" | "disabled";
};

export type AuthContext = {
  user: User;
  profile: AuthProfile;
  roles: RoleName[];
  permissions: PermissionCode[];
  supabase: SupabaseClient<Database>;
};
