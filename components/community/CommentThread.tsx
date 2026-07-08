"use client";

import { useCommunityStore } from "@/lib/stores/community.store";
import { PinCategorySelector } from "@/components/community/PinCategorySelector";

export function CommentThread({ pinId }: { pinId: string }) {
  const communityStore = useCommunityStore();
  const { comments, addComment } = communityStore;

  const pinComments = comments.filter((c) => c.pin_id === pinId);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (newComment.trim()) {
      addComment({
        id: crypto.randomUUID(),
        pin_id: pinId,
        user_id: "current-user",
        body: newComment.trim(),
        created_at: new Date().toISOString()
      });
      setNewComment("");
    }
  };

  return (
    <div className="space-y-3">
      {pinComments.map((comment) => (
        <div key={comment.id} className="bg-gray-800 rounded p-3">
          <p className="text-sm">{comment.body}</p>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(comment.created_at).toLocaleString("bg-BG")}
          </div>
        </div>
      ))}

      <div className="mt-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-900 text-white text-sm resize-none"
          placeholder="Добави коментар..."
          rows={2}
          maxLength={500}
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className="mt-1 w-full py-1.5 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Публикувай
        </button>
      </div>
    </div>
  );
}