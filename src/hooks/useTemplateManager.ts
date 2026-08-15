import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { MessageTemplate } from '../types';

export const useTemplateManager = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.currentUser) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'templates'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const templateData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MessageTemplate[];
      setTemplates(templateData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching templates:', err);
      setError('Falha ao carregar templates.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth?.currentUser]);

  const addTemplate = async (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'userId'>) => {
    if (!auth?.currentUser) throw new Error('Usuário não autenticado');

    try {
      await addDoc(collection(db, 'templates'), {
        ...template,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding template:', err);
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    try {
      const templateRef = doc(db, 'templates', id);
      await updateDoc(templateRef, updates);
    } catch (err) {
      console.error('Error updating template:', err);
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const templateRef = doc(db, 'templates', id);
      await deleteDoc(templateRef);
    } catch (err) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  return {
    templates,
    loading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate
  };
};
