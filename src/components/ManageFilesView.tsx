import React, { useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { Plus } from 'lucide-react';
import FileManager, { FileManagerRef } from './FileManager';
import Uploader from './Uploader';

export default function ManageFilesView({ user }: { user: User }) {
  const fileManagerRef = useRef<FileManagerRef>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 h-full overflow-y-auto p-4 sm:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">គ្រប់គ្រងឯកសារ</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-2.5 sm:py-3 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all w-full sm:w-auto shadow-md"
        >
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> Upload File
        </button>
      </div>
      
      <FileManager user={user} ref={fileManagerRef} viewMode="list" />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">✕</button>
            <h3 className="text-xl font-bold mb-6 pr-8">Upload File</h3>
            <Uploader onUploadSuccess={() => {
              fileManagerRef.current?.fetchFiles();
              setIsModalOpen(false);
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
