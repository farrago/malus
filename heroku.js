var deployd = require('deployd');

var server = deployd({
  port: process.env.PORT || 5000,
  env: 'staging',
  /* Mongohq, now compose
  db: {
    host: 'linus.mongohq.com',
    port: 10030,
    name: 'app11183418',
    credentials: {
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD
    }
  }
  */
  /* mlab */
  db: {
    host: 'ds151697.mlab.com',
    port: 51697,
    name: 'heroku_5ntw7t0t',
    credentials: {
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD
    }
  }
});

server.listen();

server.on('listening', function() {
  console.log("Server is listening");
});

server.on('error', function(err) {
  console.error(err);
  process.nextTick(function() { // Give the server a chance to return an error
    process.exit();
  });
});