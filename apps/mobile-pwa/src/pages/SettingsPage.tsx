import { SyncPage } from "./SyncPage";
import type { MobileSnapshot } from "../data/mobileRepository";

type SettingsPageProps = {
  snapshot: MobileSnapshot;
  refresh: () => Promise<void>;
  status: string;
  setStatus: (status: string) => void;
};

export function SettingsPage(props: SettingsPageProps) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[2.4rem] font-black leading-none">Settings</h1>
        <p className="mt-3 text-lg text-slate-400">Local data, privacy, import, and export.</p>
      </header>
      <SyncPage {...props} />
    </div>
  );
}
