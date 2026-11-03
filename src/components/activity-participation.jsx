"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { joinActivity, leaveActivity } from "@/app/activities/actions";
import SubmitButton from "@/components/submit-button";

export default function ActivityParticipation({ activityId, joined, title }) {
  const router = useRouter();
  const dialogRef = useRef(null);
  const [joinState, joinAction, joining] = useActionState(joinActivity, { error: "", success: false });
  const [leaveState, leaveAction, leaving] = useActionState(leaveActivity, { error: "", success: false });
  const state = joined ? leaveState : joinState;
  const action = joined ? leaveAction : joinAction;
  const pending = joining || leaving;

  useEffect(() => {
    if (state.success) {
      dialogRef.current?.close();
      router.refresh();
    }
  }, [state, router]);

  return <>
    <button type="button" className={`btn ${joined ? "btn-outline-dark" : "btn-dark"}`} onClick={() => dialogRef.current?.showModal()}>
      {joined ? "Keluar dari aktivitas" : "Gabung aktivitas"}
    </button>
    {state.error && <p role="alert" className="profile-message error mt-3">{state.error}</p>}
    <dialog ref={dialogRef} className="w-[min(100%-2rem,28rem)] rounded-2xl border border-court-950/10 bg-white p-0 text-court-950 shadow-2xl backdrop:bg-court-950/65">
      <div className="p-6 sm:p-7">
        <span className="activity-tag">Konfirmasi {joined ? "keluar" : "gabung"}</span>
        <h2 className="mt-4 font-display text-2xl font-extrabold">{joined ? "Keluar dari aktivitas?" : "Siap ikut bermain?"}</h2>
        <p className="mt-3 text-sm leading-6 text-court-950/65">
          {joined ? `Anda akan keluar dari ${title}. Slot akan tersedia kembali untuk pemain lain.` : `Pastikan jadwal dan peserta ${title} sudah sesuai. Setelah bergabung, aktivitas ini akan muncul di Aktivitas saya.`}
        </p>
        <form action={action} className="mt-6 flex flex-wrap gap-3">
          <input type="hidden" name="id" value={activityId} />
          <SubmitButton className="btn btn-dark" pendingText="Memproses...">{joined ? "Ya, keluar" : "Ya, gabung"}</SubmitButton>
          <button type="button" className="btn btn-outline-dark" disabled={pending} onClick={() => dialogRef.current?.close()}>Batal</button>
        </form>
        {state.error && <p role="alert" className="profile-message error mt-4">{state.error}</p>}
      </div>
    </dialog>
  </>;
}
