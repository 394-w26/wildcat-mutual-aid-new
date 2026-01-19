import type { Request, Offer } from '../types/index';
import { getFirestore, doc, getDoc, collection, setDoc, addDoc, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from "../lib/firebase";


// ============ Requests ============

export const createRequest = async (
  title: string,
  description: string,
  creatorID: string,
  creatorEmail: string,
  creatorName: string,
  creatorYear: string,
  creatorMajor: string
): Promise<Request> => {
    console.log("creating request...")
  const request: Omit<Request, 'requestID'> = {
    title,
    description,
    creatorID,
    status: 'open',
    createdAt: Date.now(),
    creatorEmail,
    creatorName,
    creatorYear,
    creatorMajor,
  };
  
  const docRef = await addDoc(collection(db, 'requests'), request);
  console.log(docRef)
  
  return {
    ...request,
    requestID: docRef.id,
  };
};

export const getRequest = async (requestID: string): Promise<Request | undefined> => {
  const docRef = doc(db, 'requests', requestID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      ...docSnap.data(),
      requestID: docSnap.id,
    } as Request;
  }
  return undefined;
};

export const getAllRequests = async (): Promise<Request[]> => {
  const q = query(
    collection(db, 'requests'),
    where('status', '==', 'open'),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    requestID: doc.id,
  } as Request));
};

export const getRequestsByCreator = async (creatorID: string): Promise<Request[]> => {
  const q = query(
    collection(db, 'requests'),
    where('creatorID', '==', creatorID),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    requestID: doc.id,
  } as Request));
};

export const updateRequestStatus = async (requestID: string, status: 'open' | 'accepted' | 'closed'): Promise<void> => {
  await updateDoc(doc(collection(db, 'requests'), requestID), { status });
};


export async function checkUserProfile(uid: string): Promise<boolean> {
  
  const firestore = getFirestore(); // Get Firestore instance
  const userProfile = await getDoc(doc(collection(firestore, 'profiles'), uid)); // Use getDoc and doc to fetch the document
  return userProfile.exists();
}

export async function getUserProfile(uid: string): Promise<{ name: string; year: string; major: string; email: string, photoURL: string } | null> {
  const firestore = getFirestore();
  const userProfile = await getDoc(doc(collection(firestore, 'profiles'), uid));
  if (userProfile.exists()) {
    const data = userProfile.data();
    return {
      name: data.name || '',
      year: data.year || '',
      major: data.major || '',
      email: data.email || '',
      photoURL: data.photoURL || '',
    };
  }
  return null;
}

export async function createProfile(uid: string, name: string, year: string, major: string, email: string, photoURL: string): Promise<void> {
  const firestore = getFirestore();
  await setDoc(doc(collection(firestore, 'profiles'), uid), {
    name,
    year,
    major,
    photoURL,
    email,
  });
}

export async function updateProfile(uid: string, name: string, year: string, major: string, photoURL: string): Promise<void> {
  const firestore = getFirestore();
  await updateDoc(doc(collection(firestore, 'profiles'), uid), {
    name,
    year,
    major,
    photoURL,
  });
}

export const createOffer = async (
  requestID: string,
  helperID: string,
  helperEmail: string,
  helperName: string,
  helperYear: string,
  helperMajor: string,
  helperPhotoURL: string
): Promise<Offer> => {
  const offer: Omit<Offer, 'offerID'> = {
    requestID,
    helperID,
    status: 'pending',
    createdAt: Date.now(),
    helperEmail,
    helperName,
    helperYear,
    helperMajor,
    helperPhotoURL,
  };
  const docRef = await addDoc(
    collection(db, 'requests', requestID, 'offers'),
    offer
  );
  return {
    ...offer,
    offerID: docRef.id,
  };
};

export const getOffer = async (
  requestID: string,
  offerID: string
): Promise<Offer | undefined> => {
  const docRef = doc(db, 'requests', requestID, 'offers', offerID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      ...docSnap.data(),
      offerID: docSnap.id,
    } as Offer;
  }
  return undefined;
};

export const getOffersByRequest = async (requestID: string): Promise<Offer[]> => {
  const q = query(
    collection(db, 'requests', requestID, 'offers'),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    offerID: doc.id,
  } as Offer));
};

export const getOffersByHelper = async (helperID: string): Promise<Offer[]> => {
  const requests = await getAllRequests();
  const allOffers: Offer[] = [];
  
  for (const request of requests) {
    const q = query(
      collection(db, 'requests', request.requestID, 'offers'),
      where('helperID', '==', helperID)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach((doc) => {
      allOffers.push({
        ...doc.data(),
        offerID: doc.id,
      } as Offer);
    });
  }
  
  return allOffers.sort((a, b) => b.createdAt - a.createdAt);
};

export const updateOfferStatus = async (
  requestID: string,
  offerID: string,
  status: 'pending' | 'accepted' | 'declined'
): Promise<void> => {
  const docRef = doc(db, 'requests', requestID, 'offers', offerID);
  await updateDoc(docRef, { status });
};

export const getOfferByRequestAndHelper = async (
  requestID: string,
  helperID: string
): Promise<Offer | undefined> => {
  const q = query(
    collection(db, 'requests', requestID, 'offers'),
    where('helperID', '==', helperID)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.docs.length > 0) {
    const doc = querySnapshot.docs[0];
    return {
      ...doc.data(),
      offerID: doc.id,
    } as Offer;
  }
  return undefined;
};

// ============ Notifications (derived from Offers) ============

export const getPendingNotifications = async (creatorID: string): Promise<Array<Offer & { request: Request }>> => {
  const requests = await getRequestsByCreator(creatorID);
  const openRequests = requests.filter((r) => r.status !== 'closed');
  
  const pendingOffers: Array<Offer & { request: Request }> = [];

  for (const request of openRequests) {
    const offers = await getOffersByRequest(request.requestID);
    const requestPendingOffers = offers.filter((o) => o.status === 'pending');
    
    for (const offer of requestPendingOffers) {
      pendingOffers.push({
        ...offer,
        request,
      });
    }
  }

  return pendingOffers.sort((a, b) => b.createdAt - a.createdAt);
};
