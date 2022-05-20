const http = require("http");

 
var port = 3000;
 
var s = http.createServer();

s.on('request', function(request, response) {
    response.writeHead(200);
    console.log(request.method);
    console.log(request.headers); // one of these can be parsed so that the code is extracted alone
    console.log(request.url);
    response.write('hi');
    response.end();
});
 
s.listen(port);

console.log('Browse to http://127.0.0.1:' + port);