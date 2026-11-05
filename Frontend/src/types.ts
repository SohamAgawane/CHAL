export type Category = "sport" | "trek" | "hangout" | "movie" | "study";
export type JoinStatus = "pending" | "approved" | "rejected";

export interface UserLite {
  _id: string;
  name: string;
  avatar?: string;
  city?: string;
}

export interface User extends UserLite {
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Plan {
  _id: string;
  title: string;
  category: Category;
  location: string;
  address: string;
  city: string;
  date: string;
  time: string;
  totalSpots: number;
  joinedCount: number;
  hostedBy: UserLite | string;
  isOpen: boolean;
  description: string;
  createdAt: string;
}

export interface PlanDetail extends Omit<Plan, "hostedBy"> {
  hostedBy: UserLite;
  memberCount: number;
  hasJoined: boolean;
}

export interface PlanInput {
  title: string;
  category: Category;
  location: string;
  address: string;
  city: string;
  date: string;
  time: string;
  totalSpots: number;
  isOpen: boolean;
  description: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JoinRecord {
  _id: string;
  planId: string;
  userId: string;
  status: JoinStatus;
}

export interface Member {
  _id: string;
  userId: UserLite;
  status: JoinStatus;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  planId: string;
  senderId: UserLite;
  text: string;
  createdAt: string;
}

export interface MessagesPage {
  messages: ChatMessage[];
  pagination: Pagination;
}

export interface Subscription {
  _id: string;
  city: string;
  category: Category;
  createdAt: string;
}
