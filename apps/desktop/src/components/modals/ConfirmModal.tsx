import { Button } from "../forms/controls";

export function ConfirmModal({ title, body, confirmLabel = "Confirm", onConfirm, onCancel }: { title: string; body: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-xl border border-obsidian-strong bg-obsidian-800 p-5 shadow-soft">
        <div className="text-lg font-bold text-white">{title}</div>
        <p className="mt-2 text-sm leading-relaxed text-obsidian-muted">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
