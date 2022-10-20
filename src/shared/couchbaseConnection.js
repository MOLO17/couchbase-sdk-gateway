const couchbase = require('couchbase');
const retryErrorCodes = [107, 100, 170, 201];

const {
  CLUSTER_USERNAME: username,
  CLUSTER_PASSWORD: password,
  CLUSTER_CONNECTION_STRING: connectionString,
  CERT_PATH: certPath,
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

  async connect() {
    console.log(`CONNECTING TO COUCHBASE at ${this.connectionString} / ${this.bucketName} certPath ${this.certpathParam}`)
    try {
      this.cluster = await couchbase.connect(
        this.connectionString,
        {
          username: this.username,
          password: this.password,
          ...(this.certpathParam && {
            trustStorePath: this.certpathParam,
          }),
        }
      );
    } catch(error) {
      console.log('Unable to connect!', error);
      return this;
    }
    console.log('Connected! Getting bucket...');
    this.bucket = this.cluster.bucket(this.bucketName);
    console.log('Connection ready!');
    return this;
  }

  async query(query, options, retry) {
    try {
      return await this.cluster.query(query, options);
    } catch (error) {
      console.log('Query failue at attempt ', retry, error);
      const { cause: { code = '' } = {}, message = '' } = error;
      if (
        retryErrorCodes.includes(code) ||
        message == 'parent cluster object has been closed' ||
        !this.cluster
      ) {
        await this.connect();
        if (retry <= 0) {
          console.error(error);
          throw new Error('Couchbase max retries exceeded');
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

const isSecure = connectionString.startsWith('couchbases://');
const certpathParam = isSecure && certPath || '';
const connection = new CouchbaseConnection(
    connectionString,
    certpathParam,
    username,
    password,
    bucketName,
    parseInt(maxRetries, 10)
  );

(async() => {
  await connection.connect();
})();

module.exports = connection;
