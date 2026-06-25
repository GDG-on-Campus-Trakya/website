"use client";
import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/utils/logger";

const COPY = {
  tr: {
    placeholder: "Kullanıcı emaili ile ara...",
    searching: "Aranıyor...",
    noName: "İsim belirtilmemiş",
    noUsers: "Kullanıcı bulunamadı",
  },
  en: {
    placeholder: "Search by user email...",
    searching: "Searching...",
    noName: "Name not specified",
    noUsers: "No users found",
  },
};

const UserMentionInput = ({ onUserSelect, selectedUsers = [], placeholder }) => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const resolvedPlaceholder = placeholder || copy.placeholder;
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
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleInputFocus}
        placeholder={resolvedPlaceholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {isLoading ? (
              <div className="p-3 text-center text-gray-500">
                {copy.searching}
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <motion.div
                  key={user.uid}
                  whileHover={{ backgroundColor: "#f3f4f6" }}
                  onClick={() => handleUserSelect(user)}
                  className="p-3 cursor-pointer hover:bg-gray-100 flex items-center gap-3"
                >
                  <img
                    src={user.photoURL || "/logo.svg"}
                    alt={user.name || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.name || copy.noName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : searchTerm.length >= 2 ? (
              <div className="p-3 text-center text-gray-500">
                {copy.noUsers}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMentionInput;