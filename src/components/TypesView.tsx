import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, GripVertical, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { FileType } from '../types';
import { useFileTypes } from '../hooks/useFileTypes';
import { db } from '../lib/firebase';

interface FileItem {
  id: string;
  name: string;
  properties?: {
    type?: string;
    subType?: string;
  };
}

export default function TypesView() {
  const { fileTypes: types, saveFileTypes: saveTypes } = useFileTypes();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [newType, setNewType] = useState('');
  const [newSubType, setNewSubType] = useState<Record<number, string>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Load file list to find links/attachments
    const cachedFiles = localStorage.getItem('cachedFileList');
    if (cachedFiles) {
      try {
        const parsed = JSON.parse(cachedFiles);
        if (Array.isArray(parsed)) {
          setFiles(parsed);
        }
      } catch (e) {
        console.error('Error parsing cached file list:', e);
      }
    }
  }, []);

  const getFilesForType = (typeName: string) => {
    return files.filter(f => f.properties?.type === typeName);
  };

  const getFilesForSubType = (typeName: string, subTypeName: string) => {
    return files.filter(f => f.properties?.type === typeName && f.properties?.subType === subTypeName);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...types];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    saveTypes(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...types];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    saveTypes(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === types.length - 1) return;
    const updated = [...types];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    saveTypes(updated);
  };

  const handleAddType = () => {
    if (newType.trim()) {
      saveTypes([...types, { name: newType.trim(), subTypes: [] }]);
      setNewType('');
    }
  };

  const handleAddSubType = (typeIndex: number) => {
    const subTypeName = newSubType[typeIndex];
    if (subTypeName && subTypeName.trim()) {
      const updated = [...types];
      const current = updated[typeIndex];
      const currentSubTypes = Array.isArray(current.subTypes) ? current.subTypes : [];
      current.subTypes = [...currentSubTypes, subTypeName.trim()];
      saveTypes(updated);
      setNewSubType({ ...newSubType, [typeIndex]: '' });
    }
  };

  const handleDeleteType = (index: number) => {
    const typeName = types[index].name;
    const attachedFiles = getFilesForType(typeName);
    if (attachedFiles.length > 0) {
      alert(`មិនអាចលុបប្រភេទ "${typeName}" បានទេ ព្រោះមានឯកសារភ្ជាប់ចំនួន ${attachedFiles.length} ឯកសារ!\n\nCannot delete category "${typeName}" because it has ${attachedFiles.length} files attached.`);
      return;
    }
    saveTypes(types.filter((_, i) => i !== index));
  };

  const handleDeleteSubType = (typeIndex: number, subTypeIndex: number) => {
    const typeName = types[typeIndex].name;
    const currentSubTypes = Array.isArray(types[typeIndex].subTypes) ? [...types[typeIndex].subTypes] : [];
    const subTypeName = currentSubTypes[subTypeIndex];
    const attachedFiles = getFilesForSubType(typeName, subTypeName);
    
    if (attachedFiles.length > 0) {
      alert(`មិនអាចលុបប្រភេទរង "${subTypeName}" នៃក្រុម "${typeName}" បានទេ ព្រោះមានឯកសារភ្ជាប់ចំនួន ${attachedFiles.length} ឯកសារ!\n\nCannot delete sub-category "${subTypeName}" because it has ${attachedFiles.length} files attached.`);
      return;
    }

    const updated = [...types];
    currentSubTypes.splice(subTypeIndex, 1);
    updated[typeIndex].subTypes = currentSubTypes;
    saveTypes(updated);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(types[index].name);
  };

  const saveEdit = (index: number) => {
    const updated = [...types];
    const oldName = updated[index].name;
    const newName = editValue.trim();

    if (oldName !== newName) {
      updated[index].name = newName;
      saveTypes(updated);

      const attachedFiles = getFilesForType(oldName);
      if (attachedFiles.length > 0) {
        import('firebase/firestore').then(async ({ doc, updateDoc }) => {
          for (const file of attachedFiles) {
            try {
               await updateDoc(doc(db, 'files', file.id), {
                  type: newName
               });
            } catch (e) {
               console.error('Failed to update file category', e);
            }
          }
        });
      }
    }
    
    setEditingIndex(null);
  };

  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8 flex-1 overflow-y-auto">
      <h2 className="text-xl sm:text-2xl font-bold font-sans">គ្រប់គ្រងប្រភេទឯកសារ (Manage file categories/types)</h2>

      <div className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-3xl flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input 
          type="text" 
          value={newType} 
          onChange={(e) => setNewType(e.target.value)}
          placeholder="បញ្ចូលប្រភេទឯកសារថ្មី"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button onClick={handleAddType} className="bg-indigo-600 hover:bg-indigo-500 py-3 sm:py-4 px-6 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors">
          <Plus size={18} /> បន្ថែម
        </button>
      </div>

      <div className="space-y-4">
        {types.map((type, index) => {
          const typeAttachedCount = getFilesForType(type.name).length;
          return (
            <div 
              key={index}
              draggable={editingIndex !== index}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-200 ${
                draggedIndex === index ? 'opacity-40 scale-[0.98] border-dashed border-indigo-500 bg-indigo-500/5' : ''
              }`}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                  {/* Drag Grip Handle */}
                  <div 
                    className="p-1 cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing transition-colors"
                    title="អូសដើម្បីផ្លាស់ប្ដូរទីតាំង (Drag to reorder)"
                  >
                    <GripVertical size={16} />
                  </div>

                  <button onClick={() => setExpandedIndex(expandedIndex === index ? null : index)} className="p-1 text-slate-400 cursor-pointer hover:text-white transition-colors">
                    {expandedIndex === index ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  {editingIndex === index ? (
                    <input 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-white/10 border border-white/10 rounded-xl p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit(index);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-100">{type.name}</span>
                      {typeAttachedCount > 0 && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg font-bold inline-flex items-center gap-1">
                          <FileText size={11} className="text-indigo-400" />
                          {typeAttachedCount} ឯកសារ
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions & Ordering Controllers */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {editingIndex !== index && (
                    <div className="flex items-center gap-0.5 border-r border-white/15 pr-1.5 sm:pr-2.5 mr-1.5 sm:mr-2.5">
                      <button 
                        onClick={() => handleMoveUp(index)} 
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                        title="ឡើងលើ (Move Up)"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button 
                        onClick={() => handleMoveDown(index)} 
                        disabled={index === types.length - 1}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                        title="ចុះក្រោម (Move Down)"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>
                  )}

                  {editingIndex === index ? (
                    <>
                      <button onClick={() => saveEdit(index)} className="p-2 text-green-400 hover:text-white cursor-pointer" title="រក្សាទុក (Save)"><Check size={18} /></button>
                      <button onClick={() => setEditingIndex(null)} className="p-2 text-red-400 hover:text-white cursor-pointer" title="បោះបង់ (Cancel)"><X size={18} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(index)} className="p-2 text-slate-400 hover:text-white cursor-pointer hover:bg-white/5 rounded-lg transition-all" title="កែសម្រួល (Edit)"><Edit2 size={18} /></button>
                      <button 
                        onClick={() => handleDeleteType(index)} 
                        className={`p-2 transition-all rounded-lg ${
                          typeAttachedCount > 0 
                            ? 'text-slate-650 cursor-not-allowed opacity-40 hover:bg-transparent' 
                            : 'text-slate-400 hover:text-red-400 cursor-pointer hover:bg-white/5'
                        }`}
                        title={typeAttachedCount > 0 ? "មិនអាចលុបប្រភេទនេះបានទេ ព្រោះមានឯកសារភ្ជាប់ (Has attached files, cannot delete)" : "លុប (Delete)"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {expandedIndex === index && (
                <div className="p-4 pt-0 pl-8 sm:pl-16 space-y-4 border-t border-white/5 bg-slate-950/20">
                  {/* List of Sub-types */}
                  <div className="space-y-2.5 pt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">ប្រភេទរង (Sub-categories):</span>
                    {type.subTypes && type.subTypes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {type.subTypes.map((subType, subIndex) => {
                          const subFiles = getFilesForSubType(type.name, subType);
                          const hasSubFiles = subFiles.length > 0;
                          return (
                            <div key={subIndex} className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-2">
                              <div className="flex justify-between items-center text-sm text-slate-300">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-200">{subType}</span>
                                  {hasSubFiles && (
                                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2 py-0.5 rounded-lg font-bold font-mono">
                                      {subFiles.length} ឯកសារ
                                    </span>
                                  )}
                                </div>
                                <button 
                                  onClick={() => handleDeleteSubType(index, subIndex)} 
                                  className={`p-1.5 transition-colors rounded-lg ${
                                    hasSubFiles 
                                      ? 'text-slate-650 cursor-not-allowed opacity-40' 
                                      : 'text-slate-400 hover:text-red-400 cursor-pointer hover:bg-white/5'
                                  }`}
                                  title={hasSubFiles ? "មិនអាចលុបបានទេ ព្រោះមានឯកសារភ្ជាប់ (Has attached files, cannot delete)" : "លុបប្រភេទរង (Delete Sub-type)"}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Nested file list for this sub-category */}
                              {hasSubFiles && (
                                <div className="pl-3 border-l-2 border-indigo-500/30 space-y-1.5 pt-1">
                                  {subFiles.map((file, fi) => (
                                    <div key={fi} className="text-xs text-slate-400 flex items-center justify-between py-0.5">
                                      <span className="truncate max-w-[160px] sm:max-w-xs font-medium" title={file.name}>{file.name}</span>
                                      <span className="text-[9px] text-slate-500 font-mono select-none">ID: {file.id.substring(0, 6)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 pl-1 italic">គ្មានប្រភេទរងទេ (No sub-categories)</div>
                    )}
                  </div>

                  {/* Sub-type adder form */}
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <input
                      value={newSubType[index] || ''}
                      onChange={(e) => setNewSubType({ ...newSubType, [index]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubType(index);
                        }
                      }}
                      placeholder="បញ្ចូលប្រភេទរងថ្មី (Enter sub-type name)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button onClick={() => handleAddSubType(index)} className="bg-indigo-900/50 hover:bg-indigo-900 p-2.5 px-4 rounded-xl text-white cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold">
                      <Plus size={14} /> បន្ថែម
                    </button>
                  </div>

                  {/* Main Files with no subType link inside this Type */}
                  {getFilesForType(type.name).filter(f => !f.properties?.subType).length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">ឯកសារចម្បងក្នុងប្រភេទនេះ (Files in this category without sub-type):</span>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-1">
                        {getFilesForType(type.name).filter(f => !f.properties?.subType).map((file, fi) => (
                          <div key={fi} className="text-xs text-slate-400 flex items-center justify-between py-1 font-sans">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                              <span className="truncate max-w-[200px] sm:max-w-md font-medium" title={file.name}>{file.name}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">ID: {file.id.substring(0, 6)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
