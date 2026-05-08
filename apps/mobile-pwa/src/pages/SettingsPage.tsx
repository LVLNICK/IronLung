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
        <h1 className="text-[2rem] font-black leading-none min-[400px]:text-[2.4rem]">Settings</h1>
        <p className="mt-2 text-base text-slate-400 min-[400px]:mt-3 min-[400px]:text-lg">Local data, privacy, import, and export.</p>
      </header>
      <SyncPage {...props} />
    </div>
  );
}
