export type SchoolOption = { id: string; name: string };
export type SchoolLink = SchoolOption & { slug: string; status: "active" | "inactive" };
export type School = SchoolLink & {
  short_name: string | null; type: string; city: string | null; state: string | null;
  country: string | null; logo_url: string | null; description: string | null; created_at: string;
};
export const SCHOOL_SELECT = "id, name, slug, short_name, type, city, state, country, logo_url, description, status, created_at";
export const SCHOOL_TYPES = ["university", "polytechnic", "college", "secondary_school"] as const;
