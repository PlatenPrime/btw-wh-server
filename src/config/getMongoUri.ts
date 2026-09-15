export function getMongoUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const clusterHost = process.env.MONGO_CLUSTER_HOST;

  return `mongodb+srv://${dbUser}:${dbPassword}@${clusterHost}/${dbName}?retryWrites=true&w=majority`;
}
