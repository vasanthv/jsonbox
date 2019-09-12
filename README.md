# jsonbox.io
HTTP based JSON storage. It lets you store, read & modify JSON data over HTTP APIs for free. 

## API Documentation

Base URL: `https://jsonbox.io/`

### Create
You can create a record (or add a record) to a box by using HTTP post to `jsonbox.io/${BOX_ID}`.
```sh
curl -X POST 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4' \
    -H 'content-type: application/json' \
    -d '{"name": "Jon Snow", "age": 25}'
```
Response:
```json
{"_id":"5d776a25fd6d3d6cb1d45c51","name":"Jon Snow","age":25,"_createdOn":"2019-09-10T09:17:25.607Z"}
```

You can also created multiple records at once by passing an array 
```sh
curl -X POST 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4' \
    -H 'content-type: application/json' \
    -d '[{"name": "Daenerys Targaryen", "age": 25}, {"name": "Arya Stark", "age": 16}]'
```
```json
[
  {"_id":"5d776b75fd6d3d6cb1d45c52","name":"Daenerys Targaryen","age":25,"_createdOn":"2019-09-10T09:23:01.105Z"},
  {"_id":"5d776b75fd6d3d6cb1d45c53","name":"Arya Stark","age":16,"_createdOn":"2019-09-10T09:23:01.105Z"}
]
```
You can also pass in an optional collections parameter in the url to group records `jsonbox.io/${BOX_ID}/${COLLECTION}`.

_Note: A valid `${BOX_ID}` & `${COLLECTION}` should contain only alphanumeric characters & \_. `${BOX_ID}` should be atleast 20 character long._

### Read
Use HTTP GET to read all the records or a single record. You can also query & sort the records. 
```sh
curl -X GET 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4'
```
```json
[
  {"_id":"5d776b75fd6d3d6cb1d45c52","name":"Daenerys Targaryen","age":25,"_createdOn":"2019-09-10T09:23:01.105Z"},
  {"_id":"5d776b75fd6d3d6cb1d45c53","name":"Arya Stark","age":16,"_createdOn":"2019-09-10T09:23:01.105Z"},
  {"_id":"5d776a25fd6d3d6cb1d45c51","name":"Jon Snow","age":25,"_createdOn":"2019-09-10T09:17:25.607Z"}
]
```

To get all records inside a collection _Sample collection name: "users"_:
```sh
curl -X GET 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4/users'
```

To sort the records by a specific field use `sort` query param. In the below sample the output will be sort in the descending order of the age.
```sh
curl -X GET 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4?sort=-age'
```

To read a specific record use `jsonbox.io/${BOX_ID}/${RECORD_ID}`.
```sh
curl -X GET 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4/5d776a25fd6d3d6cb1d45c51'
```

To query records, you have to pass the key & value as shown below.
```sh
curl -X GET 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4?query_key=name&query_value=arya%20stark'
```

All the accepted query params are as follows.

| Param       | Description                                                                                   | Default     |
|-------------|-----------------------------------------------------------------------------------------------|-------------|
| sort        | Used to sort the result set by the specific field. Add a prefix "-" to sort in reverse order. | -\_createdOn |
| skip        | Used to skip certain no. of fields. Can be used for pagination.                               | 0           |
| limit       | Used to limit the results to a specific count. Can be used for pagination. Max. is 1000.      | 20          |
| query_key   | The key of the field on which the query is to be executed.                                    |             |
| query_value | Expected value of the query.                                                                  |             |
| query_type  | Query type can either of these "startswith", "endswith", "anywhere".                          | exact       |

### Update
Use HTTP PUT to update record one by one. Please note that this will not patch the record, it is full update. _Bulk update is not supported yet._
```sh
curl -X PUT 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4/5d776b75fd6d3d6cb1d45c53' \
    -H 'content-type: application/json' \
    -d '{"name": "Arya Stark", "age": 18}'
```

### Delete
Use HTTP DELETE to delete the record one by one.
```sh
curl -X DELETE 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4/5d776b75fd6d3d6cb1d45c53'
```

### Private
You will receive API_SECRET for accessing private boxes and you need to pass them in the headers to authenticate the request. You can pass them through X-API-SECRET or API-SECRET headers. 
```sh
curl -X POST 'https://jsonbox.io/76623910d3ab11e9bb652a2ae2dbcce4' \
    -H 'content-type: application/json' \
    -H 'API-SECRET: ${API_SECRET}' \
    -d '{"name": "Jon Snow", "age": 25}'
```

For any queries contact the email address listed in https://jsonbox.io.
