import React, { useState, useEffect } from 'react';
import { getAccessToken, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { FileType } from '../types';
import { Image, X } from 'lucide-react';

interface UploaderProps {
  onUploadSuccess: () => void;
}

export default function Uploader({ onUploadSuccess }: UploaderProps) {
  const [title, setTitle] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverBase64, setCoverBase64] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fileTypes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized: FileType[] = parsed.map((item: any) => {
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
        console.error('Error parsing file types in Uploader:', e);
      }
    }
  }, []);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);

    // Compress to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
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
        const dataUrl = canvas.toDataURL('image/webp', 0.6); // Compress
        setCoverBase64(dataUrl);
      };
    };
  };

  const handleUpload = async () => {
    if (!driveLink || !title || !selectedType) {
      alert('សូមបញ្ចូលចំណងជើង តំណភ្ជាប់ Drive និងជ្រើសរើសប្រភេទ! (Please enter title, Drive link and select type!)');
      return;
    }

    setUploading(true);

    try {
      // 1. Generate new id using Firestore
      const docRef = doc(collection(db, 'files'));

      // 2. Save directly to Firestore
      await setDoc(docRef, {
        title,
        driveLink,
        type: selectedType,
        subType: selectedSubType,
        coverImage: coverBase64,
        createdAt: serverTimestamp(),
      });

      alert('ឯកសារត្រូវបានរក្សាទុករួចរាល់ហើយ! (File saved successfully!)');
      setTitle('');
      setDriveLink('');
      setSelectedType('');
      setSelectedSubType('');
      setCoverFile(null);
      setCoverBase64('');
      if (coverInputRef.current) coverInputRef.current.value = '';
      onUploadSuccess();
    } catch (error: any) {
      console.error('Error saving file data:', error);
      alert(`Error saving file:\n${error instanceof Error ? error.message : error}`);
    } finally {
      setUploading(false);
    }
  };

  const currentType = fileTypes.find(t => t.name === selectedType);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">ឈ្មោះឯកសារ (Title)</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Title" 
          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500" 
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">តំណភ្ជាប់ Google Drive (Drive Link)</label>
        <input 
          type="text" 
          value={driveLink} 
          onChange={(e) => setDriveLink(e.target.value)} 
          placeholder="https://drive.google.com/file/d/..." 
          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500" 
        />
      </div>
      
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">ជ្រើសរើសប្រភេទ (Category)</label>
        <select 
          value={selectedType} 
          onChange={(e) => { setSelectedType(e.target.value); setSelectedSubType(''); }} 
          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
        >
          <option value="">ជ្រើសរើសប្រភេទ (Select Type)</option>
          {fileTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>
      </div>

      {currentType && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">ជ្រើសរើសប្រភេទរង (Sub-category)</label>
          <select 
            value={selectedSubType} 
            onChange={(e) => setSelectedSubType(e.target.value)} 
            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
          >
            <option value="">ជ្រើសរើសប្រភេទរង (Select Sub-type)</option>
            {(currentType.subTypes || []).map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-sans font-bold">រូបភាពគម្រប (Cover Image - ទម្រង់ 4:3)</label>
        <div className="space-y-3">
          <input 
            type="file" 
            ref={coverInputRef} 
            accept="image/*" 
            onChange={handleCoverChange}
            className="hidden" 
          />
          
          <div 
            onClick={() => coverInputRef.current?.click()}
            className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed border-white/20 hover:border-indigo-500 bg-slate-950/45 hover:bg-slate-950/60 transition-all cursor-pointer flex flex-col items-center justify-center group"
          >
            {coverBase64 ? (
              <>
                <img 
                  src={coverBase64} 
                  alt="Cover Preview" 
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
                    setCoverFile(null);
                    setCoverBase64('');
                    if (coverInputRef.current) coverInputRef.current.value = '';
                  }}
                  className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full cursor-pointer transition-colors z-10 hover:scale-105 active:scale-95"
                  title="លុបគម្រប (Remove Cover)"
                >
                  <X size={15} />
                </button>
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
      
      <button 
        onClick={handleUpload} 
        disabled={uploading}
        className="bg-indigo-600 hover:bg-indigo-500 py-3.5 px-6 rounded-2xl text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
      >
        {uploading ? 'កំពុងរក្សាទុក... (Saving...)' : 'រក្សាទុក (Save)'}
      </button>
    </div>
  );
}
