import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { CapturedProfile, UserMeasurements, BrandSizeMapping, StyleConstraints, FashionLook } from '../types';

export const getUserProfile = async (userId: string) => {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, path);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const createUserProfile = async (userId: string, heightCm: number, constraints: StyleConstraints) => {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, path);
    const now = Date.now();
    await setDoc(docRef, {
      userId,
      heightCm,
      constraints,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateUserProfile = async (userId: string, heightCm: number, constraints: StyleConstraints) => {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, path);
    const now = Date.now();
    await updateDoc(docRef, {
      heightCm,
      constraints,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getSavedLooks = async (userId: string): Promise<FashionLook[]> => {
  const path = `users/${userId}/savedLooks`;
  try {
    const collRef = collection(db, path);
    const snap = await getDocs(collRef);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: data.lookId,
        look_title: data.look_title,
        occasion: data.occasion,
        top_garment: data.top_garment,
        bottom_garment: data.bottom_garment,
        brand: data.brand,
        priceUSD: data.priceUSD,
        priceAED: data.priceUSD * 3.67, // rough conversion
        fabric: '', // not stored
        colorPalette: [], // not stored
        imageUrl: data.imageUrl,
        tags: [], // not stored
        capsule_synergy: '',
        compliance_check: true,
        brand_sizes: [], // we will fetch brand sizes differently if needed
      } as FashionLook;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveLookToFirebase = async (userId: string, look: FashionLook) => {
  const lookId = look.id || `look-${Date.now()}`;
  const path = `users/${userId}/savedLooks/${lookId}`;
  try {
    const docRef = doc(db, path);
    await setDoc(docRef, {
      userId,
      lookId,
      look_title: look.look_title || '',
      occasion: look.occasion || '',
      top_garment: look.top_garment || '',
      bottom_garment: look.bottom_garment || '',
      brand: look.brand || '',
      priceUSD: look.priceUSD || 0,
      imageUrl: look.imageUrl || '',
      createdAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const removeSavedLookFromFirebase = async (userId: string, lookId: string) => {
  const path = `users/${userId}/savedLooks/${lookId}`;
  try {
    const docRef = doc(db, path);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};
