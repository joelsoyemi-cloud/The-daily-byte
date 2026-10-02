export function storySaveError(error: { code?: string } | null) {
  if (error?.code === "23505") return "This story address is already in use. Change the URL slug and try again.";
  if (error?.code === "23514") return "Check your story fields and school selection. Choose an available school or leave it empty.";
  return "Your story could not be saved. Your writing is still in this form. Check your connection, refresh your sign-in in another tab, and try again.";
}
