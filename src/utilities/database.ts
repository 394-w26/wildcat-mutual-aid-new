import type { Request, Offer, Notification } from '../types/index';
import { getFirestore, doc, getDoc, collection, setDoc, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";


// Simple in-memory storage for local development
const requests: Map<string, Request> = new Map();
const offers: Map<string, Offer> = new Map();
const notifications: Map<string, Notification> = new Map();

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
  const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
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

export const updateRequestStatus = (requestID: string, status: 'open' | 'accepted' | 'closed'): Request | undefined => {
  const request = requests.get(requestID);
  if (request) {
    request.status = status;
    requests.set(requestID, request);
  }
  return request;
};


export async function checkUserProfile(uid: string): Promise<boolean> {
  
  const firestore = getFirestore(); // Get Firestore instance
  const userProfile = await getDoc(doc(collection(firestore, 'profiles'), uid)); // Use getDoc and doc to fetch the document
  return userProfile.exists();
}

export async function getUserProfile(uid: string): Promise<{ name: string; year: string; major: string; email: string } | null> {
  const firestore = getFirestore();
  const userProfile = await getDoc(doc(collection(firestore, 'profiles'), uid));
  if (userProfile.exists()) {
    const data = userProfile.data();
    return {
      name: data.name || '',
      year: data.year || '',
      major: data.major || '',
      email: data.email || '',
    };
  }
  return null;
}

export async function createProfile(uid: string, name: string, year: string, major: string, email: string): Promise<void> {
  const firestore = getFirestore();
  await setDoc(doc(collection(firestore, 'profiles'), uid), {
    name,
    year,
    major,
    email,
  });
}
// ============ Offers ============

export const createOffer = (
  requestID: string,
  helperID: string,
  helperEmail: string,
  helperName: string
): Offer => {
  const offerID = `offer_${Date.now()}`;
  const offer: Offer = {
    offerID,
    requestID,
    helperID,
    status: 'pending',
    createdAt: Date.now(),
    helperEmail,
    helperName,
  };
  offers.set(offerID, offer);
  return offer;
};

export const getOffer = (offerID: string): Offer | undefined => {
  return offers.get(offerID);
};

export const getOffersByRequest = (requestID: string): Offer[] => {
  return Array.from(offers.values())
    .filter((o) => o.requestID === requestID)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getOffersByHelper = (helperID: string): Offer[] => {
  return Array.from(offers.values())
    .filter((o) => o.helperID === helperID)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const updateOfferStatus = (offerID: string, status: 'pending' | 'accepted'): Offer | undefined => {
  const offer = offers.get(offerID);
  if (offer) {
    offer.status = status;
    offers.set(offerID, offer);
  }
  return offer;
};

export const getOfferByRequestAndHelper = (requestID: string, helperID: string): Offer | undefined => {
  for (const offer of offers.values()) {
    if (offer.requestID === requestID && offer.helperID === helperID) {
      return offer;
    }
  }
  return undefined;
};

// ============ Notifications ============

export const createNotification = (
  userID: string,
  offerID: string,
  requestID: string,
  helperID: string,
  helperName: string,
  helperEmail: string,
  helperYear: string,
  helperMajor: string,
  status: 'pending' | 'accepted'
): Notification => {
  const notificationID = `notif_${Date.now()}`;
  const notification: Notification = {
    notificationID,
    userID,
    offerID,
    requestID,
    helperID,
    helperName,
    helperEmail,
    helperYear,
    helperMajor,
    status,
    createdAt: Date.now(),
    read: false,
  };
  notifications.set(notificationID, notification);
  return notification;
};

export const getNotification = (notificationID: string): Notification | undefined => {
  return notifications.get(notificationID);
};

export const getNotificationsByUser = (userID: string): Notification[] => {
  return Array.from(notifications.values())
    .filter((n) => n.userID === userID)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getUnreadNotifications = (userID: string): Notification[] => {
  return getNotificationsByUser(userID).filter((n) => !n.read);
};

export const markNotificationAsRead = (notificationID: string): Notification | undefined => {
  const notification = notifications.get(notificationID);
  if (notification) {
    notification.read = true;
    notifications.set(notificationID, notification);
  }
  return notification;
};

export const updateNotificationStatus = (
  notificationID: string,
  status: 'pending' | 'accepted'
): Notification | undefined => {
  const notification = notifications.get(notificationID);
  if (notification) {
    notification.status = status;
    notifications.set(notificationID, notification);
  }
  return notification;
};

export const deleteNotification = (notificationID: string): void => {
  notifications.delete(notificationID);
};
