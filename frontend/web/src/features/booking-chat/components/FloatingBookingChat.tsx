"use client";

import { FormEvent, useEffect, useState } from "react";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";

import { sendBookingChatMessage } from "../api";
import type { BookingChatConfirmation, BookingChatMessage, BookingChatResponse } from "../types";

type GuidedMode = "book" | "reschedule" | "cancel" | "lookup";
type WizardStep = "intent" | "appointment" | "service" | "date" | "summary";
type DialoguePolicyIntent =
  | "identity"
  | "social"
  | "abuse"
  | "booking_intent"
  | "appointment_lookup"
  | "appointment_change"
  | "out_of_scope"
  | "unknown";
type DialoguePolicyAction = "local_reply" | "open_wizard" | "call_langgraph" | "show_reply";

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: BookingChatMessage[];
}

interface WizardState {
  mode: GuidedMode | null;
  appointmentCode: string;
  service: string;
  date: string;
}

interface DialoguePolicyDecision {
  intent: DialoguePolicyIntent;
  action: DialoguePolicyAction;
  wizardMode?: GuidedMode;
}

const STORAGE_KEY = "smile-booking-chat-conversations";
const ACTIONS: Array<{ mode: GuidedMode; label: string; icon: string }> = [
  { mode: "book", label: "Book an appointment", icon: "lucide:calendar-plus" },
  { mode: "reschedule", label: "Move an appointment", icon: "lucide:calendar-clock" },
  { mode: "cancel", label: "Cancel an appointment", icon: "lucide:calendar-x" },
  { mode: "lookup", label: "View appointments", icon: "lucide:list-checks" },
];

const emptyWizard: WizardState = {
  mode: null,
  appointmentCode: "",
  service: "",
  date: "",
};

function createId(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}

function welcomeMessage(): BookingChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text: "Hi, I am SMILE's scheduling assistant. Choose an option below or type what you need.",
    safeState: {},
  };
}

function createConversation() {
  return {
    id: createId("conversation"),
    title: "New conversation",
    createdAt: Date.now(),
    messages: [welcomeMessage()],
  };
}

function buildGuidedMessage(wizard: WizardState) {
  if (wizard.mode === "lookup") {
    return "Show my upcoming SMILE appointments.";
  }
  if (wizard.mode === "cancel") {
    return `Cancel appointment ${wizard.appointmentCode}.`;
  }

  const base = wizard.mode === "reschedule"
    ? `Move appointment ${wizard.appointmentCode}`
    : "Book a SMILE dental appointment";
  const parts = [
    wizard.service ? `service: ${wizard.service}` : "",
    wizard.date ? `preferred date: ${wizard.date}` : "",
  ].filter(Boolean);
  return `${base}. ${parts.join("; ")}. Please find a matching available slot and ask me to confirm.`
    .replace(/\s+/g, " ")
    .trim();
}

function summaryItems(wizard: WizardState) {
  return [
    ["Request", ACTIONS.find((item) => item.mode === wizard.mode)?.label],
    ["Appointment", wizard.appointmentCode],
    ["Service", wizard.service],
    ["Date", wizard.date],
  ].filter((item): item is [string, string] => Boolean(item[1]));
}

function MessageText({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const shouldList = lines.length > 1 || lines.some((line) => /^[-*]\s+/.test(line));
  if (!shouldList) return <p>{text}</p>;
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const isBullet = /^[-*]\s+/.test(line);
        return isBullet ? (
          <div key={`${line}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
            <span>{line.replace(/^[-*]\s+/, "")}</span>
          </div>
        ) : (
          <p key={`${line}-${index}`}>{line}</p>
        );
      })}
    </div>
  );
}

type BookingOptionPreview = {
  id?: string;
  summary?: string;
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  doctor_name?: string;
  clinic_name?: string;
  room_name?: string;
  service_name?: string;
};

type AppointmentPreview = {
  id?: string;
  appointment_id?: string;
  appointment_code?: string;
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  status?: string;
  service_name?: string;
  doctor_name?: string;
  clinic_name?: string;
  room_name?: string;
};

function slotLabel(item: BookingOptionPreview) {
  return [item.appointment_date, item.appointment_time].filter(Boolean).join(" • ") || item.summary || "Available SMILE slot";
}

function appointmentIdOf(item: AppointmentPreview) {
  return item.appointment_code ?? item.id ?? item.appointment_id ?? "";
}

function appointmentLabel(item: AppointmentPreview) {
  return [item.appointment_date, item.appointment_time].filter(Boolean).join(" • ") || item.appointment_code || "Appointment";
}

function buildCancelAppointmentMessage(item: AppointmentPreview) {
  return `Cancel appointment ${appointmentIdOf(item)}.`;
}

function buildRescheduleAppointmentMessage(item: AppointmentPreview) {
  return `Move appointment ${appointmentIdOf(item)}.`;
}

function buildSlotSelectionMessage(
  item: BookingOptionPreview,
  flow?: BookingChatMessage["flow"],
  appointmentCode?: string,
) {
  const details = [
    item.service_name ? `service: ${item.service_name}` : "",
    item.appointment_date ? `preferred date: ${item.appointment_date}` : "",
    item.appointment_time ? `preferred time: ${item.appointment_time}` : "",
    item.doctor_name ? `doctor: ${item.doctor_name}` : "",
    item.room_name ? `room: ${item.room_name}` : "",
    item.clinic_name ? `clinic: ${item.clinic_name}` : "",
  ].filter(Boolean);
  if (flow === "reschedule" && appointmentCode) {
    return `Move appointment ${appointmentCode}. ${details.join("; ")}. Please prepare this exact slot for confirmation.`;
  }
  return `Book a SMILE dental appointment. ${details.join("; ")}. Please prepare this exact slot for confirmation.`;
}

function AssistantDataCard({
  message,
  onSelectSlot,
  onCancelAppointment,
  onRescheduleAppointment,
  isSending,
}: {
  message: BookingChatMessage;
  onSelectSlot: (option: BookingOptionPreview, flow?: BookingChatMessage["flow"], appointmentCode?: string) => void;
  onCancelAppointment: (appointment: AppointmentPreview) => void;
  onRescheduleAppointment: (appointment: AppointmentPreview) => void;
  isSending: boolean;
}) {
  const option = message.safeState?.booking_option as BookingOptionPreview | undefined;
  const options = message.safeState?.booking_options as BookingOptionPreview[] | undefined;
  const appointments = message.safeState?.appointments as AppointmentPreview[] | undefined;

  if (option) {
    const slotItems = options?.length ? options : [option];
    const groupedSlots = slotItems.reduce<Array<{ key: string; title: string; items: BookingOptionPreview[] }>>((groups, item) => {
      const title = [item.doctor_name, item.room_name, item.clinic_name].filter(Boolean).join(" • ") || "SMILE slot";
      const existing = groups.find((group) => group.key === title);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ key: title, title, items: [item] });
      }
      return groups;
    }, []);

    return (
      <div className="mt-3 space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Choose an available slot</p>
          <span className="rounded bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-900">{slotItems.length} open</span>
        </div>
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {groupedSlots.map((group) => (
            <div key={group.key} className="rounded border border-emerald-100 bg-white/75 p-2">
              <p className="font-medium text-emerald-950">{group.title}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.items.map((item) => (
                  <button
                    key={item.id ?? `${item.appointment_date}-${item.appointment_time}-${group.key}`}
                    type="button"
                    onClick={() => onSelectSlot(
                      item,
                      message.flow,
                      typeof message.safeState?.appointment_code === "string" ? message.safeState.appointment_code : undefined,
                    )}
                    disabled={isSending}
                    className="rounded border border-emerald-200 bg-white px-2 py-2 text-left text-[11px] text-emerald-950 transition hover:border-smile-primary hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="block font-semibold">{item.appointment_time ?? slotLabel(item)}</span>
                    <span className="mt-0.5 block text-emerald-800/80">
                      {item.duration_minutes ? `${item.duration_minutes} min` : item.appointment_date}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(appointments) && appointments.length > 0) {
    return (
      <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700">
        <p className="font-semibold text-slate-900">Upcoming appointments</p>
        {appointments.slice(0, 4).map((appointment, index) => (
          <div key={`${appointmentIdOf(appointment) || index}`} className="rounded-md border border-slate-100 p-3 first:border-t first:pt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-950">{appointment.appointment_code ?? "Appointment"}</p>
                <p className="mt-1 text-slate-700">{appointmentLabel(appointment)}</p>
                <p className="mt-1 text-slate-500">
                  {[appointment.service_name, appointment.doctor_name, appointment.room_name, appointment.clinic_name].filter(Boolean).join(" • ") || "Details available in your account"}
                </p>
                {appointment.status ? (
                  <span className="mt-2 inline-flex rounded bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                    {appointment.status}
                  </span>
                ) : null}
              </div>
              {appointmentIdOf(appointment) ? (
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onRescheduleAppointment(appointment)}
                    disabled={isSending}
                    className="rounded border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-smile-primary hover:text-smile-primary disabled:opacity-60"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancelAppointment(appointment)}
                    disabled={isSending}
                    className="rounded border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function policyIntentForResponse(response: BookingChatResponse): DialoguePolicyIntent {
  const policyIntent = response.metadata?.policy_intent;
  if (
    policyIntent === "identity" ||
    policyIntent === "social" ||
    policyIntent === "abuse" ||
    policyIntent === "booking_intent" ||
    policyIntent === "appointment_lookup" ||
    policyIntent === "out_of_scope"
  ) {
    return policyIntent;
  }
  if (policyIntent === "appointment_change") return "appointment_change";
  if (response.flow === "booking") return "booking_intent";
  if (response.flow === "lookup") return "appointment_lookup";
  if (response.flow === "cancel" || response.flow === "reschedule") return "appointment_change";
  if (response.flow === "out_of_scope") return "out_of_scope";
  if (response.flow === "conversational") {
    const dialogueAct = response.metadata?.dialogue_act;
    return dialogueAct === "identity" ? "identity" : "social";
  }
  return "unknown";
}

function dialoguePolicyForResponse(response: BookingChatResponse): DialoguePolicyDecision {
  const intent = policyIntentForResponse(response);
  const outcomeCode = response.metadata?.outcome_code;

  if (outcomeCode === "clarification_required") {
    if (response.flow === "booking") return { intent, action: "open_wizard", wizardMode: "book" };
    if (response.flow === "reschedule") return { intent, action: "open_wizard", wizardMode: "reschedule" };
    if (response.flow === "cancel") return { intent, action: "open_wizard", wizardMode: "cancel" };
  }

  return { intent, action: "show_reply" };
}

export function FloatingBookingChat() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(() => [createConversation()]);
  const [activeId, setActiveId] = useState(() => conversations[0]?.id ?? "");
  const [pendingConfirmation, setPendingConfirmation] = useState<BookingChatConfirmation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("intent");
  const [wizard, setWizard] = useState<WizardState>(emptyWizard);
  const [size, setSize] = useState({ width: 780, height: 620 });
  const [historyOpen, setHistoryOpen] = useState(true);

  const patientId = user?.userId;
  const activeConversation = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const canSend = Boolean(patientId && input.trim() && !isSending && !wizardOpen);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Conversation[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setConversations(parsed);
        setActiveId(parsed[0].id);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  function updateConversation(conversationId: string, updater: (conversation: Conversation) => Conversation) {
    setConversations((current) => current.map((conversation) => (
      conversation.id === conversationId ? updater(conversation) : conversation
    )));
  }

  function addConversation() {
    const next = createConversation();
    setConversations((current) => [next, ...current]);
    setActiveId(next.id);
    setPendingConfirmation(null);
  }

  function appendMessage(conversationId: string, message: BookingChatMessage) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: conversation.title === "New conversation" && message.role === "user"
        ? message.text.slice(0, 42)
        : conversation.title,
      messages: [...conversation.messages, message],
    }));
  }

  function openWizard(mode?: GuidedMode) {
    setWizard(mode ? { ...emptyWizard, mode } : emptyWizard);
    setWizardStep(mode ? nextStepForMode(mode) : "intent");
    setWizardOpen(true);
  }

  function beginResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    function onMove(moveEvent: PointerEvent) {
      const nextWidth = Math.min(window.innerWidth - 32, Math.max(360, startWidth + (startX - moveEvent.clientX)));
      const nextHeight = Math.min(window.innerHeight - 32, Math.max(520, startHeight + (startY - moveEvent.clientY)));
      setSize({ width: nextWidth, height: nextHeight });
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function nextStepForMode(mode: GuidedMode): WizardStep {
    if (mode === "lookup") return "summary";
    if (mode === "cancel") return "appointment";
    if (mode === "reschedule") return "appointment";
    return "service";
  }

  function advanceWizard() {
    if (wizardStep === "intent" && wizard.mode) {
      setWizardStep(nextStepForMode(wizard.mode));
      return;
    }
    if (wizardStep === "appointment") {
      setWizardStep(wizard.mode === "cancel" ? "summary" : "service");
      return;
    }
    if (wizardStep === "service") setWizardStep("date");
    if (wizardStep === "date") setWizardStep("summary");
  }

  async function submitWizard() {
    if (!wizard.mode) return;
    const message = buildGuidedMessage(wizard);
    setWizardOpen(false);
    await sendToAgent(message, message, undefined, undefined, false);
  }

  async function submitInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    await sendToAgent(text, text, undefined, undefined, true);
  }

  async function confirmChange(confirmed: boolean) {
    if (!pendingConfirmation) return;
    setPendingConfirmation(null);
    await sendToAgent(
      confirmed ? "Confirm" : "Cancel confirmation",
      confirmed ? "Yes, confirm this change." : "No, do not make this change.",
      pendingConfirmation.token,
      confirmed,
      false,
    );
  }

  async function selectSlot(
    option: BookingOptionPreview,
    flow?: BookingChatMessage["flow"],
    appointmentCode?: string,
  ) {
    const message = buildSlotSelectionMessage(option, flow, appointmentCode);
    const visibleText = `I choose ${slotLabel(option)}${option.doctor_name ? ` with ${option.doctor_name}` : ""}.`;
    await sendToAgent(message, visibleText, undefined, undefined, false, true, option.id);
  }

  async function cancelAppointment(appointment: AppointmentPreview) {
    await sendToAgent(
      buildCancelAppointmentMessage(appointment),
      `Cancel ${appointmentLabel(appointment)}.`,
      undefined,
      undefined,
      false,
      true,
    );
  }

  async function rescheduleAppointment(appointment: AppointmentPreview) {
    await sendToAgent(
      buildRescheduleAppointmentMessage(appointment),
      `Reschedule ${appointmentLabel(appointment)}.`,
      undefined,
      undefined,
      false,
      false,
    );
  }

  async function sendToAgent(
    message: string,
    visibleText = message,
    confirmationToken?: string,
    confirmed?: boolean,
    allowWizardAutoOpen = false,
    allowMultiOptionConfirmation = false,
    selectedBookingOptionId?: string,
  ) {
    if (!patientId || !activeConversation || isSending) return;
    const conversationId = activeConversation.id;
    setIsSending(true);
    setError(null);
    appendMessage(conversationId, {
      id: createId("message"),
      role: "user",
      text: visibleText,
      safeState: {},
    });
    try {
      const response = await sendBookingChatMessage({
        session_id: conversationId,
        message,
        selected_booking_option_id: selectedBookingOptionId,
        confirmation_token: confirmationToken,
        confirmed,
      });
      const hasMultipleBookingOptions = (response.flow === "booking" || response.flow === "reschedule")
        && Array.isArray(response.safe_state?.booking_options)
        && response.safe_state.booking_options.length > 1;
      setPendingConfirmation(hasMultipleBookingOptions && !allowMultiOptionConfirmation ? null : response.confirmation);
      appendMessage(conversationId, {
        id: createId("message"),
        role: "assistant",
        text: response.reply,
        flow: response.flow,
        confirmation: response.confirmation,
        safeState: response.safe_state,
      });
      const policy = dialoguePolicyForResponse(response);
      if (allowWizardAutoOpen && policy.action === "open_wizard" && policy.wizardMode) {
        openWizard(policy.wizardMode);
      }
    } catch {
      setError("SMILE scheduling is temporarily unavailable. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  const currentMessages = activeConversation?.messages ?? [];

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-smile-primary text-white shadow-xl transition hover:bg-smile-primary-dark"
          aria-label="Open SMILE scheduling assistant"
        >
          <Icon icon="lucide:message-circle" className="h-6 w-6" />
        </button>
      ) : (
        <section
          className="fixed bottom-5 right-5 z-50 flex min-h-[520px] min-w-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          style={{ width: size.width, height: size.height, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 32px)" }}
        >
          <button
            type="button"
            onPointerDown={beginResize}
            className="absolute left-1 top-1 z-10 flex h-4 w-4 cursor-nwse-resize items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-400 hover:text-smile-primary"
            aria-label="Resize chat"
            title="Drag to resize"
          >
            <Icon icon="lucide:grip" className="h-2.5 w-2.5 rotate-45" />
          </button>
          {historyOpen ? (
          <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-3 md:block">
            <button
              type="button"
              onClick={addConversation}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-smile-primary px-3 py-2 text-sm font-semibold text-white"
            >
              <Icon icon="lucide:plus" className="h-4 w-4" />
              New chat
            </button>
            <div className="space-y-2 overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setActiveId(conversation.id);
                    setPendingConfirmation(null);
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left text-xs ${conversation.id === activeId ? "bg-white text-smile-primary shadow-sm" : "text-slate-600 hover:bg-white"}`}
                >
                  <span className="block truncate font-semibold">{conversation.title}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {new Date(conversation.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </button>
              ))}
            </div>
          </aside>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">SMILE scheduling assistant</p>
                <p className="text-xs text-slate-500">
                  {patientId ? "Using your signed-in account" : "Sign in to send appointment requests"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-smile-primary hover:text-smile-primary"
                >
                  <Icon icon={historyOpen ? "lucide:panel-left-close" : "lucide:panel-left-open"} className="h-4 w-4" />
                  {historyOpen ? "Hide history" : "Show history"}
                </button>
                <button
                  type="button"
                  onClick={() => openWizard()}
                  disabled={!patientId || isSending}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-smile-primary hover:text-smile-primary disabled:opacity-50"
                >
                  <Icon icon="lucide:clipboard-list" className="h-4 w-4" />
                  Start flow
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close chat"
                >
                  <Icon icon="lucide:x" className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
              {currentMessages.map((message) => (
                <article key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-smile-primary text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                    <MessageText text={message.text} />
                    {message.role === "assistant" ? (
                      <AssistantDataCard
                        message={message}
                        onSelectSlot={(slot, flow, appointmentCode) => void selectSlot(slot, flow, appointmentCode)}
                        onCancelAppointment={(appointment) => void cancelAppointment(appointment)}
                        onRescheduleAppointment={(appointment) => void rescheduleAppointment(appointment)}
                        isSending={isSending}
                      />
                    ) : null}
                  </div>
                </article>
              ))}
              {isSending ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                  Checking SMILE schedule...
                </div>
              ) : null}
            </div>

            {pendingConfirmation ? (
              <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-950">{pendingConfirmation.summary}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => void confirmChange(true)} className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white">
                    Confirm
                  </button>
                  <button type="button" onClick={() => void confirmChange(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

            <form onSubmit={submitInput} className="flex gap-2 border-t border-slate-200 p-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!patientId || isSending || wizardOpen}
                placeholder={
                  wizardOpen
                    ? "Finish the appointment flow first..."
                    : patientId ? "Type a scheduling request..." : "Sign in to use the assistant"
                }
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-smile-primary"
              />
              <button type="submit" disabled={!canSend} className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Send
              </button>
            </form>
          </div>
        </section>
      )}

      {wizardOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">SMILE appointment flow</p>
                <p className="text-xs text-slate-500">Step-by-step scheduling details</p>
              </div>
              <button type="button" onClick={() => setWizardOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <Icon icon="lucide:x" className="h-4 w-4" />
              </button>
            </header>

            <div className="px-5 py-5">
              {wizardStep === "intent" ? (
                <div className="grid gap-2">
                  {ACTIONS.map((action) => (
                    <button
                      key={action.mode}
                      type="button"
                      onClick={() => {
                        setWizard({ ...emptyWizard, mode: action.mode });
                        setWizardStep(nextStepForMode(action.mode));
                      }}
                      className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3 text-left hover:border-smile-primary hover:text-smile-primary"
                    >
                      <Icon icon={action.icon} className="h-5 w-5" />
                      <span className="font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {wizardStep === "appointment" ? (
                <label className="block text-sm font-medium text-slate-700">
                  Appointment code
                  <input
                    value={wizard.appointmentCode}
                    onChange={(event) => setWizard({ ...wizard, appointmentCode: event.target.value })}
                    placeholder="APT-001"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-smile-primary"
                  />
                </label>
              ) : null}

              {wizardStep === "service" ? (
                <label className="block text-sm font-medium text-slate-700">
                  Describe the dental service or symptom
                  <input
                    value={wizard.service}
                    onChange={(event) => setWizard({ ...wizard, service: event.target.value })}
                    placeholder="Oral check, gum pain, braces consultation..."
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-smile-primary"
                  />
                </label>
              ) : null}

              {wizardStep === "date" ? (
                <label className="block text-sm font-medium text-slate-700">
                  Preferred date
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={wizard.date}
                    onChange={(event) => setWizard({ ...wizard, date: event.target.value })}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-smile-primary"
                  />
                  <span className="mt-2 block text-xs font-normal text-slate-500">Actual available times and doctors are loaded from the SMILE schedule after submission.</span>
                </label>
              ) : null}

              {wizardStep === "summary" ? (
                <div>
                  <p className="text-sm font-semibold text-slate-950">Review before submitting</p>
                  <ul className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {summaryItems(wizard).map(([label, value]) => (
                      <li key={label} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-smile-primary" />
                        <span><strong>{label}:</strong> {value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setWizardOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Close
              </button>
              {wizardStep === "summary" ? (
                <button type="button" onClick={() => void submitWizard()} className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white">
                  Submit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={advanceWizard}
                  disabled={
                    (wizardStep === "appointment" && !wizard.appointmentCode.trim()) ||
                    (wizardStep === "service" && !wizard.service) ||
                    (wizardStep === "date" && !wizard.date) ||
                    (wizardStep === "date" && !wizard.date)
                  }
                  className="rounded-md bg-smile-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Next
                </button>
              )}
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
