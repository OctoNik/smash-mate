"use client";

import { useEffect } from "react";

export default function InviteFragmentRedirect() {
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.get("type") === "invite" && fragment.get("access_token")) {
      window.location.replace(`/invite${window.location.hash}`);
    }
  }, []);
  return null;
}
