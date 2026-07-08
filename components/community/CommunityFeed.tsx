"use client";

import { useCommunityStore } from "@/lib/stores/community.store";
import { CommentThread } from "@/components/community/CommentThread";
import { useUserStore } from "@/lib/stores/user.store";

export function CommunityFeed() {
  const communityStore = useCommunityStore();
  const userStore = useUserStore();
  const { pins, setSelectedPin, selectedPin, upvotePin } = communityStore;
  const authenticated = !!userStore.session;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Последни маркери</h2>
        <span className="text-sm text-gray-400">{pins.length} активни</span>
      </div>

      {pins.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          Няма активни маркери в момента.
        </div>
      ) : (
        <div className="space-y-3">
          {pins.map((pin) => (
            <div 
              key={pin.id} 
              className="bg-gray-900 rounded-lg p-4 border border-gray-800"
              onClick={() => setSelectedPin(pin)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{pin.title}</h3>
                  <p className="text-sm text-gray-400">{pin.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{pin.upvotes}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      upvotePin(pin.id);
                    }}
                    className="text-xl hover:scale-110 transition"
                    aria-label="Подхвали"
                  >
                    👍
                  </button>
                </div>
              </div>
              
              {pin.description && (
                <p className="text-sm text-gray-300 mb-2">{pin.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {pin.expires_at 
                    ? `Изтича: ${new Date(pin.expires_at).toLocaleString("bg-BG")}`
                    : "Постоянно"}
                </span>
                {authenticated && pin.user_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Report pin
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    Доклади
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected pin detail */}
      {selectedPin && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-40">
          <div className="bg-gray-900 rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedPin.title}</h2>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                {selectedPin.category}
              </span>
              {selectedPin.description && (
                <p className="mt-2 text-gray-300">{selectedPin.description}</p>
              )}
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-400">
                {selectedPin.expires_at 
                  ? `Изтича: ${new Date(selectedPin.expires_at).toLocaleString("bg-BG")}`
                  : "Постоянен маркер"}
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => upvotePin(selectedPin.id)}
                  className="flex-1 py-2 bg-green-600/20 text-green-400 rounded"
                >
                  Подхвали ({selectedPin.upvotes})
                </button>
                {authenticated && (
                  <button className="flex-1 py-2 bg-gray-700 text-white rounded">
                    Подробности
                  </button>
                )}
              </div>
            </div>

            <CommentThread pinId={selectedPin.id} />
          </div>
        </div>
      )}
    </div>
  );
}