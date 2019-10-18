# Running a local version with Docker
1. Make sure you have `docker` and `docker-compose` installed
2. Clone the git repo
```
git clone https://github.com/vasanthv/jsonbox.git
```
3. navigate into the directory
```
cd jsonbox
```
4. run docker compose
```
docker-compose -f docker/docker-compose.yml up
```
The server will be available on http://localhost:3000
If needed, you could change the port in the `docker-compose.yml` file.

On the first run, it will take longer, since it has to download the Mongo DB image and build the Jsonbox image.
Subsequent runs will start faster.

The Mongo DB database will be persisted outside the container in the `docker/data` directory
