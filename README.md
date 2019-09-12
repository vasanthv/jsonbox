# jsonbox.io
HTTP based JSON storage. It lets you store, read & modify JSON data over HTTP APIs for free. 

## API Documentation

Base URL: `https://jsonbox.io`

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
