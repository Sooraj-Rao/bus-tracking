// src/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores user data if logged in
  const [isAdmin, setIsAdmin] = useState(false); // True if admin is logged in
  const [loading, setLoading] = useState(true); // To indicate initial auth check is complete
  const navigate = useNavigate();

  // Function to set Axios default header for authenticated requests
  const setAuthHeader = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common["x-auth-token"] = token;
    } else {
      delete axios.defaults.headers.common["x-auth-token"];
    }
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const userToken = localStorage.getItem("userToken");
      const adminToken = localStorage.getItem("adminToken");

      if (userToken) {
        try {
          // In a real app, you'd verify this token with a backend endpoint
          // For now, we'll just decode it on the client (less secure but works for demo)
          // Or, make a simple /api/auth/me endpoint to verify and return user data
          setAuthHeader(userToken);
          const res = await axios.get("http://localhost:5000/api/auth/me"); // New endpoint needed
          setUser(res.data.user);
          setIsAdmin(false); // A regular user is not an admin
        } catch (error) {
          console.error("User token invalid or expired:", error);
          localStorage.removeItem("userToken");
          setUser(null);
        }
      }

      if (adminToken) {
        try {
          setAuthHeader(adminToken);
          // Admin token verification is handled by the backend middleware on protected routes
          // We can make a simple call to a protected admin route to check validity
          await axios.get("http://localhost:5000/api/buses"); // Example protected admin route
          setIsAdmin(true);
          setUser(null); // Admin is not a regular user in this context
        } catch (error) {
          console.error("Admin token invalid or expired:", error);
          localStorage.removeItem("adminToken");
          setIsAdmin(false);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, [setAuthHeader]);

  const login = (token, userData, isAdminUser = false) => {
    if (isAdminUser) {
      localStorage.setItem("adminToken", token);
      setIsAdmin(true);
      setUser(null);
    } else {
      localStorage.setItem("userToken", token);
      setUser(userData);
      setIsAdmin(false);
    }
    setAuthHeader(token);
  };

  const logout = () => {
    if (confirm("Are your sure want to Logout?")) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      setUser(null);
      setIsAdmin(false);
      setAuthHeader(null);
      navigate("/login");
    }
  };

  const value = {
    user,
    isAdmin,
    isAuthenticated: !!user || isAdmin, // True if either user or admin is logged in
    loading,
    login,
    logout,
    setAuthHeader, // Expose this for direct use if needed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
