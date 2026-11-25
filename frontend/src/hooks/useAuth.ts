
import { useAuth as useAuthContext } from "../context/AuthContext";

const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    fetchUser,
  } = useAuthContext();

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser: fetchUser,
  };
};

export default useAuth;
