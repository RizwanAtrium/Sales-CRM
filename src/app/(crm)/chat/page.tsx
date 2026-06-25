"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Download, Eye, FileText, ImageIcon, Mic, MoreVertical, Paperclip, Pause, Phone, Pin, Play, Plus, Search, Send, Share2, Smile, Users, Video, X } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Thread = { _id: string; name: string; type: "GROUP" | "PRIVATE" | string; latest?: { body?: string } | null; unreadCount?: number };
type User = { _id?: string; id?: string; sub?: string; name: string; role?: string; active?: boolean };
type Message = { _id: string; body: string; cardType: string; metadata?: Record<string, string>; sender?: { name?: string }; createdAt?: string };

const initialThreads: Thread[] = [];
const initialUsers: User[] = [];
const initialMessages: Message[] = [];

const mediaItems = [
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=300&q=80",
];

const emojis = [
  [0x1f600, 0x1f64f],
  [0x1f300, 0x1f5ff],
  [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff],
  [0x2600, 0x27bf],
].flatMap(([start, end]) => Array.from({ length: end - start + 1 }, (_, index) => String.fromCodePoint(start + index)));

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function avatarTone(index: number) {
  return ["bg-primary/15 text-primary", "bg-rose-500/15 text-rose-500", "bg-emerald-500/15 text-emerald-600", "bg-amber-500/15 text-amber-600", "bg-sky-500/15 text-sky-600"][index % 5];
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [active, setActive] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [filter, setFilter] = useState<"All" | "Private" | "Groups">("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<"Media" | "Link" | "Docs">("Media");
  const [playing, setPlaying] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch("/api/chat/threads", { cache: "no-store" }).then((r) => r.json()).then((data) => {
      const items = data.items?.length ? data.items : [];
      setThreads(items);
      setActive(items[0]?._id || "");
    }).catch(() => setThreads(initialThreads));
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then((data) => setCurrentUser(data.user ?? null)).catch(() => setCurrentUser(null));
    fetch("/api/users", { cache: "no-store" }).then((r) => r.json()).then((data) => setUsers(data.items?.length ? data.items : [])).catch(() => setUsers(initialUsers));
  }, []);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/chat/messages?threadId=${active}`, { cache: "no-store" }).then((r) => r.json()).then((data) => {
      setMessages(data.items ?? []);
    }).catch(() => setMessages(initialMessages));
  }, [active]);

  const activeThread = useMemo(() => threads.find((thread) => thread._id === active) ?? threads[0] ?? { _id: "", name: "Chat", type: "GROUP", latest: null }, [threads, active]);
  const typingUser = activeThread.latest?.body?.toLowerCase().includes("typing") ? activeThread.latest.body.split(" is typing")[0] : "";
  const visibleThreads = useMemo(() => threads.filter((thread) => {
    const text = `${thread.name} ${thread.latest?.body || ""}`.toLowerCase();
    return (filter === "All" || (filter === "Groups" ? thread.type === "GROUP" : thread.type === "PRIVATE")) && text.includes(query.toLowerCase());
  }), [filter, query, threads]);

  async function openPrivate(user: User) {
    const response = await fetch("/api/chat/threads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user._id || user.id || "", name: user.name }) });
    const data = await response.json();
    if (!response.ok || !data.item) return;
    const thread: Thread = data.item;
    setThreads((current) => [thread, ...current.filter((item) => item._id !== thread._id)]);
    setActive(thread._id);
    setNewOpen(false);
  }

  function openThread(id: string) {
    setActive(id);
    setThreads((current) => current.map((thread) => thread._id === id ? { ...thread, unreadCount: 0 } : thread));
  }

  function addLocalMessage(cardType: string, body: string, metadata?: Record<string, string>) {
    setMessages((current) => [...current, { _id: `local-${Date.now()}`, body, cardType, metadata, sender: { name: "You" }, createdAt: "Now" }]);
    setToolsOpen(false);
  }

  function addFile(file: File, forcedType?: "IMAGE" | "DOC") {
    const url = URL.createObjectURL(file);
    const isImage = forcedType === "IMAGE" || file.type.startsWith("image/");
    addLocalMessage(isImage ? "IMAGE" : "DOC", file.name, { url, fileName: file.name, mimeType: file.type || "file" });
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        addLocalMessage("VOICE", "Voice note", { url: URL.createObjectURL(blob), fileName: `voice-${Date.now()}.webm` });
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setNotice("Recording voice");
    } catch {
      setNotice("Mic permission needed");
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLFormElement>) {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    addFile(file, "IMAGE");
    setNotice("Pasted screenshot attached");
  }

  function viewMessage(message: Message) {
    if (message.metadata?.url) window.open(message.metadata.url, "_blank", "noopener,noreferrer");
    else setNotice("Preview opened");
  }

  function downloadMessage(message: Message) {
    if (!message.metadata?.url) {
      setNotice("Download ready");
      return;
    }
    const link = document.createElement("a");
    link.href = message.metadata.url;
    link.download = message.metadata.fileName || "chat-file";
    link.click();
  }

  function downloadUrl(url: string, fileName = "chat-media.jpg") {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  }

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    addLocalMessage("NONE", body);
    setDraft("");
    await fetch("/api/chat/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: active, body }) }).catch(() => null);
  }

  function canOpenLeadDetails(message: Message) {
    if (!currentUser || !message.metadata?.leadId) return false;
    const userId = currentUser._id || currentUser.sub || currentUser.id;
    const role = currentUser.role?.toUpperCase();
    if (role === "SUPER_ADMIN" || role === "MANAGER" || role === "TEAM_LEAD" || role === "CLOSER") return true;
    return userId === message.metadata.assignedAgentId;
  }

  function openLeadDetails(message: Message) {
    if (!message.metadata?.leadId) return;
    window.open(`/leads/${message.metadata.leadId}`, "_blank", "noopener,noreferrer");
  }

  const activeUsers = users.filter((user) => user.active !== false);

  return (
    <AnimatedPage>
      <div className={`grid h-[calc(100vh-8.5rem)] min-h-[680px] gap-4 ${detailOpen || mediaOpen ? "lg:grid-cols-[260px_minmax(0,1fr)_280px] 2xl:grid-cols-[300px_minmax(0,1fr)_310px]" : "lg:grid-cols-[300px_minmax(0,1fr)]"}`}>
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card/95 shadow-sm">
          <div className="relative flex items-center gap-3 border-b p-4">
            <Avatar className="size-10"><AvatarFallback className="bg-primary/15 text-primary">AT</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Asad Team</p><p className="text-xs text-muted-foreground">Sales command</p></div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setNewOpen((value) => !value)}><Plus className="size-4" /></Button>
            {newOpen ? <div className="absolute right-3 top-14 z-20 w-56 rounded-xl border bg-card p-2 shadow-lg">{activeUsers.map((user) => <button key={user._id || user.id || user.name} type="button" onClick={() => openPrivate(user)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-muted"><Avatar className="size-7"><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar><span className="min-w-0 flex-1 truncate">{user.name}</span><span className="text-[10px] text-muted-foreground">{user.role}</span></button>)}</div> : null}
          </div>
          <div className="border-b p-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 bg-muted/60 pl-9" placeholder="Search chats..." /></div></div>
          <div className="grid grid-cols-3 gap-1 border-b p-3 text-xs">{(["All", "Private", "Groups"] as const).map((tab) => <button key={tab} type="button" onClick={() => setFilter(tab)} className={`rounded-lg px-3 py-2 ${filter === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{tab}</button>)}</div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground"><span>Pinned Message</span><Pin className="size-3" /></div>
            {visibleThreads.map((thread, index) => <button key={thread._id} type="button" onClick={() => openThread(thread._id)} className={`mb-1 grid w-full grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl p-2 text-left transition ${active === thread._id ? "bg-primary/10" : "hover:bg-muted/70"}`}><Avatar className="size-10"><AvatarFallback className={avatarTone(index)}>{thread.type === "GROUP" ? <Users className="size-4" /> : initials(thread.name)}</AvatarFallback></Avatar><span className="min-w-0"><span className="block truncate text-sm font-medium">{thread.name}</span><span className={`block truncate text-xs ${thread.latest?.body?.includes("typing") ? "text-emerald-500" : "text-muted-foreground"}`}>{thread.latest?.body || "No messages yet"}</span></span><span className="text-right text-[11px] text-muted-foreground">09:12 AM{thread.unreadCount ? <Badge className="mt-1 block h-5 min-w-5 rounded-full px-1">{thread.unreadCount}</Badge> : null}</span></button>)}
            {visibleThreads.length === 0 ? <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No chats found</div> : null}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card/95 shadow-sm">
          <header className="relative flex items-center gap-3 border-b px-5 py-3">
            <Avatar className="size-10"><AvatarFallback className="bg-rose-500/15 text-rose-500">{activeThread.type === "GROUP" ? <Users className="size-4" /> : initials(activeThread.name)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold">{activeThread.name}</h1>{typingUser ? <p className="text-xs text-emerald-500">{typingUser} is typing...</p> : null}</div>
            {notice ? <span className="hidden rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground md:inline">{notice}</span> : null}
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setNotice("Video call queued")}><Video className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setNotice("Voice call queued")}><Phone className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMoreOpen((value) => !value)}><MoreVertical className="size-4" /></Button>
            {moreOpen ? <div className="absolute right-4 top-14 z-20 grid w-44 gap-1 rounded-xl border bg-card p-2 text-sm shadow-lg"><button type="button" onClick={() => { setDetailOpen(true); setMoreOpen(false); }} className="rounded-lg p-2 text-left hover:bg-muted">Open detail</button><button type="button" onClick={() => { setMediaOpen(true); setMoreOpen(false); }} className="rounded-lg p-2 text-left hover:bg-muted">Open media</button></div> : null}
          </header>
          <div className="surface-grid scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto bg-muted/20 p-5">
            <div className="text-center text-xs text-muted-foreground">Today</div>
            {messages.map((message, index) => {
              const mine = message.sender?.name === "You";
              const media = message.cardType === "IMAGE" || message.cardType === "DOC";
              const isLeadCard = message.cardType === "LEAD_ADDED";
              const isAppointmentCard = message.cardType === "APPOINTMENT_SUBMITTED" || message.cardType === "APPOINTMENT_STATUS";
              return <div key={message._id} className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>{!mine ? <Avatar className="mt-1 size-8"><AvatarFallback className={avatarTone(index)}>{initials(message.sender?.name || "System")}</AvatarFallback></Avatar> : null}<div className="max-w-[72%]"><div className={`mb-1 flex items-center gap-2 text-[11px] text-muted-foreground ${mine ? "justify-end" : ""}`}><span>{message.sender?.name || "System"}</span><span>{message.createdAt || "08:34 AM"}</span></div>{message.cardType === "VOICE" ? <div className="flex items-center gap-3 rounded-xl border bg-background p-3 shadow-sm"><Button type="button" size="icon-sm" onClick={() => setPlaying(playing === message._id ? null : message._id)}>{playing === message._id ? <Pause className="size-4" /> : <Play className="size-4" />}</Button><div className="h-6 w-48 rounded-full bg-[repeating-linear-gradient(90deg,var(--primary)_0_3px,transparent_3px_8px)] opacity-80" />{message.metadata?.url ? <audio src={message.metadata.url} autoPlay={playing === message._id} onEnded={() => setPlaying(null)} className="hidden" /> : null}</div> : media ? <div className="overflow-hidden rounded-xl border bg-background shadow-sm">{message.cardType === "IMAGE" ? <img src={message.metadata?.url || mediaItems[0]} alt={message.metadata?.fileName || "Shared image"} className="h-40 w-64 object-cover" /> : <div className="flex w-64 items-center gap-3 p-4"><FileText className="size-10 text-primary" /><span className="truncate text-sm font-medium">{message.metadata?.fileName || "document.pdf"}</span></div>}<div className="grid grid-cols-3 gap-1 border-t p-2 text-xs"><button type="button" onClick={() => viewMessage(message)} className="rounded-md p-2 hover:bg-muted"><Eye className="mx-auto size-4" />View</button><button type="button" onClick={() => downloadMessage(message)} className="rounded-md p-2 hover:bg-muted"><Download className="mx-auto size-4" />Download</button><button type="button" onClick={() => setShareFor(shareFor === message._id ? null : message._id)} className="rounded-md p-2 hover:bg-muted"><Share2 className="mx-auto size-4" />Share</button></div>{shareFor === message._id ? <div className="border-t p-2">{activeUsers.map((user) => <button key={user._id || user.name} type="button" onClick={() => { openPrivate(user); setNotice(`Shared with ${user.name}`); setShareFor(null); }} className="block w-full rounded-md p-2 text-left text-xs hover:bg-muted">{user.name}</button>)}</div> : null}</div> : isAppointmentCard ? <div className="rounded-2xl border border-primary/20 bg-background p-4 shadow-sm"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-primary">{message.cardType === "APPOINTMENT_SUBMITTED" ? "Appointment submitted" : "Appointment status"}</span><Badge variant="secondary">{message.metadata?.stage || "Submitted"}</Badge></div><div className="space-y-2 text-sm"><div><span className="block text-xs text-muted-foreground">Business</span><span className="font-medium">{message.metadata?.businessName || message.body}</span></div><div><span className="block text-xs text-muted-foreground">Contact</span><span className="font-medium">{message.metadata?.customerName || "Customer"}</span></div></div>{message.metadata?.opportunityId ? <Button type="button" size="sm" className="mt-4" onClick={() => window.open(`/pipeline/${message.metadata?.opportunityId}`, "_blank", "noopener,noreferrer")}>Open appointment</Button> : null}</div> : isLeadCard ? <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-sm"><div className="mb-3 text-sm font-semibold text-primary">New lead added</div><div className="space-y-2 text-sm"><div><span className="block text-xs text-muted-foreground">Client</span><span className="font-medium">{message.metadata?.customerName}</span></div><div><span className="block text-xs text-muted-foreground">Service</span><span className="font-medium">{message.metadata?.service}</span></div><div><span className="block text-xs text-muted-foreground">Value</span><span className="font-medium">{message.metadata?.value}</span></div><div><span className="block text-xs text-muted-foreground">Status</span><span className="font-medium">{message.metadata?.status}</span></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"><Button type="button" size="sm" onClick={() => openLeadDetails(message)} disabled={!canOpenLeadDetails(message)}>View details</Button>{!canOpenLeadDetails(message) ? <span className="text-xs text-muted-foreground">Only assigned agent, Team Lead, Manager, or Super Admin can open details.</span> : null}</div></div> : <div className={`rounded-xl px-4 py-3 text-sm leading-6 shadow-sm ${mine ? "bg-primary text-primary-foreground" : "border bg-background"}`}>{message.body}</div>}</div>{mine ? <MoreVertical className="mt-7 size-4 text-muted-foreground" /> : null}</div>;
            })}
          </div>
          <form onSubmit={send} onPaste={handlePaste} className="relative flex items-center gap-2 border-t bg-card p-4">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEmojiOpen((value) => !value)}><Smile className="size-4" /></Button>
            {emojiOpen ? <div className="absolute bottom-20 left-4 z-10 max-h-72 w-80 overflow-y-auto rounded-xl border bg-card p-3 shadow-lg"><div className="grid grid-cols-8 gap-1">{emojis.map((emoji, index) => <button key={`${emoji}-${index}`} type="button" onClick={() => setDraft((value) => `${value}${emoji}`)} className="rounded-md p-1 text-lg hover:bg-muted">{emoji}</button>)}</div></div> : null}
            <Input name="body" value={draft} onChange={(event) => setDraft(event.target.value)} className="h-11 rounded-full bg-muted/60 px-4" placeholder="Write a message..." />
            <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => setToolsOpen((value) => !value)}><Plus className="size-4" /></Button>
            <Button type="submit" size="icon" className="rounded-full"><Send className="size-4" /></Button>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) addFile(file, "IMAGE"); event.currentTarget.value = ""; }} />
            <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) addFile(file, "DOC"); event.currentTarget.value = ""; }} />
            {toolsOpen ? <div className="absolute bottom-20 right-8 z-10 grid w-56 gap-2 rounded-xl border bg-card p-3 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2"><button type="button" onClick={toggleRecording} className="flex items-center gap-2 rounded-lg p-2 text-left hover:bg-muted">{recording ? <Pause className="size-4" /> : <Mic className="size-4" />} {recording ? "Stop voice" : "Voice"}</button><button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg p-2 text-left hover:bg-muted"><Paperclip className="size-4" /> File</button><button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 rounded-lg p-2 text-left hover:bg-muted"><ImageIcon className="size-4" /> Image</button></div> : null}
          </form>
        </section>

        {detailOpen || mediaOpen ? <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto lg:flex">
          {detailOpen ? <div className="rounded-xl border bg-card/95 p-4 shadow-sm"><div className="mb-5 flex items-center justify-between"><p className="text-sm font-semibold">Detail group</p><Button type="button" variant="ghost" size="icon-sm" onClick={() => setDetailOpen(false)}><X className="size-4" /></Button></div><div className="flex flex-col items-center text-center"><Avatar className="size-16"><AvatarFallback className="bg-rose-500/15 text-rose-500"><Users /></AvatarFallback></Avatar><h2 className="mt-3 font-semibold">{activeThread.name}</h2><Badge variant="outline" className="mt-2">{activeThread.type}</Badge></div><div className="mt-5 space-y-4 text-xs"><div><p className="font-medium">Description</p><p className="mt-1 leading-5 text-muted-foreground">CRM chat keeps appointments, status, and team discussion synced.</p></div><button type="button" onClick={() => setMembersOpen(true)} className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-muted"><span className="font-medium">Members</span><Badge>{activeUsers.length}</Badge></button></div></div> : null}
          {mediaOpen ? <div className="rounded-xl border bg-card/95 p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">Media</p><Button type="button" variant="ghost" size="icon-sm" onClick={() => setMediaOpen(false)}><X className="size-4" /></Button></div><div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-xs">{(["Media", "Link", "Docs"] as const).map((tab) => <button key={tab} type="button" onClick={() => setMediaTab(tab)} className={`rounded-md py-2 ${mediaTab === tab ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>{tab}</button>)}</div>{mediaTab === "Media" ? <div className="mt-4 grid grid-cols-3 gap-2">{mediaItems.map((src, index) => <div key={src} className="group relative overflow-hidden rounded-lg border"><img src={src} alt="Chat media" className="aspect-square object-cover" /><div className="absolute inset-0 hidden place-items-center gap-1 bg-background/80 p-1 group-hover:grid"><button type="button" onClick={() => window.open(src, "_blank", "noopener,noreferrer")} className="w-full rounded-md bg-primary px-2 py-1 text-[10px] text-primary-foreground">View</button><button type="button" onClick={() => downloadUrl(src, `chat-media-${index + 1}.jpg`)} className="w-full rounded-md bg-muted px-2 py-1 text-[10px]">Download</button></div></div>)}</div> : <div className="mt-4 space-y-2 text-xs">{(mediaTab === "Link" ? ["crm/chat/appointment-submitted", "crm/pipeline/new"] : ["lead-brief.pdf", "appointment-notes.docx"]).map((item) => <div key={item} className="rounded-lg border p-3 text-muted-foreground">{item}</div>)}</div>}</div> : null}
        </aside> : null}
      </div>
      {membersOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-xl border bg-card p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><p className="font-semibold">Members</p><Button type="button" variant="ghost" size="icon-sm" onClick={() => setMembersOpen(false)}><X className="size-4" /></Button></div>{activeUsers.map((user) => <button key={user._id || user.name} type="button" onClick={() => openPrivate(user)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"><Avatar className="size-8"><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar><span className="flex-1 text-sm">{user.name}</span><span className="text-xs text-muted-foreground">{user.role}</span></button>)}</div></div> : null}
    </AnimatedPage>
  );
}
