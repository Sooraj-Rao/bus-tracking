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

export const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common["x-auth-token"] = token;
  } else {
    delete axios.defaults.headers.common["x-auth-token"];
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      const userToken = localStorage.getItem("userToken");
      const adminToken = localStorage.getItem("adminToken");

      if (userToken) {
        try {
          setAuthHeader(userToken);
          const res = await axios.get("http://localhost:5000/api/auth/me");
          setUser(res.data.user);
          setIsAdmin(false);
        } catch (error) {
          console.error("User token invalid or expired:", error);
          localStorage.removeItem("userToken");
          setUser(null);
        }
      }

      if (adminToken) {
        try {
          setAuthHeader(adminToken);
          await axios.get("http://localhost:5000/api/buses");
          setIsAdmin(true);
          setUser(null);
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
    isAuthenticated: !!user || isAdmin,
    loading,
    login,
    logout,
    setAuthHeader,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
