"use client";
import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Input } from "@/components/ui/input";
import { logger } from "@/utils/logger";

const UserMentionInput = ({ onUserSelect, selectedUsers = [], placeholder = "Kullanıcı emaili ile ara..." }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const usersRef = collection(db, "users");
        const searchQuery = query(
          usersRef,
          where("email", ">=", searchTerm.toLowerCase()),
          where("email", "<=", searchTerm.toLowerCase() + '\uf8ff'),
          limit(10)
        );

        const querySnapshot = await getDocs(searchQuery);
        const users = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));

        // Filter out already selected users
        const filteredUsers = users.filter(user =>
          !selectedUsers.some(selected => selected.uid === user.uid)
        );

        setSearchResults(filteredUsers);
        setShowDropdown(filteredUsers.length > 0);
      } catch (error) {
        logger.error("Error searching users:", error);
        setSearchResults([]);
        setShowDropdown(false);
      }
      setIsLoading(false);
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedUsers]);

  const handleUserSelect = (user) => {
    onUserSelect(user);
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleInputFocus}
        placeholder={placeholder}
      />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-popover w-full mt-1 bg-background border border-rule rounded shadow-whisper max-h-60 overflow-auto animate-in fade-in-0 duration-short"
        >
          {isLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Aranıyor...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <button
                type="button"
                key={user.uid}
                onClick={() => handleUserSelect(user)}
                className="flex w-full min-h-11 items-center gap-3 p-3 text-left transition-colors duration-micro hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
              >
                <img
                  src={user.photoURL || "/logo.svg"}
                  alt={user.name || "User"}
                  className="w-8 h-8 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">
                    {user.name || "İsim belirtilmemiş"}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </div>
              </button>
            ))
          ) : searchTerm.length >= 2 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Kullanıcı bulunamadı
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default UserMentionInput;
