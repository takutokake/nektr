import { 
  doc, 
  setDoc, 
  Timestamp, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

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
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      userId,
      ...notification,
      read: false,
      createdAt: Timestamp.now(),
      sender: auth.currentUser?.uid || 'system'
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
