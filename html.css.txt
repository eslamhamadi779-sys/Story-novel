import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Send, Trash2, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  createdAt: any;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 px-4 py-3 flex justify-between items-center bg-opacity-80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-xl tracking-tight">لوحة الرسائل</span>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <LogIn className="w-4 h-4" />
            دخول بجوجل
          </button>
        )}
      </nav>

      <main className="max-w-2xl mx-auto pt-24 pb-32 px-4">
        {!user && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center mb-8"
          >
            <h2 className="text-lg font-semibold text-blue-900 mb-2">مرحباً بك!</h2>
            <p className="text-blue-700 text-sm mb-4">قم بتسجيل الدخول لمشاركة رسائلك مع الجميع.</p>
            <button 
              onClick={handleLogin}
              className="px-6 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm"
            >
              سجل دخولك الآن
            </button>
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-2xl shadow-sm border ${
                  user?.uid === msg.userId 
                    ? 'bg-blue-600 text-white border-blue-500 ml-auto' 
                    : 'bg-white border-gray-100 mr-auto'
                } max-w-[85%] relative group`}
              >
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${
                    user?.uid === msg.userId ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {msg.userEmail}
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                
                {user?.uid === msg.userId && (
                  <button 
                    onClick={() => deleteMessage(msg.id)}
                    className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 bg-white text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-red-50 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="text-center py-20 text-gray-400 italic">
              لا توجد رسائل بعد. كن أول من يكتب!
            </div>
          )}
        </div>
      </main>

      {user && (
        <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-4 bg-opacity-80 backdrop-blur-md">
          <form 
            onSubmit={sendMessage}
            className="max-w-2xl mx-auto flex gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>إرسال</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
