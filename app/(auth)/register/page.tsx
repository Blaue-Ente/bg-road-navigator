import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user.store";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const userStore = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // In a real app, this would call the Supabase auth endpoint
      // For now, we'll simulate authentication
      if (email && password && username) {
        const session = {
          user: {
            id: "new-user-id",
            email: email
          },
          access_token: "test-token",
          expires_at: Date.now() + 3600000
        };
        const profile = {
          id: "new-user-id",
          username: username,
          avatar_url: null,
          vehicle_type: "car",
          fuel_type: "diesel",
          tank_capacity_liters: null,
          ev_range_km: null
        };
        userStore.setSession(session);
        userStore.setProfile(profile);
        router.push("/");
      } else {
        setError("Моля попълнете всички полета");
      }
    } catch (err) {
      setError("Грешка при регистрация");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-gray-900 text-white border border-gray-800 rounded-lg">
      <h2 className="text-2xl mb-6 text-center">Регистрация</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Имейл
          </label>
          <input 
            id="email" 
            type="email" 
            required 
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Парола
          </label>
          <input 
            id="password" 
            type="password" 
            required 
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="username">
            Потребителско име
          </label>
          <input 
            id="username" 
            type="text" 
            required 
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        {error && <p className="text-red-400">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
        >
          {loading ? "Регистрация..." : "Регистрация"}
        </button>
      </form>
    </div>
  );
}