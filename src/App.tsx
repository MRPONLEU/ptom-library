/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, BookOpen, Search } from 'lucide-react';
import { initAuth, googleSignIn, logout } from './lib/firebase';
import { User } from 'firebase/auth';
import TypesView from './components/TypesView';
import ManageFilesView from './components/ManageFilesView';
import ShowFilesView from './components/ShowFilesView';

const ADMIN_EMAILS = ['broponleu998@gmail.com', 'mrponleu20000@gmail.com'];

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'manage' | 'types' | 'show'>('show');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypes, setFileTypes] = useState<{ name: string; subTypes: string[] }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('fileTypes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((item: any) => {
            if (typeof item === 'string') {
              return { name: item, subTypes: [] };
            }
            return {
              name: item.name || '',
              subTypes: Array.isArray(item.subTypes) ? item.subTypes : []
            };
          });
          setFileTypes(normalized);
        }
      } catch (e) {
        console.error('Error parsing file types in App:', e);
      }
    } else {
      const defaultTypes = [
        { name: 'ភាសាខ្មែរ', subTypes: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣'] },
        { name: 'គណិតវិទ្យា', subTypes: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣'] },
        { name: 'វិទ្យាសាស្ត្រ', subTypes: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣'] },
        { name: 'សិក្សាសង្គម', subTypes: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣'] }
      ];
      setFileTypes(defaultTypes);
    }
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => { setUser(u); setNeedsAuth(false); setLoading(false); },
      () => { setUser(null); setNeedsAuth(true); setLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const msg = err.message || '';
      if (msg.includes('auth/popup-blocked') || (err.code && err.code.includes('popup-blocked'))) {
        alert("កម្មវិធីមិនអាចបើកផ្ទាំង Login បានទេ សូមចុច ... នៅខាងស្តាំដៃខាងលើ រួចជ្រើសរើស 'Open in browser' ដើម្បី Login (Popup blocked. Please open in browser).");
      }
    }
  };

  // Removed: if (loading) return <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center">Loading...</div>;

  // Removed: if (needsAuth) { ... }
  // ...
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex overflow-hidden font-sans relative">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      
      {isSidebarOpen && (
        <aside className="hidden md:flex w-80 bg-slate-950/40 border-r border-white/10 flex-col z-10 p-5 shrink-0 transition-all duration-300 select-none">
          <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
              <span className="text-xs font-extrabold text-slate-400 tracking-wider">ម៉ឺនុយជម្រើស (Menu)</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5">
                <X size={16} />
              </button>
            </div>

            {/* Premium Search Box */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">ស្វែងរកឯកសារ (Search)</div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ស្វែងរកតាមឈ្មោះឯកសារ..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-semibold"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-sans font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Type Categories selection */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">ប្រភេទឯកសារ (Categories)</div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setSelectedType('');
                    setActiveTab('show');
                  }}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                    !selectedType && activeTab === 'show'
                      ? 'bg-indigo-650/30 text-indigo-300 border-indigo-500/40 font-extrabold'
                      : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-transparent'
                  }`}
                >
                  <span>ទាំងអស់ (All Files)</span>
                </button>
                {fileTypes.map(typeItem => {
                  const isActive = selectedType === typeItem.name && activeTab === 'show';
                  return (
                    <button
                      key={typeItem.name}
                      onClick={() => {
                        setSelectedType(typeItem.name);
                        setActiveTab('show');
                      }}
                      className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                        isActive
                          ? 'bg-indigo-650/30 text-indigo-300 border-indigo-500/40 font-extrabold'
                          : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-transparent'
                      }`}
                    >
                      <span>{typeItem.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Administrative Section (for Admin only) */}
            {isAdmin && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">គ្រប់គ្រងប្រព័ន្ធ (Admin)</div>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => setActiveTab('manage')} 
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    គ្រប់គ្រងឯកសារ (Manage Files)
                  </button>
                  <button 
                    onClick={() => setActiveTab('types')} 
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${activeTab === 'types' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    ប្រភេទឯកសារ (Manage Types)
                  </button>
                  <button 
                    onClick={() => setActiveTab('show')} 
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${activeTab === 'show' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    បង្ហាញឯកសារ (Show Files)
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Consolidated Mobile Filter & Navigation Drawer */}
      {isMobileFilterOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-md z-[100] transition-opacity duration-300" 
            onClick={() => setIsMobileFilterOpen(false)} 
          />
          <aside className="fixed inset-y-0 left-0 w-80 bg-slate-950 border-r border-white/10 flex flex-col z-[101] p-6 transition-all duration-300 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">បណ្ណាល័យបឋម</span>
              </div>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 flex-1 text-slate-200">
              {/* Premium mobile search */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">ស្វែងរកឯកសារ (Search)</div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ស្វែងរកតាមឈ្មោះឯកសារ..."
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold font-sans"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Type Category selection */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">ប្រភេទឯកសារ (Quick Types)</div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedType('');
                      setActiveTab('show');
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full py-3 px-4 text-xs font-bold rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                      !selectedType && activeTab === 'show'
                        ? 'bg-indigo-650/25 text-indigo-300 border-indigo-500/35 font-extrabold'
                        : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-transparent'
                    }`}
                  >
                    <span>ទាំងអស់ (All Files)</span>
                  </button>
                  {fileTypes.map(typeItem => {
                    const isActive = selectedType === typeItem.name && activeTab === 'show';
                    return (
                      <button
                        key={typeItem.name}
                        onClick={() => {
                          setSelectedType(typeItem.name);
                          setActiveTab('show');
                          setIsMobileFilterOpen(false);
                        }}
                        className={`w-full py-3 px-4 text-xs font-bold rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                          isActive
                            ? 'bg-indigo-650/25 text-indigo-300 border-indigo-500/35 font-extrabold'
                            : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-transparent'
                        }`}
                      >
                        <span>{typeItem.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Navigation (If user is Admin) */}
              {isAdmin && (
                <div className="space-y-3 pt-6 border-t border-white/10">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 font-sans">គ្រប់គ្រងប្រព័ន្ធ (Admin)</div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => { setActiveTab('manage'); setIsMobileFilterOpen(false); }} 
                      className={`w-full py-3 px-4 text-xs font-bold rounded-2xl text-left transition-all cursor-pointer ${activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      គ្រប់គ្រងឯកសារ (Manage Files)
                    </button>
                    <button 
                      onClick={() => { setActiveTab('types'); setIsMobileFilterOpen(false); }} 
                      className={`w-full py-3 px-4 text-xs font-bold rounded-2xl text-left transition-all cursor-pointer ${activeTab === 'types' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      ប្រភេទឯកសារ (Manage Types)
                    </button>
                    <button 
                      onClick={() => { setActiveTab('show'); setIsMobileFilterOpen(false); }} 
                      className={`w-full py-3 px-4 text-xs font-bold rounded-2xl text-left transition-all cursor-pointer ${activeTab === 'show' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      បង្ហាញឯកសារ (Show Files)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      <main className="flex-1 flex flex-col h-screen z-10 overflow-hidden">
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-4 sm:px-10 shrink-0 bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Mobile Menu Icon on the left */}
            <button 
              onClick={() => setIsMobileFilterOpen(true)} 
              className="md:hidden text-slate-400 hover:text-white transition-colors p-2 -ml-2 cursor-pointer select-none"
            >
              <Menu size={24} />
            </button>

            {/* Desktop sidebar expansion trigger */}
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="hidden md:block text-slate-400 hover:text-white transition-colors cursor-pointer mr-2 select-none" title="បើកម៉ឺនុយ">
                <Menu size={20} className="sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Logo/Identity - SHOW name on both mobile and desktop, and keep logo icon on desktop */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="hidden md:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-200 select-none">
                បណ្ណាល័យបឋម
              </h1>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                {user.photoURL && <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />}
                <span className="text-sm font-semibold text-slate-200 hidden sm:inline">{user.displayName || user.email}</span>
              </div>
              <button onClick={logout} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Sign out</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="text-sm font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/30 hover:border-indigo-500/50 transition-all shrink-0">Sign in</button>
          )}
        </header>
        {activeTab === 'manage' && (
          user ? (
            <ManageFilesView user={user} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-slate-900 rounded-3xl border border-white/10 flex items-center justify-center text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">សូមចូលគណនីជាមុនសិន</h3>
                <p className="text-sm text-slate-400 mt-2">ដើម្បីគ្រប់គ្រងឯកសាររបស់អ្នក សូមចូលជាមួយគណនី Google Drive</p>
              </div>
              <button
                id="gsi-manage-signin"
                onClick={handleLogin}
                className="flex items-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 text-sm mx-auto"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )
        )}
        {activeTab === 'types' && <TypesView />}
        {activeTab === 'show' && (
          <ShowFilesView 
            user={user} 
            selectedType={selectedType} 
            setSelectedType={setSelectedType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </main>
    </div>
  );
}
