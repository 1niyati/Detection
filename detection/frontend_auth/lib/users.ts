// In-memory user storage for demo purposes
// In a real application, you would use a database
interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: Date
}

const users: User[] = []

export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  const user: User = {
    id: Math.random().toString(36).substring(2, 15),
    ...userData,
    createdAt: new Date(),
  }

  users.push(user)
  return user
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return users.find((user) => user.email === email) || null
}

export async function getUserById(id: string): Promise<User | null> {
  return users.find((user) => user.id === id) || null
}
