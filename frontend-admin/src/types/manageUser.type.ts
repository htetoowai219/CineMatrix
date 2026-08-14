export interface IManagedUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt?: string;
}

export interface CreateOwnerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cinemaId?: string;
}
