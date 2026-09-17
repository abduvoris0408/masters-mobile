import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/Avatar";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  CHAT_INVITE_LABEL,
  useChatMessagesQuery,
  useDeleteChatMessageMutation,
  useMarkChatReadMutation,
  useSendChatMessageMutation,
  useUpdateChatMessageMutation,
  useUploadChatImageMutation,
} from "@/services/chat";
import { useAuthStore } from "@/stores";
import { EChatMessageType, type IChatImage, type IChatMessage } from "@/types";
import { formatPrice, formatRelativeDay } from "@/utils/format";
import { showError } from "@/utils/toast";

const PAGE_SIZE_STEP = 30;
const GROUP_WINDOW_MS = 5 * 60 * 1000;

interface IPendingImage {
  localId: string;
  uri: string;
  serverId: number | null;
  uploading: boolean;
  error: boolean;
}

function readBoolean(value: boolean | string): boolean {
  return value === true || value === "true";
}

function InviteDetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-start gap-2">
      <Ionicons name={icon} size={13} color={colors.muted} style={{ marginTop: 1.5 }} />
      <Text className="flex-1 text-xs text-muted">
        {label}: <Text style={{ fontFamily: GOLOS_WEIGHTS.medium, color: colors.foreground }}>{value}</Text>
      </Text>
    </View>
  );
}

// Order/offer/application invite bubbles carry more structured content
// (price, address, budget range, comment) than a plain chat message, so they
// get their own wider card instead of squeezing that into a regular
// max-w-[78%] text bubble — each field is its own labeled row rather than
// being crammed onto shared lines, which used to wrap unpredictably and read
// as garbled on longer addresses/comments.
function InviteBubble({ message }: { message: IChatMessage }) {
  const colors = useThemeColors();
  const label = CHAT_INVITE_LABEL[message.type] ?? "Yangi xabar";
  const icon: keyof typeof Ionicons.glyphMap =
    message.type === EChatMessageType.ORDER_INVITE
      ? "clipboard-outline"
      : message.type === EChatMessageType.OFFER_INVITE
        ? "pricetag-outline"
        : "document-text-outline";

  return (
    <View className="w-[92%] max-w-[360px] gap-3 self-start rounded-2xl border border-border bg-surface p-4">
      <View className="flex-row items-center gap-2.5">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-accent/15">
          <Ionicons name={icon} size={15} color={colors.accent} />
        </View>
        <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {message.text || label}
        </Text>
      </View>

      {message.order ? (
        <View className="gap-2 border-t border-border pt-3">
          <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
            {formatPrice(Number(message.order.price))}
          </Text>
          {message.order.address ? <InviteDetailRow icon="location-outline" label="Manzil" value={message.order.address} /> : null}
          {message.order.comment ? <InviteDetailRow icon="chatbox-ellipses-outline" label="Izoh" value={message.order.comment} /> : null}
        </View>
      ) : message.offer ? (
        <View className="gap-2 border-t border-border pt-3">
          <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
            {formatPrice(Number(message.offer.price))}
          </Text>
          {message.offer.comment ? <InviteDetailRow icon="chatbox-ellipses-outline" label="Izoh" value={message.offer.comment} /> : null}
        </View>
      ) : message.application ? (
        <View className="gap-2 border-t border-border pt-3">
          {message.application.budget_from ? (
            <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
              {formatPrice(Number(message.application.budget_from))}
              {message.application.budget_to ? ` – ${formatPrice(Number(message.application.budget_to))}` : ""}
            </Text>
          ) : null}
          <InviteDetailRow icon="document-text-outline" label="Tavsif" value={message.application.description} />
        </View>
      ) : null}
    </View>
  );
}

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onLongPress,
}: {
  message: IChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  onLongPress: () => void;
}) {
  const isInvite = !!CHAT_INVITE_LABEL[message.type];
  if (isInvite) return <InviteBubble message={message} />;

  const isRead = readBoolean(message.is_read);
  const time = new Date(message.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

  return (
    <View className={`flex-row items-end gap-2 ${isOwn ? "self-end" : "self-start"}`}>
      {!isOwn ? (
        showAvatar ? (
          <Avatar uri={message.sender.photo} name={message.sender.name} size={26} />
        ) : (
          <View style={{ width: 26 }} />
        )
      ) : null}
      <Pressable
        onLongPress={onLongPress}
        className={`max-w-[78%] gap-1 rounded-2xl px-3.5 py-2.5 ${isOwn ? "bg-accent" : "bg-surface"}`}
      >
        {message.images && message.images.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {message.images.map((img: IChatImage) => (
              <Image key={img.id} source={{ uri: img.image }} className="rounded-xl" style={{ width: 140, height: 140 }} />
            ))}
          </View>
        ) : null}
        {message.text ? (
          <Text className={`text-sm ${isOwn ? "text-white" : "text-foreground"}`}>{message.text}</Text>
        ) : null}
        <View className="flex-row items-center justify-end gap-1">
          {message.updated_at && message.updated_at !== message.created_at ? (
            <Text className={`text-[10px] ${isOwn ? "text-white/70" : "text-muted"}`}>tahrirlangan</Text>
          ) : null}
          <Text className={`text-[10px] ${isOwn ? "text-white/70" : "text-muted"}`}>{time}</Text>
          {isOwn ? (
            <Ionicons name={isRead ? "checkmark-done" : "checkmark"} size={12} color="rgba(255,255,255,0.85)" />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

export default function ChatThreadScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { guid, id } = useLocalSearchParams<{ guid: string; id?: string }>();
  const chatId = id ? Number(id) : null;
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_STEP);
  const [draft, setDraft] = useState("");
  const [editingGuid, setEditingGuid] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<IPendingImage[]>([]);
  const readMarkedFor = useRef<string | null>(null);

  const { data, isLoading } = useChatMessagesQuery(guid ?? null, pageSize);
  const sendMutation = useSendChatMessageMutation();
  const updateMutation = useUpdateChatMessageMutation();
  const deleteMutation = useDeleteChatMessageMutation();
  const markReadMutation = useMarkChatReadMutation();
  const uploadImageMutation = useUploadChatImageMutation();

  useEffect(() => {
    if (!data || !guid || readMarkedFor.current === guid) return;
    readMarkedFor.current = guid;
    markReadMutation.mutate(guid);
  }, [data, guid]);

  const messages = useMemo(() => {
    const list = data?.results ?? [];
    return [...list].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return diff !== 0 ? diff : a.id - b.id;
    });
  }, [data]);

  const hasMore = (data?.count ?? 0) > messages.length;
  const otherName = messages.find((m) => m.sender.id !== currentUserId)?.sender.name ?? "Suhbat";

  type Row =
    | { kind: "divider"; key: string; label: string }
    | { kind: "message"; key: string; message: IChatMessage; isOwn: boolean; showAvatar: boolean };

  const rows = useMemo(() => {
    const out: Row[] = [];
    let prev: IChatMessage | null = null;
    messages.forEach((msg) => {
      const label = formatRelativeDay(msg.created_at, "Bugun", "Kecha");
      const prevLabel = prev ? formatRelativeDay(prev.created_at, "Bugun", "Kecha") : null;
      if (label !== prevLabel) out.push({ kind: "divider", key: `divider-${msg.id}`, label });

      const isOwn = msg.sender.id === currentUserId;
      const sameSenderAsPrev = prev?.sender.id === msg.sender.id;
      const withinWindow = prev
        ? new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS
        : false;
      const showAvatar = !isOwn && !(sameSenderAsPrev && withinWindow);

      out.push({ kind: "message", key: msg.guid, message: msg, isOwn, showAvatar });
      prev = msg;
    });
    return out;
  }, [messages, currentUserId]);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Ruxsat kerak", "Rasm tanlash uchun galereyaga ruxsat bering.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const accepted: IPendingImage[] = result.assets.map((asset) => ({
      localId: `${Date.now()}-${Math.random()}`,
      uri: asset.uri,
      serverId: null,
      uploading: true,
      error: false,
    }));
    setPendingImages((prev) => [...prev, ...accepted]);
    accepted.forEach((img) => {
      uploadImageMutation.mutate(
        { uri: img.uri, type: "image/jpeg", name: `chat-${img.localId}.jpg` },
        {
          onSuccess: (res) =>
            setPendingImages((prev) => prev.map((p) => (p.localId === img.localId ? { ...p, serverId: res.id, uploading: false } : p))),
          onError: () =>
            setPendingImages((prev) => prev.map((p) => (p.localId === img.localId ? { ...p, uploading: false, error: true } : p))),
        },
      );
    });
  };

  const removePendingImage = (localId: string) => setPendingImages((prev) => prev.filter((p) => p.localId !== localId));

  const canSend =
    !!chatId && (draft.trim().length > 0 || pendingImages.length > 0) && !pendingImages.some((p) => p.uploading);

  const handleSend = async () => {
    if (!chatId || !canSend) return;
    const text = draft.trim();
    const imageIds = pendingImages.filter((p) => p.serverId != null).map((p) => p.serverId as number);

    if (editingGuid) {
      try {
        await updateMutation.mutateAsync({ guid: editingGuid, text });
        setEditingGuid(null);
        setDraft("");
      } catch {
        showError("Xabarni tahrirlashda xatolik yuz berdi");
      }
      return;
    }

    setDraft("");
    setPendingImages([]);
    try {
      await sendMutation.mutateAsync({
        chat: chatId,
        type: EChatMessageType.TEXT,
        text: text || undefined,
        images: imageIds.length > 0 ? imageIds : undefined,
      });
    } catch {
      showError("Xabar yuborishda xatolik yuz berdi");
    }
  };

  const handleLongPress = (message: IChatMessage) => {
    const isOwn = message.sender.id === currentUserId;
    const options: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [];
    if (isOwn && message.type === EChatMessageType.TEXT) {
      options.push({
        text: "Tahrirlash",
        onPress: () => {
          setEditingGuid(message.guid);
          setDraft(message.text ?? "");
        },
      });
    }
    if (isOwn) {
      options.push({
        text: "O'chirish",
        style: "destructive",
        onPress: () => deleteMutation.mutate(message.guid),
      });
    }
    if (options.length === 0) return;
    options.push({ text: "Bekor qilish", style: "cancel" });
    Alert.alert("Xabar", undefined, options);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <Header title={otherName} onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : (
        <FlatList
          data={rows}
          inverted={false}
          keyExtractor={(row) => row.key}
          contentContainerClassName="gap-2 px-4 py-3"
          contentContainerStyle={{ paddingTop: headerHeight }}
          onEndReachedThreshold={0.3}
          onEndReached={() => hasMore && setPageSize((p) => p + PAGE_SIZE_STEP)}
          renderItem={({ item }) =>
            item.kind === "divider" ? (
              <Text className="my-1 self-center text-xs text-muted">{item.label}</Text>
            ) : (
              <MessageBubble
                message={item.message}
                isOwn={item.isOwn}
                showAvatar={item.showAvatar}
                onLongPress={() => handleLongPress(item.message)}
              />
            )
          }
          ListEmptyComponent={
            <Text className="mt-10 self-center text-sm text-muted">Hali xabarlar yo'q. Birinchi bo'lib yozing!</Text>
          }
        />
      )}

      {editingGuid ? (
        <View className="flex-row items-center gap-2 border-t border-border bg-surface px-4 py-2">
          <Ionicons name="pencil" size={14} color={colors.accent} />
          <Text className="flex-1 text-xs text-muted" numberOfLines={1}>
            Xabarni tahrirlash
          </Text>
          <Pressable
            onPress={() => {
              setEditingGuid(null);
              setDraft("");
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={16} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      {pendingImages.length > 0 ? (
        <View className="flex-row gap-2 border-t border-border bg-background px-4 pt-2">
          {pendingImages.map((img) => (
            <View key={img.localId} className="h-14 w-14 overflow-hidden rounded-xl border border-border">
              <Image source={{ uri: img.uri }} style={{ width: "100%", height: "100%", opacity: img.uploading ? 0.5 : 1 }} />
              {img.uploading ? (
                <View className="absolute inset-0 items-center justify-center">
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : null}
              <Pressable
                onPress={() => removePendingImage(img.localId)}
                className="absolute right-0.5 top-0.5 h-4 w-4 items-center justify-center rounded-full bg-black/55"
              >
                <Ionicons name="close" size={10} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View
        className="flex-row items-end gap-2 border-t border-border bg-background px-3 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <Pressable onPress={pickImages} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Ionicons name="image-outline" size={22} color={colors.muted} />
        </Pressable>
        <View className="flex-1 flex-row items-end rounded-2xl bg-surface px-4">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Xabar yozing..."
            placeholderTextColor={colors.muted}
            multiline
            style={{ maxHeight: 100, paddingVertical: 10, fontSize: 15, color: colors.foreground, flex: 1 }}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className={`h-10 w-10 items-center justify-center rounded-full ${canSend ? "bg-accent" : "bg-surface"}`}
        >
          <Ionicons name="send" size={16} color={canSend ? "#FFFFFF" : colors.muted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
