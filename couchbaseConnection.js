const { Cluster } = require("couchbase");
const retryErrorCodes = [107, 100, 170, 201];

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
        throw error;
      }
    }
  }
}

module.exports = CouchbaseConnection;
