"use client";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ROLES } from "@/utils/roleUtils";
import { logger } from "@/utils/logger";
import AdminProtection from "@/components/AdminProtection";

export default function AdminManagementPage() {
  const [user, loading] = useAuthState(auth);
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState(ROLES.EVENT_MANAGER);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const router = useRouter();

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
        toast.error('Yöneticiler yüklenemedi!');
      }
    } catch (error) {
      logger.error("Error fetching admins:", error);
      toast.error('Yöneticiler yüklenirken hata oluştu!');
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
        toast.error('Kullanıcılar yüklenemedi!');
      }
    } catch (error) {
      logger.error("Error fetching users:", error);
      toast.error('Kullanıcılar yüklenirken hata oluştu!');
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
        toast.success("Yönetici başarıyla eklendi!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Yönetici eklenirken bir hata oluştu!");
      }
    } catch (error) {
      logger.error("Error adding admin:", error);
      toast.error("Yönetici eklenirken bir hata oluştu!");
    }
  };

  const handleRemoveAdmin = async (id) => {
    if (id === user.email) {
      toast.error("Kendinizi yönetici listesinden çıkaramazsınız!");
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
        toast.success("Yönetici başarıyla silindi!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Yönetici silinirken bir hata oluştu!");
      }
    } catch (error) {
      logger.error("Error removing admin:", error);
      toast.error("Yönetici silinirken bir hata oluştu!");
    }
  };

  const handleUpdateRole = async (adminId, newRole) => {
    if (adminId === user.email) {
      toast.error("Kendi rolünüzü değiştiremezsiniz!");
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
        toast.success("Rol başarıyla güncellendi!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Rol güncellenirken bir hata oluştu!");
      }
    } catch (error) {
      logger.error("Error updating role:", error);
      toast.error("Rol güncellenirken bir hata oluştu!");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return "bg-gradient-to-r from-red-500 to-pink-500";
      case ROLES.EVENT_MANAGER:
        return "bg-gradient-to-r from-blue-500 to-purple-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return "Admin";
      case ROLES.EVENT_MANAGER:
        return "Etkinlik Sorumlusu";
      default:
        return "Bilinmeyen";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Yönetici Yetkilendirme
          </h1>
          <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full"></div>
        </div>
        <p className="text-gray-300 mt-4 text-lg">Admin ve Etkinlik Sorumlusu rollerini yönetin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Toplam Admin</p>
              <p className="text-3xl font-bold text-red-400">
                {admins.filter(admin => admin.role === ROLES.ADMIN || !admin.role).length}
              </p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Etkinlik Sorumlusu</p>
              <p className="text-3xl font-bold text-blue-400">
                {admins.filter(admin => admin.role === ROLES.EVENT_MANAGER).length}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 mb-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
            Yeni Yönetici Ekle
          </h2>
        </div>
        
        <form onSubmit={handleAddAdmin} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative autocomplete-container">
              <input
                type="email"
                placeholder="Kullanıcı aramaya başlayın..."
                value={newAdminEmail}
                onChange={handleEmailInputChange}
                onFocus={() => {
                  if (newAdminEmail.length > 0 && filteredUsers.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                required
                className="w-full px-6 py-4 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 placeholder-gray-500"
              />
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 rounded-2xl shadow-xl border border-gray-600 max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => selectUser(user.email)}
                      className="flex items-center p-4 hover:bg-gray-700/60 cursor-pointer transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-semibold text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-100">{user.name || 'İsimsiz'}</p>
                        <p className="text-sm text-gray-300">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
                className="w-full px-6 py-4 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 [&>option]:text-gray-200 [&>option]:bg-gray-800"
              >
                <option value={ROLES.EVENT_MANAGER}>Etkinlik Sorumlusu</option>
                <option value={ROLES.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl font-semibold text-lg hover:from-green-600 hover:to-blue-600 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Yönetici Ekle
          </button>
        </form>
      </section>

      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
            Yöneticiler
          </h2>
        </div>
        
        <div className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-md border border-gray-600/30 gap-4 sm:gap-0"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {admin.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-100">
                    {admin.email}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getRoleBadgeColor(admin.role || ROLES.ADMIN)}`}>
                      {getRoleText(admin.role || ROLES.ADMIN)}
                    </span>
                    {admin.id === user.email && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-800 rounded-full text-xs font-medium">
                        Siz
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {admin.id !== user.email && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <select
                    value={admin.role || ROLES.ADMIN}
                    onChange={(e) => handleUpdateRole(admin.id, e.target.value)}
                    className="px-4 py-2 bg-gray-700/70 border border-gray-500 rounded-xl focus:outline-none focus:border-blue-400 transition-all duration-300 text-gray-200 [&>option]:text-gray-200 [&>option]:bg-gray-800"
                  >
                    <option value={ROLES.ADMIN}>Admin</option>
                    <option value={ROLES.EVENT_MANAGER}>Etkinlik Sorumlusu</option>
                  </select>
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 text-center">
        <button
          onClick={() => router.push("/admin")}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-3 rounded-2xl font-semibold hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Admin Paneline Dön
        </button>
      </div>

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
        theme="dark"
      />
    </div>
    </AdminProtection>
  );
}