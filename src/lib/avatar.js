export async function getAvatarUrl(supabase, user) {
  if (user.user_metadata?.has_avatar !== true) return null;
  const { data, error } = await supabase.storage
    .from("smashmate-avatars")
    .createSignedUrl(`${user.id}/avatar`, 3600);
  return error ? null : data.signedUrl;
}
