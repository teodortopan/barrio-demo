"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell, Eye, CheckCheck, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsButtonProps {
  initialNotifications?: Notification[];
  variant?: "topbar" | "sidebar";
}

const NOTIFICATIONS_OPEN_EVENT = "sj:open-notifications";
const NOTIFICATIONS_CLOSE_EVENT = "sj:close-notifications";

export function openNotificationsPanel() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_OPEN_EVENT));
}

export function closeNotificationsPanel() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CLOSE_EVENT));
}

export function NotificationsButton({ initialNotifications, variant = "topbar" }: NotificationsButtonProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications ?? []);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(initialNotifications === undefined);
  const [pushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const topbarButtonRef = useRef<HTMLButtonElement | null>(null);
  const sidebarButtonRef = useRef<HTMLButtonElement | null>(null);
  const [sidebarPanelTop, setSidebarPanelTop] = useState<number | null>(null);
  const [topbarPanelPosition, setTopbarPanelPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialNotifications === undefined) {
      fetchNotifications();
    }
  }, [initialNotifications]);

  const handleTogglePush = useCallback(async () => {
    if (pushLoading) return;
    setPushLoading(true);
    try {
      await fetch("/api/push-subscription", { method: "POST" });
    } finally {
      setPushLoading(false);
    }
  }, [pushLoading]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching notifications:", result.error);
      } else {
        setNotifications(result.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        console.error("Error marking notification as read");
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        console.error("Error deleting notification");
        return;
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error("Error marking all notifications as read");
        return;
      }

      // Update local state - mark all as read
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await fetch("/api/notifications/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error("Error deleting all notifications");
        return;
      }

      setNotifications([]);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;

    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getNotificationCategory = (type: string): { label: string; color: string } => {
    switch (type) {
      case "new_novedad":
        return { label: "Novedad", color: "bg-blue-100 text-blue-700" };
      case "new_recordatorio":
        return { label: "Recordatorio", color: "bg-yellow-100 text-yellow-700" };
      case "price_change":
        return { label: "Actualización", color: "bg-purple-100 text-purple-700" };
      case "new_invoice":
        return { label: "Factura", color: "bg-green-100 text-green-700" };
      case "reclamo_status_change":
        return { label: "Consulta/Reclamo", color: "bg-orange-100 text-orange-700" };
      case "visita_status_change":
        return { label: "Visita", color: "bg-teal-100 text-teal-700" };
      case "new_visit_request":
        return { label: "Visita", color: "bg-teal-100 text-teal-700" };
      case "new_calendar_event":
        return { label: "Evento", color: "bg-indigo-100 text-indigo-700" };
      case "payment_request":
        return { label: "Pago", color: "bg-amber-100 text-amber-700" };
      case "payment_approved":
        return { label: "Pago aprobado", color: "bg-green-100 text-green-700" };
      case "payment_rejected":
        return { label: "Pago rechazado", color: "bg-red-100 text-red-700" };
      case "new_signup_request":
        return { label: "Solicitud", color: "bg-rose-100 text-rose-700" };
      case "new_complaint":
        return { label: "Consulta/Reclamo", color: "bg-orange-100 text-orange-700" };
      default:
        return { label: "Notificación", color: "bg-gray-100 text-gray-700" };
    }
  };

  const getNotificationRoute = (type: string): string | null => {
    // Map notification types to their corresponding routes
    switch (type) {
      case "new_recordatorio":
      case "new_novedad":
      case "price_change":
      case "new_invoice":
      case "reclamo_status_change":
      case "visita_status_change":
        return "/dashboard";
      case "new_visit_request":
        return "/seguridad";
      case "new_calendar_event":
        return "/informacion";
      case "new_signup_request":
      case "new_complaint":
        return "/admin";
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    const route = getNotificationRoute(notification.type);
    if (route) {
      setIsOpen(false); // Close the notifications panel
      router.push(route);
    }
  };

  const isSidebar = variant === "sidebar";

  const updateSidebarPanelPosition = useCallback(() => {
    if (!isSidebar || typeof window === "undefined") return;
    const rect = sidebarButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelHeight = Math.min(600, window.innerHeight - 32);
    const top = Math.min(
      Math.max(16, rect.top),
      Math.max(16, window.innerHeight - panelHeight - 16)
    );
    setSidebarPanelTop(top);
  }, [isSidebar]);

  const updateTopbarPanelPosition = useCallback(() => {
    if (isSidebar || typeof window === "undefined") return;
    const rect = topbarButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTopbarPanelPosition({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, [isSidebar]);

  useEffect(() => {
    if (!isOpen) return;
    const update = isSidebar ? updateSidebarPanelPosition : updateTopbarPanelPosition;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, isSidebar, updateSidebarPanelPosition, updateTopbarPanelPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // Allow the tutorial (or any caller) to open/close the topbar panel.
  useEffect(() => {
    if (variant !== "topbar") return;
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    window.addEventListener(NOTIFICATIONS_OPEN_EVENT, onOpen);
    window.addEventListener(NOTIFICATIONS_CLOSE_EVENT, onClose);
    return () => {
      window.removeEventListener(NOTIFICATIONS_OPEN_EVENT, onOpen);
      window.removeEventListener(NOTIFICATIONS_CLOSE_EVENT, onClose);
    };
  }, [variant]);

  return (
    <div
      data-tour-id={isSidebar ? undefined : "notificaciones-bell"}
      className={isSidebar ? "relative" : "relative flex items-center"}
    >
      {isSidebar ? (
        <button
          ref={sidebarButtonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateSidebarPanelPosition();
            setIsOpen((prev) => !prev);
          }}
          className={"sj-nav-item" + (isOpen ? " active" : "")}
          style={{ touchAction: "manipulation" }}
          aria-label="Notificaciones"
          aria-expanded={isOpen}
        >
          <Bell className="sj-nav-icon" strokeWidth={1.5} />
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <span className="sj-nav-count" style={{ background: "#dc2626", color: "white" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          ref={topbarButtonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            updateTopbarPanelPosition();
            setIsOpen((prev) => !prev);
          }}
          className="sj-icon-btn relative !w-11 !h-11 sm:!w-[34px] sm:!h-[34px] flex items-center justify-center select-none p-0"
          style={{ touchAction: "manipulation" }}
          aria-label="Notificaciones"
          aria-expanded={isOpen}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 sm:-top-1 sm:-right-1 bg-red-600 text-white text-[9px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center pointer-events-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop - blocks interaction and closes on tap */}
          <div
            className="fixed inset-0 z-[900] bg-black/20 sm:bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Notifications Panel — full-screen on mobile, anchored on desktop. Sidebar variant pops to the right of the rail. */}
          <div
            data-tour-id={isSidebar ? undefined : "notificaciones-panel"}
            className={
            isSidebar
              ? "fixed left-0 right-0 top-[52px] bottom-0 w-full max-h-[none] bg-white rounded-none border-0 border-t border-[#E9E2CE] shadow-lg z-[1000] overflow-hidden flex flex-col sm:left-[268px] sm:right-auto sm:top-[var(--notifications-panel-top)] sm:bottom-auto sm:w-96 sm:max-h-[600px] sm:rounded-[14px] sm:border sm:border-[#E9E2CE]"
              : "fixed left-0 right-0 top-[52px] bottom-0 w-full max-h-[none] bg-white rounded-none border-0 border-t border-[#E9E2CE] shadow-lg z-[1000] overflow-hidden flex flex-col sm:left-auto sm:right-[var(--notifications-panel-right)] sm:top-[var(--notifications-panel-top)] sm:bottom-auto sm:w-96 sm:max-h-[600px] sm:rounded-[14px] sm:border sm:border-[#E9E2CE]"
          }
          style={
            isSidebar && sidebarPanelTop !== null
              ? ({ "--notifications-panel-top": `${sidebarPanelTop}px` } as React.CSSProperties)
              : !isSidebar && topbarPanelPosition !== null
              ? ({
                  "--notifications-panel-top": `${topbarPanelPosition.top}px`,
                  "--notifications-panel-right": `${topbarPanelPosition.right}px`,
                } as React.CSSProperties)
              : undefined
          }>
            {/* Header */}
            <div className="bg-[#FBF8EF] border-b border-dashed border-[#E9E2CE] shrink-0">
              <div className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-[14px] bg-[#2d5016]/10">
                    <Bell className="w-3.5 h-3.5 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#1a1a1a] shrink-0">
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold">
                      {unreadCount} {unreadCount === 1 ? "nueva" : "nuevas"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="sm:hidden shrink-0 px-2 py-1 rounded-[14px] text-[10px] font-semibold text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors"
                  >
                    Cerrar
                  </button>
                  {unreadCount > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllAsRead();
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-[14px] bg-white border border-[#E9E2CE] text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors text-[10px] font-semibold"
                      title="Marcar todas como leídas"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Marcar todas</span>
                    </button>
                  ) : notifications.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAll();
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-[14px] bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-[10px] font-semibold"
                      title="Eliminar todas las notificaciones"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Eliminar todas</span>
                    </button>
                  ) : null}
                </div>
              </div>
              {/* Push toggle — mobile only, under header text */}
              <div className="sm:hidden px-3 pb-2.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[14px] bg-white border border-[#E9E2CE]">
                  <span className="text-[10px] font-medium text-[#3c3c3c]">Notificaciones push</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pushEnabled}
                    disabled={pushLoading}
                    onClick={handleTogglePush}
                    className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      pushEnabled ? "bg-[#2d5016]" : "bg-gray-300"
                    } ${pushLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                        pushEnabled ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 bg-white">
              {loading ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  Cargando…
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10 mb-2">
                    <Bell className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                  <p className="text-xs text-gray-500">No hay notificaciones</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {notifications.map((notification) => {
                    const hasRoute = getNotificationRoute(notification.type) !== null;
                    const category = getNotificationCategory(notification.type);
                    const isUnread = !notification.is_read;
                    return (
                      <div
                        key={notification.id}
                        onClick={() => hasRoute && handleNotificationClick(notification)}
                        className={`relative rounded-[14px] border overflow-hidden transition-colors ${
                          isUnread
                            ? "bg-[#FBF8EF] border-[#E9E2CE]"
                            : "bg-white border-[#E9E2CE]/70"
                        } ${
                          hasRoute ? "hover:border-[#2d5016]/30 cursor-pointer" : ""
                        }`}
                      >
                        <div className="flex">
                          <div className="flex-1 min-w-0 p-2.5">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className={`inline-block px-1.5 py-0.5 rounded-[14px] text-[10px] font-semibold ${category.color}`}>
                                {category.label}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {isUnread && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-[14px] text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors"
                                    title="Marcar como leída"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification.id);
                                  }}
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-[14px] text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="Eliminar notificación"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className={`text-xs ${
                              isUnread ? "font-semibold text-[#1a1a1a]" : "font-medium text-[#3c3c3c]"
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-[11px] text-[#3c3c3c] mt-0.5 leading-snug">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </>
        , document.body
      )}
    </div>
  );
}
