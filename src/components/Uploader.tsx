import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../lib/firebase';
import { FileType } from '../types';
import { Image, X } from 'lucide-react';

interface UploaderProps {
  onUploadSuccess: () => void;
}

export default function Uploader({ onUploadSuccess }: UploaderProps) {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !title) {
      alert('សូមបញ្ចូលចំណងជើង និងជ្រើសរើសឯកសារសម្រាប់បង្ហោះ! (Please enter title and select a file to upload!)');
      return;
    }

    setUploading(true);
    const token = await getAccessToken();
    if (!token) {
      setUploading(false);
      return;
    }

    try {
      let folderId = localStorage.getItem('appFolderId');
      
      if (folderId) {
        const checkResp = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,trashed`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!checkResp.ok) {
          folderId = null;
          localStorage.removeItem('appFolderId');
        } else {
          const checkData = await checkResp.json();
          if (checkData.trashed) {
             folderId = null;
             localStorage.removeItem('appFolderId');
          }
        }
      }

      if (!folderId) {
        // Simple search/create if missing
        const query = 'name="MyAppFiles" and mimeType="application/vnd.google-apps.folder" and trashed=false';
        const searchResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!searchResp.ok) {
            console.error('Error searching for folder');
        } else {
            const searchData = await searchResp.json();
            if (searchData.files && searchData.files.length > 0) {
              folderId = searchData.files[0].id;
            }
        }
        
        if (!folderId) {
          const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'MyAppFiles', mimeType: 'application/vnd.google-apps.folder' }),
          });
          if (!createResp.ok) {
              const errorText = await createResp.text();
              console.error('Error creating folder:', errorText);
          } else {
              const createData = await createResp.json();
              folderId = createData.id;
          }
        }
        if (folderId) localStorage.setItem('appFolderId', folderId);
      }
      
      if (!folderId) {
        throw new Error('Could not find or create app folder.');
      }

      // Upload Cover File first if selected
      let coverId = '';
      if (coverFile) {
        const coverMetadata: any = {
          name: `${title}_cover`,
          properties: { isCover: 'true', parentFile: title }
        };
        if (folderId) coverMetadata.parents = [folderId];

        const boundary = '314159265358979323846';
        const coverDelimiter = `\r\n--${boundary}\r\n`;
        const coverCloseDelimiter = `\r\n--${boundary}--`;

        const coverMultipartBody = new Blob([
          `--${boundary}\r\n`,
          `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
          JSON.stringify(coverMetadata),
          coverDelimiter,
          `Content-Type: ${coverFile.type || 'image/jpeg'}\r\n\r\n`,
          coverFile,
          coverCloseDelimiter
        ], { type: `multipart/related; boundary=${boundary}` });

        const coverResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: coverMultipartBody,
        });

        if (coverResponse.ok) {
          const coverData = await coverResponse.json();
          coverId = coverData.id;

          // Set cover file permissions to anyone "reader"
          try {
            await fetch(`https://www.googleapis.com/drive/v3/files/${coverId}/permissions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ role: 'reader', type: 'anyone' })
            });
          } catch (permErr) {
            console.error('Error setting cover permission:', permErr);
          }
        } else {
          const errText = await coverResponse.text();
          console.error('Cover upload failed:', errText);
          if (coverResponse.status === 404 && errText.includes('File not found')) {
              localStorage.removeItem('appFolderId');
          }
        }
      }

      // Now prepare Main File upload
      const properties: any = { type: selectedType, subType: selectedSubType };
      if (coverId) {
        properties.coverId = coverId;
      }

      const metadata: any = { name: title, properties };
      if (folderId) metadata.parents = [folderId];

      const boundary = '314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody = new Blob([
        `--${boundary}\r\n`,
        `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
        JSON.stringify(metadata),
        delimiter,
        `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
        file,
        closeDelimiter
      ], { type: `multipart/related; boundary=${boundary}` });

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Drive API Error:', errorText);
        if (response.status === 404 && errorText.includes('File not found')) {
            localStorage.removeItem('appFolderId');
        }
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();
      const uploadedFileId = responseData.id;

      if (uploadedFileId) {
        try {
          // Make file public ("anyone with link can read")
          const permResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFileId}/permissions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              role: 'reader',
              type: 'anyone'
            })
          });
          if (!permResponse.ok) {
            console.error('Failed to set public permissions on upload:', await permResponse.text());
          }
        } catch (permErr) {
          console.error('Error sharing uploaded file:', permErr);
        }
      }

      alert('ឯកសារត្រូវបានបង្ហោះ និងដាក់ជាសាធារណៈរួចរាល់ហើយ! (File uploaded and shared publicly!)');
      setTitle('');
      setSelectedType('');
      setSelectedSubType('');
      setCoverFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (coverInputRef.current) coverInputRef.current.value = '';
      onUploadSuccess();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      let errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('403') || errorMsg.includes('insufficient')) {
        errorMsg += '\n\nសូម Logout រួច Login សារជាថ្មី ហើយកុំភ្លេចធីកប្រអប់ (Check box) អនុញ្ញាតឲ្យ Google Drive ។ (Please logout and login again, ensuring you check the Drive permission box).';
      }
      alert(`Error uploading file:\n${errorMsg}`);
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
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="hidden" 
          />
          
          <div 
            onClick={() => coverInputRef.current?.click()}
            className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed border-white/20 hover:border-indigo-500 bg-slate-950/45 hover:bg-slate-950/60 transition-all cursor-pointer flex flex-col items-center justify-center group"
          >
            {coverFile ? (
              <>
                <img 
                  src={URL.createObjectURL(coverFile)} 
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
      
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-sans">ឯកសារចម្បង (Main File)</label>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition-all cursor-pointer" 
        />
      </div>
      
      <button 
        onClick={handleUpload} 
        disabled={uploading}
        className="bg-indigo-600 hover:bg-indigo-500 py-3.5 px-6 rounded-2xl text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
      >
        {uploading ? 'កំពុងបង្ហោះម៉ែត្រ... (Uploading...)' : 'បង្ហោះឯកសារ (Upload)'}
      </button>
    </div>
  );
}
