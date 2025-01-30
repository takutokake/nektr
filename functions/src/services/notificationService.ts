import { 
  doc, 
  setDoc, 
  serverTimestamp as Timestamp, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db } from '../../src/firebase';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const sendNotification = async (
  userId: string, 
  notification: NotificationPayload
) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      ...notification,
      read: false,
      createdAt: Timestamp(),
      sender: 'system'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await setDoc(notificationRef, { read: true }, { merge: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const getUserNotifications = async (userId: string) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};
