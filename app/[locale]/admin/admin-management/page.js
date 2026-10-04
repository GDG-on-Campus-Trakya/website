"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ROLES } from "@/utils/roleUtils";
import { logger } from "@/utils/logger";
import AdminProtection from "@/components/AdminProtection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, fieldClasses } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Section } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import { adminCopy } from "@/utils/adminCopy";


const COPY = {
  tr: {
    pageTitle: "Yönetici yetkilendirme",
    pageSubtitle: "Admin ve Etkinlik Sorumlusu rollerini yönetin",
    totalAdmins: "Toplam admin",
    eventManagers: "Etkinlik sorumlusu",
    addNewAdmin: "Yeni yönetici ekle",
    emailLabel: "Email adresi",
    roleLabel: "Rol",
    searchPlaceholder: "Kullanıcı aramaya başlayın…",
    unnamed: "İsimsiz",
    roleEventManager: "Etkinlik sorumlusu",
    roleAdmin: "Admin",
    addAdminBtn: "Yönetici ekle",
    adminsTitle: "Yöneticiler",
    you: "Siz",
    roleAdminText: "Admin",
    roleEventManagerText: "Etkinlik sorumlusu",
    roleUnknownText: "Bilinmeyen",
    adminsLoadFailed: "Yöneticiler yüklenemedi",
    adminsLoadError: "Yöneticiler yüklenirken hata oluştu.",
    usersLoadFailed: "Kullanıcılar yüklenemedi",
    usersLoadError: "Kullanıcılar yüklenirken hata oluştu.",
    adminAdded: "Yönetici başarıyla eklendi",
    adminAddError: "Yönetici eklenirken bir hata oluştu.",
    cannotRemoveSelf: "Kendinizi yönetici listesinden çıkaramazsınız.",
    adminRemoved: "Yönetici başarıyla silindi",
    adminRemoveError: "Yönetici silinirken bir hata oluştu.",
    cannotChangeOwnRole: "Kendi rolünüzü değiştiremezsiniz",
    roleUpdated: "Rol başarıyla güncellendi",
    roleUpdateError: "Rol güncellenirken bir hata oluştu.",
  },
  en: {
    pageTitle: "Admin authorization",
    pageSubtitle: "Manage Admin and Event Manager roles",
    totalAdmins: "Total admins",
    eventManagers: "Event managers",
    addNewAdmin: "Add new admin",
    emailLabel: "Email address",
    roleLabel: "Role",
    searchPlaceholder: "Start searching for a user…",
    unnamed: "Unnamed",
    roleEventManager: "Event manager",
    roleAdmin: "Admin",
    addAdminBtn: "Add admin",
    adminsTitle: "Admins",
    you: "You",
    roleAdminText: "Admin",
    roleEventManagerText: "Event manager",
    roleUnknownText: "Unknown",
    adminsLoadFailed: "Failed to load admins.",
    adminsLoadError: "An error occurred while loading admins.",
    usersLoadFailed: "Failed to load users.",
    usersLoadError: "An error occurred while loading users.",
    adminAdded: "Admin added successfully",
    adminAddError: "An error occurred while adding the admin.",
    cannotRemoveSelf: "You cannot remove yourself from the admin list.",
    adminRemoved: "Admin removed successfully",
    adminRemoveError: "An error occurred while removing the admin.",
    cannotChangeOwnRole: "You cannot change your own role.",
    roleUpdated: "Role updated successfully",
    roleUpdateError: "An error occurred while updating the role.",
  },
};

export default function AdminManagementPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState(ROLES.EVENT_MANAGER);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const fetchAdmins = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      } else {
        logger.error('Failed to fetch admins');
        toast.error(copy.adminsLoadFailed);
      }
    } catch (error) {
      logger.error("Error fetching admins:", error);
      toast.error(copy.adminsLoadError);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        logger.error('Failed to fetch users');
        toast.error(copy.usersLoadFailed);
      }
    } catch (error) {
      logger.error("Error fetching users:", error);
      toast.error(copy.usersLoadError);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAdmins();
      fetchUsers();
    }
  }, [user, refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newAdminEmail,
          role: newAdminRole
        })
      });

      if (response.ok) {
        setAdmins((prev) => [
          ...prev,
          { id: newAdminEmail, email: newAdminEmail, role: newAdminRole },
        ]);
        setNewAdminEmail("");
        setNewAdminRole(ROLES.EVENT_MANAGER);
        setShowSuggestions(false);
        toast.success(copy.adminAdded);
      } else {
        const error = await response.json();
        toast.error(error.error || copy.adminAddError);
      }
    } catch (error) {
      logger.error("Error adding admin:", error);
      toast.error(copy.adminAddError);
    }
  };

  const handleRemoveAdmin = async (id) => {
    if (id === user.email) {
      toast.error(copy.cannotRemoveSelf);
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/admins?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAdmins((prev) => prev.filter((admin) => admin.id !== id));
        toast.success(copy.adminRemoved);
      } else {
        const error = await response.json();
        toast.error(error.error || copy.adminRemoveError);
      }
    } catch (error) {
      logger.error("Error removing admin:", error);
      toast.error(copy.adminRemoveError);
    }
  };

  const handleUpdateRole = async (adminId, newRole) => {
    if (adminId === user.email) {
      toast.error(copy.cannotChangeOwnRole);
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adminId,
          role: newRole
        })
      });

      if (response.ok) {
        setAdmins((prev) =>
          prev.map((admin) =>
            admin.id === adminId ? { ...admin, role: newRole } : admin
          )
        );
        toast.success(copy.roleUpdated);
      } else {
        const error = await response.json();
        toast.error(error.error || copy.roleUpdateError);
      }
    } catch (error) {
      logger.error("Error updating role:", error);
      toast.error(copy.roleUpdateError);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return "accent";
      default:
        return "neutral";
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return copy.roleAdminText;
      case ROLES.EVENT_MANAGER:
        return copy.roleEventManagerText;
      default:
        return copy.roleUnknownText;
    }
  };

  const handleEmailInputChange = (e) => {
    const value = e.target.value;
    setNewAdminEmail(value);
    
    if (value.length > 0) {
      const availableUsers = users.filter(user => 
        !admins.some(admin => admin.email === user.email)
      );
      
      const filtered = availableUsers.filter(user =>
        user.email.toLowerCase().includes(value.toLowerCase()) ||
        user.name?.toLowerCase().includes(value.toLowerCase())
      );
      
      setFilteredUsers(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredUsers([]);
    }
  };

  const selectUser = (userEmail) => {
    setNewAdminEmail(userEmail);
    setShowSuggestions(false);
    setFilteredUsers([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.autocomplete-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <AdminProtection requiredRole={ROLES.ADMIN}>
      <div>
        <PageHeader
          title={copy.pageTitle}
          description={copy.pageSubtitle}
        />

        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Stat
            label={copy.totalAdmins}
            value={admins.filter(admin => admin.role === ROLES.ADMIN || !admin.role).length}
          />
          <Stat
            label={copy.eventManagers}
            value={admins.filter(admin => admin.role === ROLES.EVENT_MANAGER).length}
          />
        </dl>

        <Section title={copy.addNewAdmin}>
          <form onSubmit={handleAddAdmin} className="max-w-3xl space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="autocomplete-container relative flex flex-col gap-1.5">
                <Label htmlFor="new-admin-email">{copy.emailLabel}</Label>
                <Input
                  id="new-admin-email"
                  type="email"
                  placeholder={copy.searchPlaceholder}
                  value={newAdminEmail}
                  onChange={handleEmailInputChange}
                  onFocus={() => {
                    if (newAdminEmail.length > 0 && filteredUsers.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  required
                />
                {showSuggestions && (
                  <div className="absolute left-0 top-full z-dropdown mt-1 max-h-60 w-full overflow-y-auto rounded border border-edge bg-popover text-popover-foreground shadow-whisper">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(user.email)}
                        className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-rule p-3 transition-colors duration-micro last:border-b-0 hover:bg-secondary"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-3 text-sm font-bold text-ink">
                          {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{user.name || copy.unnamed}</p>
                          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-admin-role">{copy.roleLabel}</Label>
                <select
                  id="new-admin-role"
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className={cn(fieldClasses, "h-control py-2")}
                >
                  <option value={ROLES.EVENT_MANAGER}>{copy.roleEventManager}</option>
                  <option value={ROLES.ADMIN}>{copy.roleAdmin}</option>
                </select>
              </div>
            </div>
            <Button type="submit">{copy.addAdminBtn}</Button>
          </form>
        </Section>

        <Section title={copy.adminsTitle}>
          <ul className="border-t border-rule">
            {admins.map((admin) => (
              <li
                key={admin.id}
                className="flex flex-col gap-4 border-b border-rule py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-3 font-display font-bold text-ink">
                    {admin.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="break-all text-base font-semibold">
                      {admin.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(admin.role || ROLES.ADMIN)}>
                        {getRoleText(admin.role || ROLES.ADMIN)}
                      </Badge>
                      {admin.id === user.email && (
                        <Badge variant="warning">{copy.you}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {admin.id !== user.email && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      aria-label={copy.roleLabel}
                      value={admin.role || ROLES.ADMIN}
                      onChange={(e) => handleUpdateRole(admin.id, e.target.value)}
                      className={cn(fieldClasses, "h-control py-2 sm:w-auto")}
                    >
                      <option value={ROLES.ADMIN}>{copy.roleAdmin}</option>
                      <option value={ROLES.EVENT_MANAGER}>{copy.roleEventManager}</option>
                    </select>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveAdmin(admin.id)}
                    >
                      {a.delete}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </AdminProtection>
  );
}
