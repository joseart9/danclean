export interface Expense {
  id: string;
  name: string;
  amount: number;
  userId: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
}
