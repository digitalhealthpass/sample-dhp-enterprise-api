# enterprise-processing-api

Enterprise Processing API will help the organization for processing and verify holder-shared credentials and generate and share the reports periodically.
## Development Setup
### Box App setup

#### The following configuration is generated automagically by the Box UI:
1. Go to https://box.com/developers/console and log in (functional ID?) 
2. Select 'Create New App' 
3. Select 'Custom App' 
4. Select 'Server Authentication (with JWT)', enter app name and select 'Create App' 
5. On Configuration tab, make sure 'App Access Only' is selected under 'App Access Level', select
'Write all files and folders stored in Box' under 'Application Scopes' and select 'Save Changes' 
6. Submit the app for approval

#### After approval is granted:

1. On Configuration tab, select 'Generate a Public/Private Keypair' to generate configuration file
2. Set these environment variables based on contents of the configuration file: 
BOX_CLIENT_ID,BOX_CLIENT_SECRET,BOX_PUBLIC_KEY_ID,BOX_PRIVATE_KEY,
BOX_PASSPHRASE,BOX_ENTERPRISE_ID
3. On 'General Settings' tab, note Service Account ID - this email will need to be given Editor access
to all folders that will receive uploaded files from the app
### Local Postgres setup
- Start pg in docker
```
docker pull postgres:12
docker run --name dev-postgres -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword -d postgres:12

# CREATE db 
docker exec dev-postgres psql -U postgres -c"CREATE DATABASE verifier_admin" postgres

  ```
## Environment Variables

Create a `.env` file in the project root with the following required variables

### Setup auth strategy
AUTH_STRATEGY values `"DEVELOPMENT",  "APPID"`. Default value `"APPID"`

Note: AUTH_STRATEGY `"KEYCLOAK"` has beta support in healthpass-auth-lib

```
#postgres for databases
POSTGRES_HOST
POSTGRES_USER
POSTGRES_USERPWD
POSTGRES_DB_NAME
POSTGRES_PORT
POSTGRES_SSLMODE
POSTGRES_CACERT

AUTH_STRATEGY
#AppID related
APP_ID_URL
APP_ID_AUTH_SERVER_HOST
APP_ID_TENANT_ID
APP_ID_CLIENT_ID
APP_ID_SECRET
APP_ID_IAM_KEY

COS_BUCKET_SUFFIX
COS_API_KEY
COS_SERVICE_INSTANCE_ID

BOX_CLIENT_ID
BOX_CLIENT_SECRET
BOX_PUBLIC_KEY_ID
BOX_PRIVATE_KEY
BOX_PASSPHRASE
BOX_ENTERPRISE_ID

```

## TLS
To enable HTTPS with tls1.2, enable USE_HTTPS and set TLS_FOLDER_PATH to relative or abs path
to folder containing server.key & server.cert files. Without this setting, server starts up in http mode.

For e.g. set following env vars
```
USE_HTTPS=true
TLS_FOLDER_PATH=./config/tls

## Installation

It is recommended to use [Node.js](https://nodejs.org/) v16

To install the dependencies and run the service perform the following from a command line.
Note: Environment variables must be set, as described in following sections, before starting the service. 

```
cd enterprise-processing-api
npm i
node start
```


## Library Licenses

This section lists open source libraries used in this API. 

**Table : Libraries and sources for this SDK** 

|name              |license type|link                                                            |
|------------------|------------|----------------------------------------------------------------|
|axios             |MIT         |https://github.com/axios/axios.git                              |
|bcryptjs          |MIT         |https://github.com/dcodeIO/bcrypt.js.git                        |
|body-parser       |MIT         |https://github.com/expressjs/body-parser.git                    |
|box-node-sdk      |Apache-2.0  |https://github.com/box/box-node-sdk.git                         |
|cors              |MIT         |https://github.com/expressjs/cors.git                           |
|crypto            |ISC         |https://github.com/npm/deprecate-holder.git                     |
|dotenv            |BSD-2-Clause|https://github.com/motdotla/dotenv.git                          |
|express           |MIT         |https://github.com/expressjs/express.git                        |
|express-validator |MIT         |https://github.com/express-validator/express-validator.git      |
|generate-password |MIT         |https://github.com/brendanashworth/generate-password.git        |
|helmet            |MIT         |https://github.com/helmetjs/helmet.git                          |
|ibm-cos-sdk       |Apache-2.0  |https://github.com/IBM/ibm-cos-sdk-js.git                       |
|ibmcloud-appid    |Apache-2.0  |https://github.com/ibm-cloud-security/appid-serversdk-nodejs.git|
|jslt              |ISC         |https://github.com/capriza/jslt.git                             |
|json2csv          |MIT         |https://github.com/zemirco/json2csv.git                         |
|jsonschema        |MIT         |https://github.com/tdegrunt/jsonschema.git                      |
|jsonwebtoken      |MIT         |https://github.com/auth0/node-jsonwebtoken.git                  |
|log4js            |Apache-2.0  |https://github.com/log4js-node/log4js-node.git                  |
|moment            |MIT         |https://github.com/moment/moment.git                            |
|morgan            |MIT         |https://github.com/expressjs/morgan.git                         |
|newrelic          |Apache-2.0  |https://github.com/newrelic/node-newrelic.git                   |
|node-cron         |ISC         |https://github.com/merencia/node-cron.git                       |
|passport          |MIT         |https://github.com/jaredhanson/passport.git                     |
|pg                |MIT         |https://github.com/brianc/node-postgres.git                     |
|qrcode            |MIT         |https://github.com/soldair/node-qrcode.git                      |
|querystring       |MIT         |https://github.com/Gozala/querystring.git                       |
|retry-axios       |Apache-2.0  |https://github.com/JustinBeckwith/retry-axios.git               |
|sequelize         |MIT         |https://github.com/sequelize/sequelize.git                      |
|swagger-ui-express|MIT         |https://@github.com/scottie1984/swagger-ui-express.git          |
|uuid              |MIT         |https://github.com/uuidjs/uuid.git                              |
