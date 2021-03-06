#place
r/place replica

Architecture for our r/place:
  -  Have an ECS cluster that is running with an operating load balancer that directs incoming
  traffic to a set of Fargate instances.
  - Our load balancer is listening on port 80, which will then direct traffic to our Fargate Instances,
  to keep communication going from the client and the server.
  - We decided that instead of having two ports for communication between our client and server,
  one for the http request for loading the html (8080) and one for the web socket connection(8081),
  we decided to have one port that will be used for both purposes. We used a library called socket.io
  that wraps around the port that is being listened for the http request, so it abstracts the seperate
  port that is needed for webs socket connections. This is why our load balancer only needs to listen on
  one port
  -  Each of our Fargate tasks are running a server on a container, that will be connecting to an elastic
  cache cluster for Redis, that will have the board data. Any changes being made to our Redis cluster from a
  specific server will translate to our other services via using publisher and subscriber clients, so that other
  servers will be able to broadcast the board to their respective clients.
  -  AWS handles our scaling overall, so if one task goes down, it automatically brings up another one up. 
