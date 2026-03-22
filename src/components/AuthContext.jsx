import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(
    localStorage.getItem("isAuth") === "true",
  );
  const [userRole, setUserRole] = useState(
    localStorage.getItem("userRole") || null,
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );

  const login = (userData) => {
    localStorage.setItem("isAuth", "true");
    if (userData) {
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("user", JSON.stringify(userData));
      setUserRole(userData.role);
      setUser(userData);
    }
    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    setIsAuth(false);
    setUserRole(null);
    setUser(null);

    fetch("http://localhost:8080/api/Authenticate/logout", {
      method: "POST",
      credentials: "include",
    }).catch((err) => console.log("Logout error:", err));
  };

  const isAdmin = () => {
    return userRole === "Admin" || userRole === "ADMIN";
  };

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        userRole,
        user,
        login,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
