import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { logout, db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, increment, getDocs, query, orderBy } from 'firebase/firestore';
import { Eye, EyeOff, Edit2, Trash2, Check, X, Search, Filter, RotateCcw, Download, Lock, Unlock, Image } from 'lucide-react';
import { useFileTypes } from '../hooks/useFileTypes';

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  shared?: boolean;
  properties?: {
    type?: string;
    subType?: string;
    coverId?: string;
  };
}

export interface FileManagerRef {
  fetchFiles: () => void;
}

const renderThumbnail = (
  file: FileItem,
  user: User | null = null,
  handleTogglePermission?: (file: FileItem) => void,
  togglingPermissionId?: string | null,
  isMini: boolean = false
) => {
  let baseElement;

  if (file.id === 'mock-1') {
    if (isMini) {
      baseElement = (
        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center font-bold text-[9px] text-orange-700">
          វានែក
        </div>
      );
    } else {
      baseElement = (
        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 p-4 flex flex-col justify-between border border-orange-200 shadow-sm relative overflow-hidden select-none">
          {/* Double-border outer frame matching the screenshot */}
          <div className="absolute inset-1.5 border border-orange-300 rounded-lg pointer-events-none opacity-40"></div>
          
          {/* Upper Card */}
          <div className="bg-white border-2 border-orange-500 rounded-xl p-2 flex items-center justify-center shadow-sm flex-1 mb-2 relative">
            <div className="absolute top-1 left-2 text-[7px] text-orange-400 font-sans font-bold tracking-widest scale-75 origin-top-left">មេរៀន ៖ វានែក</div>
            <span className="text-xl sm:text-2xl font-black text-orange-600 font-sans tracking-tight">វានែក</span>
          </div>

          {/* Lower Card */}
          <div className="bg-white border-2 border-yellow-400 rounded-xl p-2 flex items-center justify-center shadow-sm flex-1 relative">
            <div className="absolute top-1 left-2 text-[7px] text-yellow-500 font-sans font-bold tracking-widest scale-75 origin-top-left">មេរៀន ៖ ក្ស័យ</div>
            <span className="text-xl sm:text-2xl font-black text-yellow-600 font-sans tracking-tight">ក្ស័យ</span>
          </div>
        </div>
      );
    }
  } else if (file.id === 'mock-2') {
    if (isMini) {
      baseElement = (
        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center font-bold text-[9px] text-blue-700">
          វិធីបូក
        </div>
      );
    } else {
      baseElement = (
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 p-4 flex flex-col justify-between border border-blue-200 shadow-sm relative overflow-hidden select-none">
          {/* Double-border outer frame */}
          <div className="absolute inset-1.5 border border-blue-300 rounded-lg pointer-events-none opacity-40"></div>
          
          {/* Upper Card */}
          <div className="bg-white border-2 border-blue-500 rounded-xl p-2 flex items-center justify-center shadow-sm flex-1 mb-2 relative">
            <div className="absolute top-1 left-2 text-[7px] text-blue-400 font-sans font-bold tracking-widest scale-75 origin-top-left">មេរៀន ៖ វិធីបូក</div>
            <span className="text-xl sm:text-2xl font-black text-blue-600 font-sans tracking-tight">វិធីបូក</span>
          </div>

          {/* Lower Card */}
          <div className="bg-white border-2 border-indigo-400 rounded-xl p-2 flex items-center justify-center shadow-sm flex-1 relative">
            <div className="absolute top-1 left-2 text-[7px] text-indigo-500 font-sans font-bold tracking-widest scale-75 origin-top-left">មេរៀន ៖ វិធីដក</div>
            <span className="text-xl sm:text-2xl font-black text-indigo-600 font-sans tracking-tight">វិធីដក</span>
          </div>
        </div>
      );
    }
  } else if (file.properties?.coverId) {
    const highResUrl = `https://drive.google.com/thumbnail?id=${file.properties.coverId}&sz=w800`;
    baseElement = (
      <img 
        src={highResUrl} 
        alt={file.name} 
        className="w-full h-full object-cover shadow-inner" 
        referrerPolicy="no-referrer"
      />
    );
  } else if (file.thumbnailLink) {
    const highResUrl = isMini ? file.thumbnailLink : file.thumbnailLink.replace(/=s\d+$/, '=s800');
    baseElement = (
      <img 
        src={highResUrl} 
        alt={file.name} 
        className="w-full h-full object-cover shadow-inner" 
        referrerPolicy="no-referrer"
      />
    );
  } else {
    const ext = file.mimeType.split('/')[1]?.toUpperCase() || 'FILE';
    const isPdf = file.mimeType.includes('pdf');
    if (isMini) {
      baseElement = (
        <div className={`w-full h-full flex flex-col items-center justify-center font-bold text-[9px] line-clamp-1 truncate ${
          isPdf ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'
        }`}>
          {ext}
        </div>
      );
    } else {
      baseElement = (
        <div className={`w-full h-full flex flex-col justify-between p-4 relative overflow-hidden ${
          isPdf 
            ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 text-red-400' 
            : 'bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 text-indigo-400'
        }`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-current/5 rounded-full blur-xl pointer-events-none" />
          <div className="font-mono text-[9px] tracking-wider opacity-60 font-semibold">{ext} DOCUMENT</div>
          <div className="flex flex-col gap-1">
            <svg className="w-7 h-7 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-[9px] uppercase font-bold tracking-widest opacity-40 mt-1">FLASHCARD BOOK</span>
          </div>
        </div>
      );
    }
  }

  const isMock = file.id.startsWith('mock-');
  const isPublic = isMock || file.shared;
  const isToggling = togglingPermissionId === file.id;

  if (isMini) {
    return (
      <div className="relative w-full h-full overflow-hidden rounded-xl">
        {baseElement}
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden group shadow-md border border-white/5">
      {baseElement}
    </div>
  );
};

export default forwardRef<FileManagerRef, { 
  user: User | null; 
  viewMode?: 'list' | 'grid';
  selectedType?: string;
  setSelectedType?: (type: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}>(({ 
  user, 
  viewMode = 'list', 
  selectedType: propSelectedType, 
  setSelectedType: propSetSelectedType,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery
}, ref) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hiddenFiles, setHiddenFiles] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('hidden_files_sync');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hidden_files_sync', JSON.stringify(Array.from(hiddenFiles)));
    } catch (e) {
      console.error('Error saving hidden files:', e);
    }
  }, [hiddenFiles]);

  // Search and filter states
  const [searchQueryLocal, setSearchQueryLocal] = useState('');
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : searchQueryLocal;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setSearchQueryLocal;
  const [selectedTypeLocal, setSelectedTypeLocal] = useState('');
  const selectedType = propSelectedType !== undefined ? propSelectedType : selectedTypeLocal;
  const setSelectedType = propSetSelectedType !== undefined ? propSetSelectedType : setSelectedTypeLocal;
  const [selectedSubType, setSelectedSubType] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modern dialog and alert replacement states
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>('');
  const [editingDriveLink, setEditingDriveLink] = useState<string>('');
  const [editingType, setEditingType] = useState<string>('');
  const [editingSubType, setEditingSubType] = useState<string>('');
  const [editNewFile, setEditNewFile] = useState<File | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const editCoverInputRef = React.useRef<HTMLInputElement>(null);
  const { fileTypes } = useFileTypes();

  const [deletingFile, setDeletingFile] = useState<FileItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('download_counts_backup');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const filterHiddenFn = (f: FileItem) => {
    if (viewMode === 'grid') {
      return !hiddenFiles.has(f.id);
    }
    return true;
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'file_stats'), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach(doc => {
        counts[doc.id] = doc.data().downloadCount || 0;
      });
      setDownloadCounts(prev => {
        const merged = { ...prev, ...counts };
        localStorage.setItem('download_counts_backup', JSON.stringify(merged));
        return merged;
      });
    }, (err) => {
      console.error('Failed to snapshot file_stats:', err);
    });
    return () => unsub();
  }, []);

  const handleDownloadClick = async (fileId: string) => {
    // 1. Immediately update local state & localStorage backup for instant client-side feedback
    setDownloadCounts(prev => {
      const updatedValue = (prev[fileId] || 0) + 1;
      const updated = { ...prev, [fileId]: updatedValue };
      localStorage.setItem('download_counts_backup', JSON.stringify(updated));
      return updated;
    });

    // 2. Persist safely to Firestore database
    try {
      const docRef = doc(db, 'file_stats', fileId);
      await setDoc(docRef, {
        id: fileId,
        downloadCount: increment(1),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error: any) {
      console.warn('Silent fallback for Firestore download count update (client offline):', error);
    }
  };

  const [isPublishingAll, setIsPublishingAll] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState('');
  const [togglingPermissionId, setTogglingPermissionId] = useState<string | null>(null);

  const handleTogglePermission = async (file: FileItem) => {
    // Obsolete: Drive links are handled manually now
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFile) return;
    const { id, name } = deletingFile;
    setDeletingFile(null);

    try {
      await import('firebase/firestore').then(({ deleteDoc, doc }) => deleteDoc(doc(db, 'files', id)));
      setSuccessMessage(`ឯកសារ "${name}" ត្រូវបានលុបដោយជោគជ័យ។`);
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setErrorMessage(`ការលុបឯកសារមិនបានជោគជ័យ៖ ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingFile || !editingFileName || !editingFileName.trim()) return;
    const { id } = editingFile;
    const newName = editingFileName.trim();

    setLoading(true);
    setEditingFile(null);

    try {
      let currentCoverBase64 = editingFile.thumbnailLink || '';

      if (editCoverFile) {
         currentCoverBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(editCoverFile);
            reader.onload = (event) => {
              const img = new window.Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/webp', 0.6));
              };
            };
         });
      }

      await import('firebase/firestore').then(({ updateDoc, doc }) => updateDoc(doc(db, 'files', id), {
         title: newName,
         driveLink: editingDriveLink,
         type: editingType,
         subType: editingSubType,
         ...(editCoverFile ? { coverImage: currentCoverBase64 } : {})
      }));

      setSuccessMessage(`បានកែសម្រួលព័ត៌មានឯកសាររដោយជោគជ័យ។`);
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchFiles();
    } catch (error) {
      console.error('Error updating file:', error);
      setErrorMessage(`ការកែសម្រួលព័ត៌មានឯកសារមិនបានជោគជ័យ៖ ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    // No-op. Real-time updates handled by useEffect.
  };

  useEffect(() => {
    // 1. Optimistic rendering (Offline-first approach)
    const cached = localStorage.getItem('cachedFileList');
    if (cached) {
      try {
        setFiles(JSON.parse(cached));
      } catch (e) {
        console.error('Error parsing cached file list:', e);
      }
    } else {
      setLoading(true);
    }

    const q = collection(db, 'files');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedFiles = snapshot.docs.map(doc => ({
           id: doc.id,
           name: doc.data().title || '',
           mimeType: 'application/pdf',
           webViewLink: doc.data().driveLink || '',
           webContentLink: doc.data().driveLink || '',
           thumbnailLink: doc.data().coverImage || '',
           properties: {
             type: doc.data().type || '',
             subType: doc.data().subType || '',
             coverId: ''
           },
           createdAt: doc.data().createdAt ? (doc.data().createdAt.toMillis ? doc.data().createdAt.toMillis() : new Date(doc.data().createdAt).getTime()) : 0,
           shared: true
      }));

      // Sort locally by createdAt descending
      fetchedFiles.sort((a, b) => b.createdAt - a.createdAt);

      setFiles(fetchedFiles);
      localStorage.setItem('cachedFileList', JSON.stringify(fetchedFiles));
      setLoading(false);
    }, (error) => {
       console.error('Error fetching files:', error);
       setErrorMessage(`មិនអាចទាញយកទិន្នន័យបានទេ: ${error.message}`);
       setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useImperativeHandle(ref, () => ({
    fetchFiles,
  }));

  const visibleFiles = files.filter(f => {
    if (viewMode === 'grid' && hiddenFiles.has(f.id)) return false;
    
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      if (!f.name.toLowerCase().includes(query)) return false;
    }
    
    // Type filter
    if (selectedType) {
      if (f.properties?.type !== selectedType) return false;
    }
    
    // SubType filter
    if (selectedSubType) {
      if (f.properties?.subType !== selectedSubType) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 flex-1">

      {/* Dynamic Sub-type Pills card if Type is selected */}
      {selectedType && fileTypes.find(t => t.name === selectedType)?.subTypes?.length > 0 && (
        <div className="bg-[#111223]/80 backdrop-blur-md border border-white/5 rounded-[32px] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ជម្រើសថ្នាក់ ឬប្រភេទរង (Sub-types):</span>
              {selectedSubType && (
                <button
                  onClick={() => setSelectedSubType('')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                >
                  ជម្រះថ្នាក់ (Clear Sub-type)
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 pl-2 border-l-2 border-indigo-500/30 py-0.5 animate-fadeIn">
              <button
                onClick={() => setSelectedSubType('')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  !selectedSubType
                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                ទាំងអស់ ({files.filter(f => filterHiddenFn(f) && f.properties?.type === selectedType).length})
              </button>
              {(fileTypes.find(t => t.name === selectedType)?.subTypes || []).map((subItem: string) => {
                const count = files.filter(f => filterHiddenFn(f) && f.properties?.type === selectedType && f.properties?.subType === subItem).length;
                return (
                  <button
                    key={subItem}
                    onClick={() => setSelectedSubType(subItem)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      selectedSubType === subItem
                        ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {subItem} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="p-0 sm:p-6">
        {loading ? <div className="text-slate-400">Loading files...</div> : (
          viewMode === 'list' ? (
            <div className="flex flex-col gap-3">
              {visibleFiles.map(file => (
                <div key={file.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full overflow-hidden">
                   {/* Left: Thumbnail & Name container */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 uppercase font-bold text-xs shrink-0 overflow-hidden relative">
                      {renderThumbnail(file, user, handleTogglePermission, togglingPermissionId, true)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold truncate text-slate-100" title={file.name}>{file.name}</span>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-sans">
                        <span>ទាញយក៖ <span className="text-indigo-400 font-bold">{downloadCounts[file.id] || 0}</span> ដង</span>
                      </div>
                    </div>
                  </div>
                  {/* Right: Actions Container */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t border-white/5 pt-3 sm:pt-0 sm:border-none w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        setHiddenFiles(prev => {
                          const next = new Set(prev);
                          if (next.has(file.id)) next.delete(file.id);
                          else next.add(file.id);
                          return next;
                        });
                      }} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Hide/Unhide">
                        {hiddenFiles.has(file.id) ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                      <button onClick={() => {
                        setEditingFile(file);
                        setEditingFileName(file.name);
                        setEditingDriveLink(file.webViewLink || '');
                        setEditingType(file.properties?.type || '');
                        setEditingSubType(file.properties?.subType || '');
                        setEditNewFile(null);
                        setEditCoverFile(null);
                      }} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Rename">
                        <Edit2 size={16}/>
                      </button>
                      <button onClick={() => setDeletingFile(file)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Delete">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                    <a 
                      href={file.webContentLink || file.webViewLink || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={() => handleDownloadClick(file.id)}
                      className="px-4 py-2 text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      ទាញយក
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {(() => {
                // Group the files by type
                const groups: { name: string; files: FileItem[] }[] = [];
                
                // 1. Initialise the defined fileTypes in order
                fileTypes.forEach(t => {
                  groups.push({ name: t.name, files: [] });
                });
                
                // 2. Add "ផ្សេងៗ"
                const otherGroupIndex = groups.push({ name: 'ផ្សេងៗ (Others)', files: [] }) - 1;
                
                // 3. Put files into corresponding groups
                visibleFiles.forEach(file => {
                  const fileType = file.properties?.type;
                  const targetGroup = groups.find(g => g.name === fileType);
                  if (targetGroup) {
                    targetGroup.files.push(file);
                  } else {
                    groups[otherGroupIndex].files.push(file);
                  }
                });
                
                // 4. Filter out empty groups so we only show groups with files
                const activeGroups = groups.filter(g => g.files.length > 0);
                
                if (activeGroups.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 border border-white/5 bg-[#111223]/30 rounded-[32px] font-sans">
                      មិនមានឯកសារទេ (No files found)
                    </div>
                  );
                }
                
                return activeGroups.map(group => (
                  <div key={group.name} className="space-y-4">
                    {/* Header for Group */}
                    <div className="flex items-center gap-3 pb-2 border-b border-indigo-500/10">
                      <div className="h-6 w-2 bg-indigo-500 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full" />
                      <h4 className="text-base font-black text-slate-100 font-sans tracking-wide">
                        {group.name}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 font-sans">
                        {group.files.length} ឯកសារ
                      </span>
                    </div>
                    
                    {/* Files Grid for Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                      {group.files.map(file => (
                        <div key={file.id} className="bg-[#111223]/90 backdrop-blur-md border border-white/5 rounded-[32px] p-5 hover:bg-[#15162a] transition-all duration-300 flex flex-col gap-4 shadow-xl">
                          <a 
                            href={file.webContentLink || file.webViewLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={() => handleDownloadClick(file.id)}
                            className="block group overflow-hidden rounded-[24px] cursor-pointer"
                          >
                            <div className="transition-transform duration-300 group-hover:scale-[1.02]" onClick={(e) => {
                              if (e.target instanceof HTMLElement && e.target.closest('button')) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}>
                              {renderThumbnail(file, user, handleTogglePermission, togglingPermissionId, false)}
                            </div>
                          </a>
                          <div className="flex flex-col gap-2 flex-1 justify-between">
                            <span className="text-sm sm:text-[15px] font-semibold text-slate-100 leading-snug break-words line-clamp-2" title={file.name}>
                              {file.name}
                            </span>
                            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
                              <div className="flex items-center justify-between">
                                  <a 
                                    href={file.webContentLink || file.webViewLink || '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={() => handleDownloadClick(file.id)}
                                    className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5 animate-pulse"
                                  >
                                    <Download size={15} />
                                    ទាញយក
                                  </a>
                                <span className="text-[11px] text-slate-400 font-sans">
                                  ទាញយក៖ <span className="text-indigo-400 font-bold">{downloadCounts[file.id] || 0}</span> ដង
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deletingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setDeletingFile(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-lg font-bold text-white mb-2">លុបឯកសារ</h3>
            <p className="text-sm text-slate-300 mb-6">
              តើអ្នកពិតជានឹងលុបឯកសារ <span className="font-semibold text-indigo-400">"{deletingFile.name}"</span> មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានឡើយ។
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeletingFile(null)}
                className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-semibold transition-all"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
              >
                លុបចេញ (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Edit file name Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative my-8">
            <button onClick={() => setEditingFile(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-xl font-bold text-white mb-6">កែសម្រួលព័ត៌មានឯកសារ (Edit File)</h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">ឈ្មោះឯកសារ (Title)</label>
                <input
                  type="text"
                  value={editingFileName}
                  onChange={(e) => setEditingFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">តំណភ្ជាប់ Google Drive (Drive Link)</label>
                <input
                  type="text"
                  value={editingDriveLink}
                  onChange={(e) => setEditingDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">ប្រភេទ (Type)</label>
                <select
                  value={editingType}
                  onChange={(e) => {
                    setEditingType(e.target.value);
                    setEditingSubType('');
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                >
                  <option value="">ជ្រើសរើសប្រភេទ (Select Type)</option>
                  {fileTypes.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {editingType && fileTypes.find(t => t.name === editingType) && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2">ប្រភេទរង (Sub-type)</label>
                  <select
                    value={editingSubType}
                    onChange={(e) => setEditingSubType(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="">ជ្រើសរើសប្រភេទរង (Select Sub-type)</option>
                    {(fileTypes.find(t => t.name === editingType)?.subTypes || []).map((st: string) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2 font-bold font-sans">រូបភាពគម្រប (Cover Image - ទម្រង់ 4:3)</label>
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={editCoverInputRef}
                    accept="image/*"
                    onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div 
                    onClick={() => editCoverInputRef.current?.click()}
                    className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed border-white/20 hover:border-indigo-500 bg-slate-950/45 hover:bg-slate-950/60 transition-all cursor-pointer flex flex-col items-center justify-center group"
                  >
                    {editCoverFile ? (
                      <>
                        <img 
                          src={URL.createObjectURL(editCoverFile)} 
                          alt="New Cover Preview" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs bg-slate-900/90 px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 border border-white/10 shadow-lg select-none">
                            <Image size={14} /> ផ្លាស់ប្តូររូបភាព (Change Cover)
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCoverFile(null);
                            if (editCoverInputRef.current) editCoverInputRef.current.value = '';
                          }}
                          className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full cursor-pointer transition-colors z-10 hover:scale-105 active:scale-95"
                          title="លុបចោលការផ្លាស់ប្តូរ (Cancel Cover Change)"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : editingFile.thumbnailLink ? (
                      <>
                        <img 
                          src={editingFile.thumbnailLink} 
                          alt="Current Cover" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs bg-slate-900/90 px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 border border-white/10 shadow-lg select-none">
                            <Image size={14} /> ប្តូររូបភាពគម្រប (Replace Cover)
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md font-sans">
                          រូបភាពបច្ចុប្បន្ន (Current Cover)
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 flex flex-col items-center gap-2.5 select-none text-slate-400 group-hover:text-indigo-400 transition-colors">
                        <div className="p-4 rounded-full bg-white/5 border border-white/10 group-hover:bg-indigo-600/10 group-hover:border-indigo-500/20 transition-all">
                          <Image size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold font-sans">ជ្រើសរើសរូបភាពគម្រប (4:3)</p>
                          <p className="text-[10px] text-slate-500">ចុចលើប្រអប់នេះដើម្បីបញ្ចូលរូបភាព (Click to select cover)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => setEditingFile(null)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-semibold transition-all"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={!editingFileName || !editingFileName.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
                >
                  <Check size={16} /> រក្សាទុក (Save)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-[120] bg-green-500/20 border border-green-500/30 backdrop-blur-lg text-green-300 font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 transition-all duration-300 animate-bounce text-sm">
          <Check size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Toast */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[120] bg-red-500/20 border border-red-500/30 backdrop-blur-lg text-red-300 font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 transition-all duration-300 animate-bounce text-sm">
          <X size={18} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
});
