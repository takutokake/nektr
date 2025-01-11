export interface MatchDetails {
  matchedUserId: string;
  matchedUserName: string;
  dropId: string;
  dropTitle: string;
  cuisineMatch?: {
    preference: string;
    recommendation?: string;
  };
  commonInterests: string[];
  status: 'pending' | 'accepted' | 'declined';
  matchTime: Date;
}

export interface Notification {
  id: string;
  type: 'match' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  matchDetails?: MatchDetails;
  actionTaken?: boolean;
}
