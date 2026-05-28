import React from 'react';
import { User } from 'firebase/auth';
import FileManager from './FileManager';

export default function ShowFilesView({ 
  user, 
  selectedType, 
  setSelectedType,
  searchQuery,
  setSearchQuery
}: { 
  user: User | null; 
  selectedType: string; 
  setSelectedType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-10">
      <FileManager 
        user={user} 
        viewMode="grid" 
        selectedType={selectedType} 
        setSelectedType={setSelectedType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
}
