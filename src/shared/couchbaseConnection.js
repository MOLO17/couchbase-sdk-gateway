const { Cluster } = require("couchbase");
const retryErrorCodes = [107, 100, 170, 201];

const {
  CLUSTER_USERNAME: username,
  CLUSTER_PASSWORD: password,
  CLUSTER_CONNECTION_STRING: connectionString,
  BUCKET: bucketName,
  MAX_RETRIES: maxRetries = 3,
} = process.env;

class CouchbaseConnection {
  constructor(
    connectionString,
    certpathParam,
    username,
    password,
    bucketName,
    maxRetries
  ) {
    this.connectionString = connectionString;
    this.certpathParam = certpathParam;
    this.username = username;
    this.password = password;
    this.bucketName = bucketName;
    this.maxRetries = maxRetries || 3;
    this.cluster = null;
  }
  connect() {
    console.log("CONNECTING TO COUCHBASE...")
    this.cluster = new Cluster(
      `${this.connectionString}${this.certpathParam}`,
      {
        username: this.username,
        password: this.password,
      }
    );
    this.bucket = this.cluster.bucket(this.bucketName);
    return this;
  }
  async query(query, options, retry) {
    try {
      return await this.cluster.query(query, options);
    } catch (error) {
      const { cause: { code = "" } = {}, message = "" } = error;
      if (
        retryErrorCodes.includes(code) ||
        message == "parent cluster object has been closed"
      ) {
        this.connect();
        if (retry <= 0) {
          console.error(error);
          throw new Error("Couchbase max retries exceeded");
        }
        return await this.query(
          query,
          options,
          retry ? retry - 1 : this.maxRetries
        );
      } else {
        console.log('Unexpected error', error);
        throw error;
      }
    }
  }
}

const isSecure = connectionString.startsWith("couchbases://");
// const certpath = isSecure ? "./ca.pem" : undefined;
const certpathParam = isSecure ? `?ssl=no_verify` : "";
const connection = new CouchbaseConnection(
  connectionString,
  certpathParam,
  username,
  password,
  bucketName,
  parseInt(maxRetries, 10)
).connect();

module.exports = connection;
