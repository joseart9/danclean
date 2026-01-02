export interface Customer {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}
