import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOperator = async (userId) => {
    if (!userId) { setOperator(null); return; }
    const { data } = await supabase
      .from("operators")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setOperator(data);
  };

  useEffect(() => {
    let realtimeChannel = null;

    const subscribeToOperator = (userId) => {
      if (!userId) return;
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);

      realtimeChannel = supabase
        .channel(`operator-status-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "operators",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setOperator(payload.new);
          }
        )
        .subscribe();
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadOperator(session?.user?.id);
      subscribeToOperator(session?.user?.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        loadOperator(session?.user?.id);
        subscribeToOperator(session?.user?.id);
      }
    );

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOperator(null);
  };

  return (
    <AuthContext.Provider value={{
      user, operator, loading, signOut, reloadOperator: () => loadOperator(user?.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
