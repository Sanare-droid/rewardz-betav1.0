import MobileLayout from "@/components/rewardz/MobileLayout";
import * as React from "react";
const { useEffect, useState, useRef, useMemo } = React;
import { db, storage } from "@/lib/firebase";
import {
  addDoc,
  arrayUnion,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useUser } from "@/context/UserContext";
import { toast } from "@/components/ui/use-toast";

function PostCard({ postId, post, onComment }: any) {
  const [comments, setComments] = useState<any[]>([]);
  useEffect(() => {
    const col = collection(db, "posts", postId, "comments");
    const unsub = onSnapshot(
      query(col, orderBy("createdAt", "asc"), limit(20)),
      (snap) =>
        setComments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, [postId]);
  return (
    <article className="rounded-2xl border overflow-hidden">
      <header className="px-4 pt-4 flex items-center gap-3">
        <img
          src={post.avatar || "https://i.pravatar.cc/80"}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div>
          <div className="font-medium">
            {post.author || "Member"} • Community
          </div>
          <div className="text-xs text-gray-500">{post.location || ""}</div>
        </div>
      </header>
      {post.image && (
        <img src={post.image} className="h-48 w-full object-cover" />
      )}
      <div className="p-4">
        <p>{post.text}</p>
        <div className="mt-3 flex gap-4 text-sm text-gray-600">
          <button onClick={post.onLike}>👍 {post.likes || 0}</button>
          <button>💬 {comments.length}</button>
        </div>
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium">{c.author || "User"}:</span>{" "}
              {c.text}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 h-10 rounded-lg border px-3"
            placeholder="Write a comment"
            onKeyDown={(e) => {
              if (e.key === "Enter")
                onComment(
                  (e.target as HTMLInputElement).value,
                  () => ((e.target as HTMLInputElement).value = ""),
                );
            }}
          />
          <button
            className="px-4 rounded-lg border"
            onClick={() => {
              const inp = document.activeElement as HTMLInputElement;
              if (inp && inp.value)
                onComment(inp.value, () => (inp.value = ""));
            }}
          >
            Post
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Community() {
  const { user } = useUser();
  const [tab, setTab] = useState<"reunions" | "stories" | "forums">("reunions");
  const [posts, setPosts] = useState<any[]>([]);
  const [posting, setPosting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [stories, setStories] = useState<any[]>([]);
  const [postingStory, setPostingStory] = useState(false);
  const [storyText, setStoryText] = useState("");
  const storyFileRef = useRef<HTMLInputElement>(null);

  const [forums, setForums] = useState<any[]>([]);
  const [forumName, setForumName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50)),
      (snap) =>
        setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "stories"), orderBy("createdAt", "desc"), limit(50)),
      (snap) =>
        setStories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "forums"), orderBy("createdAt", "desc"), limit(50)),
      (snap) =>
        setForums(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc"),
        limit(20),
      ),
      (snap) =>
        setAnnouncements(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
        ),
    );
    return () => unsub();
  }, []);

  const createPost = async () => {
    if (!user) return;
    if (!text.trim() && !fileRef.current?.files?.[0]) {
      toast({ title: "Nothing to post", description: "Add text or a photo." });
      return;
    }
    setPosting(true);
    try {
      let image: string | undefined;
      const f = fileRef.current?.files?.[0];
      if (f) {
        const path = `posts/${user.uid}/${Date.now()}_${f.name}`;
        const sref = ref(storage, path);
        await uploadBytes(sref, f);
        image = await getDownloadURL(sref);
      }
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        author: user.name,
        avatar:
          (user as any)?.photoURL ||
          `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user.uid)}`,
        text,
        image: image || null,
        createdAt: serverTimestamp(),
        likes: 0,
        location: "",
      });
      setText("");
      if (fileRef.current) fileRef.current.value = "";
      setPreview(null);
      toast({ title: "Posted", description: "Your update is live." });
    } catch (e: any) {
      toast({
        title: "Failed to post",
        description: e?.message || "Try again",
        variant: "destructive" as any,
      });
    } finally {
      setPosting(false);
    }
  };

  const createStory = async () => {
    if (!user) return;
    if (!storyText.trim() && !storyFileRef.current?.files?.[0]) {
      toast({ title: "Nothing to post", description: "Add text or a photo." });
      return;
    }
    setPostingStory(true);
    try {
      let image: string | undefined;
      const f = storyFileRef.current?.files?.[0];
      if (f) {
        const path = `stories/${user.uid}/${Date.now()}_${f.name}`;
        const sref = ref(storage, path);
        await uploadBytes(sref, f);
        image = await getDownloadURL(sref);
      }
      await addDoc(collection(db, "stories"), {
        authorId: user.uid,
        author: user.name,
        text: storyText,
        image: image || null,
        createdAt: serverTimestamp(),
      });
      setStoryText("");
      if (storyFileRef.current) storyFileRef.current.value = "";
      toast({ title: "Story posted" });
    } catch (e: any) {
      toast({
        title: "Failed to post story",
        description: e?.message || "Try again",
        variant: "destructive" as any,
      });
    } finally {
      setPostingStory(false);
    }
  };

  const createForum = async () => {
    if (!user || !forumName.trim()) return;
    const docRef = await addDoc(collection(db, "forums"), {
      name: forumName.trim(),
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      members: [user.uid],
    });
    setForumName("");
    setShowCreate(false);
    await setDoc(doc(db, "forums", docRef.id, "members", user.uid), {
      uid: user.uid,
      joinedAt: serverTimestamp(),
    });
  };

  const addMember = async (forumId: string) => {
    if (!memberEmail.trim()) return;
    const q = query(
      collection(db, "users"),
      where("email", "==", memberEmail.trim()),
    );
    const snap = await getDocs(q as any);
    const userDoc = snap.docs[0];
    if (userDoc) {
      const uid = userDoc.id;
      await setDoc(doc(db, "forums", forumId, "members", uid), {
        uid,
        joinedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "forums", forumId), { members: arrayUnion(uid) });
      setMemberEmail("");
    }
  };

  const joinForum = async (forumId: string) => {
    if (!user) return;
    await setDoc(doc(db, "forums", forumId, "members", user.uid), {
      uid: user.uid,
      joinedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "forums", forumId), {
      members: arrayUnion(user.uid),
    });
  };

  const leaveForum = async (forumId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "forums", forumId, "members", user.uid)).catch(
      () => {},
    );
    await updateDoc(doc(db, "forums", forumId), {
      members: arrayRemove(user.uid),
    }).catch(() => {});
  };

  return (
    <MobileLayout title="Community">
      <div className="mt-2">
        <div className="inline-flex rounded-full bg-muted p-1">
          {(["reunions", "stories", "forums"] as const).map((t) => (
            <button
              key={t}
              className={`px-4 py-2 rounded-full text-sm ${tab === t ? "bg-[hsl(var(--brand-mint))] text-primary" : "text-primary/80"}`}
              onClick={() => setTab(t)}
            >
              {t === "reunions"
                ? "Reunions"
                : t === "stories"
                  ? "Stories"
                  : "Forums"}
            </button>
          ))}
        </div>

        {tab === "reunions" && (
          <div className="mt-3 space-y-6">
            {user && (
              <div className="rounded-2xl border p-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share an update"
                  className="w-full h-20 rounded-lg border px-3 py-2"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileRef}
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = () => setPreview(String(r.result));
                        r.readAsDataURL(f);
                      } else {
                        setPreview(null);
                      }
                    }}
                  />
                  <button
                    disabled={posting}
                    className="px-4 py-2 rounded-full bg-[hsl(var(--brand-mint))] text-primary disabled:opacity-50"
                    onClick={createPost}
                  >
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
                {preview && (
                  <div className="mt-2">
                    <img
                      src={preview}
                      className="h-32 w-full object-cover rounded-xl"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="text-sm text-gray-500">Recently Found Pets</h3>
              <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
                {posts.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[180px] rounded-xl border overflow-hidden bg-white"
                  >
                    {p.image && (
                      <img src={p.image} className="h-24 w-full object-cover" />
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={p.avatar || "https://i.pravatar.cc/80"}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                        <div className="text-xs text-gray-600">
                          {p.author || "Member"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-500">Recovery Journeys</h3>
              <div className="mt-2 space-y-3">
                {posts.slice(0, 3).map((p, i) => (
                  <article
                    key={p.id}
                    className="rounded-2xl border overflow-hidden bg-[hsl(var(--brand-mint))]"
                  >
                    {p.image && (
                      <img src={p.image} className="h-40 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <span className="font-semibold">
                          {p.author || "Member"}
                        </span>
                        <span className="ml-auto text-xs">{i + 1}/3</span>
                      </div>
                      <p className="text-sm mt-1 text-gray-700">{p.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-500">Community Feed</h3>
              <div className="mt-2 space-y-4">
                {posts.map((p) => (
                  <PostCard
                    key={p.id}
                    postId={p.id}
                    post={{
                      ...p,
                      onLike: async () => {
                        if (!user) return;
                        await updateDoc(doc(db, "posts", p.id), {
                          likes: increment(1) as any,
                        });
                      },
                    }}
                    onComment={async (val: string, reset: () => void) => {
                      if (!user || !val) return;
                      await addDoc(collection(db, "posts", p.id, "comments"), {
                        text: val,
                        author: user.name,
                        authorId: user.uid,
                        createdAt: serverTimestamp(),
                      });
                      reset();
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "stories" && (
          <div className="mt-3 space-y-4">
            {user && (
              <div className="rounded-2xl border p-3">
                <textarea
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Share your story"
                  className="w-full h-20 rounded-lg border px-3 py-2"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input type="file" ref={storyFileRef} accept="image/*" />
                  <button
                    disabled={postingStory}
                    className="px-4 py-2 rounded-full bg-[hsl(var(--brand-mint))] text-primary disabled:opacity-50"
                    onClick={createStory}
                  >
                    {postingStory ? "Posting..." : "Post Story"}
                  </button>
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm text-gray-500">Happy Reunions</h3>
              <div className="mt-2 space-y-3">
                {stories.map((s) => (
                  <article
                    key={s.id}
                    className="rounded-2xl border p-4 bg-[hsl(var(--brand-mint))]"
                  >
                    {s.image && (
                      <img
                        src={s.image}
                        className="h-40 w-full object-cover rounded-xl mb-2"
                      />
                    )}
                    <div className="text-sm">
                      <span className="font-semibold">Location:</span>{" "}
                      {s.location || ""}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">Pet:</span> {s.pet || ""}
                    </div>
                    <p className="text-sm mt-2 text-gray-700">{s.text}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {s.createdAt?.toDate
                        ? s.createdAt.toDate().toLocaleDateString()
                        : ""}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "forums" && (
          <div className="mt-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-500">Groups</h3>
              {user && (
                <button
                  className="px-4 py-2 rounded-full bg-[hsl(var(--brand-mint))] text-primary"
                  onClick={() => setShowCreate((v) => !v)}
                >
                  Add Group
                </button>
              )}
            </div>
            {user && showCreate && (
              <div className="rounded-2xl border p-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="col-span-2 h-10 rounded-lg border px-3"
                    placeholder="Forum name"
                    value={forumName}
                    onChange={(e) => setForumName(e.target.value)}
                  />
                  <button
                    className="px-4 rounded-lg border"
                    onClick={createForum}
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {user && (
              <>
                <div className="text-sm font-medium">Groups you're in</div>
                {forums
                  .filter(
                    (f) =>
                      Array.isArray(f.members) && f.members.includes(user.uid),
                  )
                  .map((f) => (
                    <div key={f.id} className="rounded-2xl border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{f.name}</div>
                          <div className="text-xs text-gray-500">
                            Members:{" "}
                            {Array.isArray(f.members) ? f.members.length : 1}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 rounded-full border"
                            onClick={() => leaveForum(f.id)}
                          >
                            Leave
                          </button>
                          <button
                            aria-label="More"
                            className="h-8 w-8 rounded-full border"
                            onClick={() =>
                              setMenuOpen(menuOpen === f.id ? null : f.id)
                            }
                          >
                            ⋯
                          </button>
                        </div>
                      </div>
                      {menuOpen === f.id && (
                        <div className="mt-2 rounded-xl border p-2 text-sm">
                          <button className="block w-full text-left py-1">
                            Community info
                          </button>
                          <button
                            className="block w-full text-left py-1"
                            onClick={() => {
                              leaveForum(f.id);
                              setMenuOpen(null);
                            }}
                          >
                            Exit Community
                          </button>
                        </div>
                      )}
                      {f.ownerId === user.uid && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <input
                            className="col-span-2 h-10 rounded-lg border px-3"
                            placeholder="Add member by email"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                          />
                          <button
                            className="px-3 rounded-lg border"
                            onClick={() => addMember(f.id)}
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </>
            )}

            <div className="text-sm font-medium">Groups you can join</div>
            {forums
              .filter(
                (f) =>
                  !Array.isArray(f.members) ||
                  !user ||
                  !f.members.includes(user.uid),
              )
              .map((f) => (
                <div key={f.id} className="rounded-2xl border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-gray-500">
                        Members:{" "}
                        {Array.isArray(f.members) ? f.members.length : 1}
                      </div>
                    </div>
                    {user && (
                      <button
                        className="px-3 rounded-full border"
                        onClick={() => joinForum(f.id)}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {announcements.length > 0 && (
              <div>
                <div className="mt-4 text-sm font-medium">
                  General Announcements
                </div>
                <div className="mt-2 space-y-2">
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 py-2 border-b"
                    >
                      <img
                        src={a.avatar || "https://i.pravatar.cc/60"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {a.title || a.text || "Announcement"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {a.subtitle || a.time || ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user && (
              <button
                className="fixed right-6 bottom-24 h-12 w-12 rounded-full bg-[hsl(var(--brand-mint))] text-primary shadow"
                onClick={() => setShowCreate(true)}
              >
                +
              </button>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
