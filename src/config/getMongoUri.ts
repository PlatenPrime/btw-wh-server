const MONGO_CLUSTER_HOST = "cluster0.b6qtdz4.mongodb.net";

export function getMongoUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  return `mongodb+srv://${dbUser}:${dbPassword}@${MONGO_CLUSTER_HOST}/${dbName}?retryWrites=true&w=majority`;
}
