"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  lot: string;
  email: string;
  role: string;
}

export function CommunitySearch({ canManageRoles = false }: { canManageRoles?: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleUpdateMessage, setRoleUpdateMessage] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch all users on mount
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/profiles");
        const result = await response.json();
        if (!response.ok || result.error) {
          console.error("Error fetching users:", result.error || "Unknown error");
        } else {
          setAllUsers(result.profiles || []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setResults([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allUsers.filter((user) => {
      const nameMatch = user.name?.toLowerCase().includes(query) || false;
      const lotMatch = user.lot?.toLowerCase().includes(query) || false;
      const emailMatch = user.email?.toLowerCase().includes(query) || false;
      const roleMatch = user.role?.toLowerCase().includes(query) || false;
      return nameMatch || lotMatch || emailMatch || roleMatch;
    });

    setResults(filtered);
    setShowResults(true);
  }, [searchQuery, allUsers]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showResults]);

  const handleResultClick = (user: UserProfile) => {
    setSearchQuery(user.name || user.email || "");
    setSelectedUser(user);
    setShowDeleteConfirm(false);
    setRoleUpdateMessage("");
    setShowResults(false);
  };

  const closeRoleModal = () => {
    setSelectedUser(null);
    setShowDeleteConfirm(false);
    setRoleUpdateMessage("");
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || isDeletingUser) return;
    setIsDeletingUser(true);
    setRoleUpdateMessage("");

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedUser.id,
          userId: selectedUser.user_id,
        }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        setRoleUpdateMessage(result.error || "No se pudo eliminar el usuario.");
        return;
      }

      const updatedUsers = allUsers.filter((user) => user.id !== selectedUser.id);
      setAllUsers(updatedUsers);
      setResults((prev) => prev.filter((user) => user.id !== selectedUser.id));
      closeRoleModal();
      setSearchQuery("");
    } catch {
      setRoleUpdateMessage("No se pudo eliminar el usuario.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUser || isUpdatingRole) return;
    setIsUpdatingRole(true);
    setRoleUpdateMessage("");

    try {
      const response = await fetch("/api/admin/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: selectedUser.id, role: newRole }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        setRoleUpdateMessage("No se pudo actualizar el rol.");
        return;
      }

      const updatedUsers = allUsers.map((user) =>
        user.id === selectedUser.id ? { ...user, role: newRole } : user
      );
      setAllUsers(updatedUsers);
      setSelectedUser({ ...selectedUser, role: newRole });
      setRoleUpdateMessage(`Rol actualizado a ${newRole}.`);
    } catch {
      setRoleUpdateMessage("No se pudo actualizar el rol.");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="relative mb-3" ref={searchRef}>
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="search"
        name="community-search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) {
            setShowResults(true);
          }
        }}
        placeholder="Buscar usuario por nombre, lote, email o rol…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        className="w-full bg-gray-100 rounded-[14px] pl-8 pr-3 py-1.5 text-xs text-[#1a1a1a] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2d5016]/50"
      />

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-[14px] shadow-lg max-h-48 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleResultClick(user)}
              className="w-full text-left px-2 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#1a1a1a]">
                    {user.name || "Sin nombre"}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Lote: {user.lot || "N/A"} {user.email ? `• ${user.email}` : ""}
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-[#1a1a1a]">
                  {user.role || "N/A"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && searchQuery.trim() !== "" && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-[14px] shadow-lg p-2">
          <p className="text-xs text-gray-600 text-center">
            No se encontraron usuarios
          </p>
        </div>
      )}

      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[90]" onClick={closeRoleModal} />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[14px] border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-[#1a1a1a]">
                  {canManageRoles ? "Gestionar usuario" : "Información de usuario"}
                </h3>
                <button
                  onClick={closeRoleModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                <p className="text-sm text-[#1a1a1a] font-medium">
                  {selectedUser.name || "Sin nombre"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedUser.email || "Sin email"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Lote: {selectedUser.lot || "N/A"} • Rol actual: {selectedUser.role || "N/A"}
                </p>

                {canManageRoles && (
                  <>
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Cambiar rol</label>
                      <select
                        data-demo-mutation
                        onChange={(e) => {
                          if (e.target.value) handleRoleChange(e.target.value);
                          e.target.value = "";
                        }}
                        disabled={isUpdatingRole || isDeletingUser}
                        className="w-full bg-gray-100 rounded-[14px] px-3 py-2 text-xs text-[#1a1a1a] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2d5016]/50 disabled:opacity-50"
                        defaultValue=""
                      >
                        <option value="" disabled>Seleccionar nuevo rol...</option>
                        <option value="cuentas">Cuentas</option>
                        <option value="coordinacion">Coordinación</option>
                        <option value="administracion">Administración</option>
                        <option value="seguridad">Seguridad</option>
                        <option value="vecino">Vecino</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isUpdatingRole || isDeletingUser}
                      className="mt-3 w-full px-3 py-2 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar usuario
                    </button>
                  </>
                )}

                {roleUpdateMessage && (
                  <p className="text-xs text-gray-600 mt-3">{roleUpdateMessage}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {selectedUser && showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[110]" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-[14px] border border-gray-200 shadow-lg p-4">
              <h4 className="text-sm font-semibold text-[#1a1a1a]">Confirmar eliminación</h4>
              <p className="text-xs text-gray-600 mt-2">
                ¿Seguro que querés eliminar a {selectedUser.name || "este usuario"}?
                Esta acción elimina su perfil y su acceso.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingUser}
                  className="flex-1 px-3 py-2 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeletingUser}
                  className="flex-1 px-3 py-2 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingUser ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
