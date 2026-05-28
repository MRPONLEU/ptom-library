import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { FileType } from '../types';

const defaultTypes: FileType[] = [
  { name: 'ភាសាខ្មែរ', subTypes: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣'] },
  { name: 'គណិតវិទ្យា', subTypes: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣'] },
  { name: 'វិទ្យាសាស្ត្រ', subTypes: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣'] },
  { name: 'សិក្សាសង្គម', subTypes: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣'] }
];

export function useFileTypes() {
  const [fileTypes, setFileTypesInternal] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read from Firestore instead of localStorage
    const docRef = doc(db, 'settings', 'fileTypes');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.types)) {
          setFileTypesInternal(data.types);
        } else {
          setFileTypesInternal(defaultTypes);
        }
      } else {
        // Initialize if not exists
        setFileTypesInternal(defaultTypes);
        setDoc(docRef, { types: defaultTypes }).catch(console.error);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching file types:", error);
      // Fallback
      setFileTypesInternal(defaultTypes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveFileTypes = async (newTypes: FileType[]) => {
    setFileTypesInternal(newTypes);
    try {
      await setDoc(doc(db, 'settings', 'fileTypes'), { types: newTypes });
    } catch (e) {
      console.error("Error saving file types", e);
    }
  };

  return { fileTypes, saveFileTypes, loading };
}
