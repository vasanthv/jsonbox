# jsonbox.io
A HTTP based JSON storage. It lets you store, read & modify JSON data over HTTP APIs for FREE. Ideal for small projects, prototypes or hackathons, where you don't have to spin up your own data store.

## API Documentation

Base URL: `https://jsonbox.io/`

### Create
You can create a record (or add a record) to a box by using HTTP post to `jsonbox.io/${BOX_ID}`.
```sh
curl -X POST 'https://jsonbox.io/demobox_6d9e326c183fde7b' \
    -H 'content-type: application/json' \
    -d '{"name": "Jon Snow", "age": 25}'
```
Response:
```json
{"_id":"5d776a25fd6d3d6cb1d45c51","name":"Jon Snow","age":25,"_createdOn":"2019-09-10T09:17:25.607Z"}
```

You can also create multiple records at once by passing an array 
```sh
curl -X POST 'https://jsonbox.io/demobox_6d9e326c183fde7b' \
    -H 'content-type: application/json' \
    -d '[{"name": "Daenerys Targaryen", "age": 25}, {"name": "Arya Stark", "age": 16}]'
```
```json
[
  {"_id":"5d776b75fd6d3d6cb1d45c52","name":"Daenerys Targaryen","age":25,"_createdOn":"2019-09-10T09:23:01.105Z"},
  {"_id":"5d776b75fd6d3d6cb1d45c53","name":"Arya Stark","age":16,"_createdOn":"2019-09-10T09:23:01.105Z"}
]
```
You can also pass in an optional collections parameter in the URL to group records `jsonbox.io/${BOX_ID}/${COLLECTION}`.

_Note: A valid `${BOX_ID}` & `${COLLECTION}` should contain only alphanumeric characters & \_. `${BOX_ID}` should be at least 20 characters long._

### Read
Use HTTP GET to read all the records or a single record. You can also query & sort the records. 
```sh
curl -X GET 'https://jsonbox.io/demobox_6d9e326c183fde7b'
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
curl -X GET 'https://jsonbox.io/demobox_6d9e326c183fde7b/users'
```

To sort the records by a specific field use `sort` query param. In the below example the output will be sorted in the descending order of the age.
```sh
curl -X GET 'https://jsonbox.io/demobox_6d9e326c183fde7b?sort=-age'
```

To read a specific record use `jsonbox.io/${BOX_ID}/${RECORD_ID}`.
```sh
curl -X GET 'https://jsonbox.io/demobox_6d9e326c183fde7b/5d776a25fd6d3d6cb1d45c51'
```

To query records, you have to pass the key & value as shown below.
```sh
curl -X GET 'https://jsonbox.io/demobox_6d9e326c183fde7b?q=name:arya%20stark'
```

All the accepted query params are as follows.

| Param       | Description                                                                                   | Default     |
|-------------|-----------------------------------------------------------------------------------------------|-------------|
| sort        | Used to sort the result set by the specific field. Add a prefix "-" to sort in reverse order. | -\_createdOn |
| skip        | Used to skip certain no. of fields. Can be used for pagination.                               | 0           |
| limit       | Used to limit the results to a specific count. Can be used for pagination. Max. is 1000.      | 20          |
| q           | Query for filtering values. Check out the format below.                                       |             |

#### Filtering
You can pass a filter in a query by passing them in URL param `q` as shown below:
```sh
curl -X GET 'https://jsonbox.io/demobox_6d9e326c183fde7b?q=name:arya%20stark,age:>13'
```
The above sample will look for the name `arya stark` and age greater than 13. You can filter on `Number`, `String` & `Boolean` values only.

Different filters for Numeric values.

|                                                                      | Sample                       |
|----------------------------------------------------------------------|------------------------------|
| To filter values greater than or less than a specific value          | `q=age:>10` or `q=age:<10`   |
| To filter values greater (or less) than or equal to a specific value | `q=age:>=10` or `q=age:<=10` |
| To filter values that match a specific value.                        | `q=age:=10`                  |

Different filters for String values.

|                                                                    | Sample              |
|--------------------------------------------------------------------|---------------------|
| Filter values that start with a specific string                    | `q=name:arya*`      |
| Filter values that end with a specific string                      | `q=name:*stark`     |
| Filter values where a specific string appears anywhere in a string | `q=name:*ya*`       |
| Filter values that match a specific string                         | `q=name:arya%20stark` |

You can combine multiple fields by separating them with commas as shown below:
```
https://jsonbox.io/demobox_6d9e326c183fde7b?q=name:arya%20stark,age:>13,isalive:true
```

### Update
Use HTTP PUT to update record one by one. Please note that this will not patch the record, it is full update. _A Bulk update is not supported yet._
```sh
curl -X PUT 'https://jsonbox.io/demobox_6d9e326c183fde7b/5d776b75fd6d3d6cb1d45c53' \
    -H 'content-type: application/json' \
    -d '{"name": "Arya Stark", "age": 18}'
```

### Delete
Two approaches are available for delete
* To delete a specific record use HTTP DELETE with jsonbox.io/${BOX_ID}/${RECORD_ID}
```sh
curl -X DELETE 'https://jsonbox.io/demobox_6d9e326c183fde7b/5d776b75fd6d3d6cb1d45c53'
```
* To delete based on a filter use HTTP DELETE with jsonbox.io/${BOX_ID}?q={QUERY}
```sh
curl -X DELETE 'https://jsonbox.io/demobox_6d9e326c183fde7b?q=name:arya%20stark,age:>13'
```

### Limitations
Added some limitations to avoid abuse.

1. The request body cannot be more than 10KB.
2. Can't push or pull more than 1000 records at a time.
3. There is no limit on the number of records you store in a box, but please don't abuse the API by storing large datasets of more than **5000** records. This is meant for small projects and that's why it is offered FREE of cost.

### Wrappers
*Note: The wrappers listed here are from other sources and it is not been tested on validated by us*
- **Go**: [peteretelej/jsonbox](https://godoc.org/github.com/peteretelej/jsonbox) ([Github](https://github.com/peteretelej/jsonbox))
- **Java**: 
  1. [https://search.maven.org/artifact/io.jsonbox/jsonbox](https://search.maven.org/artifact/io.jsonbox/jsonbox) ([Github](https://github.com/leonardiwagner/jsonbox-java))
  2. [https://github.com/leeu1911/jsonbox-java](https://github.com/leeu1911/jsonbox-java)
- **Node**: [https://www.npmjs.com/package/jsonbox-node](https://www.npmjs.com/package/jsonbox-node) ([Github](https://github.com/0xflotus/jsonbox-node))
- **Python**: [https://pypi.org/project/jsonbox/](https://pypi.org/project/jsonbox/) ([Github](https://github.com/harlev/jsonbox-python))
- **React**: [https://www.npmjs.com/package/react-jsonbox](https://www.npmjs.com/package/react-jsonbox) ([Github](https://github.com/SaraVieira/react-jsonbox))
- **Rust**: [https://crates.io/crates/jsonbox](https://crates.io/crates/jsonbox) ([Github](https://github.com/kuy/jsonbox-rs))

### Running a local version with Docker
see [docker.md](docker/docker.md)

### Contribution
Any feedback, pull request or issue is welcome.

### How to Contribute
Fork this repo and then clone it:
```
git clone https://github.com/<your_name>/jsonbox.git
```

You need MongoDB to run this application. If you don't already have MongoDB, go to the  [official documentation](https://docs.mongodb.com/manual/installation/) and follow the instructions there. Once you have MongoDB installed, run
```
mongo
```
to start the MongoDB instance. Then `cd` into directory where the repo was cloned and install the dependencies:
```
npm install
```
Then just run 
```
npm start
```
to start the development server on port `3000`. Your jsonbox instance will be running on `http://localhost:3000`.


Alternatively, you can also use a Docker to run the application in a container:
```
docker run -d -p 27017:27017 -v ~/data:/data/db mongo
```

### LICENSE
MIT
