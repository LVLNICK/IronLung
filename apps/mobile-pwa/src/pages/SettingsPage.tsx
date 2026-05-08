import { SyncPage } from "./SyncPage";
import type { MobileSnapshot } from "../data/mobileRepository";
import { MobileHeader, MobilePage } from "../components/MobilePrimitives";

type SettingsPageProps = {
  snapshot: MobileSnapshot;
  refresh: () => Promise<void>;
  status: string;
  setStatus: (status: string) => void;
};

export function SettingsPage(props: SettingsPageProps) {
  return (
    <MobilePage>
      <MobileHeader title="Settings" subtitle="Local data, privacy, import, and export." />
      <SyncPage {...props} />
    </MobilePage>
  );
}
