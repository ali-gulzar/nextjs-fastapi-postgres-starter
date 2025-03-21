export type User = {
    id: string;
    name: string;
};

export type Thread = {
    id: number
  }

export type Message = {
  content: string;
  sender: 'user' | 'bot';
  created_at: Date;
}

