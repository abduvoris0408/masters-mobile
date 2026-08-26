export interface IChatMuteStore {
  mutedChatGuids: string[];
  isMuted: (guid: string) => boolean;
  toggleMute: (guid: string) => void;
}
