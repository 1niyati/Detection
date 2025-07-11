export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'defaultSecretKeyForDevelopment', // Use environment variable in production
}; 