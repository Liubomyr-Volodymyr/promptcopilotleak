import {Subscription} from "@/types/subscription.types";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  subscriberActive: string;
  hasFreeAccess: boolean;
  subscription: Subscription | null;
  isVerified: boolean;
  createdAt: string;
};

export type UsersResponse = {
  items: User[];
  total: number;
  page: number;
  limit: number;
};
