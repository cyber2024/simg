var baseurl = 'https://www.googleapis.com/customsearch/v1?searchType=image&key=AIzaSyBmaya_Wvc97y9ITxYDBQFAr4iDpajLalc&cx=017719827028415753576%3Akitp2a1bflq&num=5';
var offset = '&start=1';
var cx = '&cx=017719827028415753576%3Akitp2a1bflq';
var resultsPerPage=5;

var express = require("express");
var app = express();
var mongoose = require("mongoose");
var https = require('https');

var searchSchema = new mongoose.Schema({
   term: String,
   when: Date
});

var searched = mongoose.model('searchSchema', searchSchema);

mongoose.connect('mongodb://simg:simg@ds013486.mlab.com:13486/simg');
mongoose.connection.on('connected', function(){
    console.log('connected to database');
});

function search(q, offset, callback){
     return https.get({
         protocol: 'https:',
        host: 'www.googleapis.com',
        path: '/customsearch/v1?searchType=image&key=AIzaSyBmaya_Wvc97y9ITxYDBQFAr4iDpajLalc&cx=017719827028415753576%3Akitp2a1bflq&num='+resultsPerPage+q+offset
    }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            
            var results = [];
            parsed.items.forEach(function(item){
               results.push({title: item.title, url:item.link, snippet:item.snippet, thumbnail:item.image.thumbnailLink, context:item.image.contextLink}); 
            });
            
            callback({
                results: results
            });
        });
    });
}

app.get('/', function(req,res){
   res.send('search images with https://simg-cyber2024.c9users.io/search/{INSERT SEARCH QUERY}{?OFFSET=X(optional)}\nrecent results: https://simg-cyber2024.c9users.io/recent'); 
});

app.get('/recent',function(req,res){
   searched.find({}, function(err, data){
      if(err){
          console.log(err);
          res.send(err);
      } else {
          var results = [];
          data.forEach(function(item){
             results.push({term:item.term, when:item.when}); 
          });
          res.json(results);
      }
   });
});

app.get('/search/:searchstring', function(req,res){
    var q = '';
    var offset = '';
    if(req.query.offset)
        offset = '&start='+((req.query.offset-1) * resultsPerPage); 
    if(req.params.searchstring)
        q = '&q='+req.params.searchstring.replace(/\s/,'%20');
    
    console.log('q',q);
    console.log('offset',offset);

    var newSearch = new searched();
    newSearch.term = req.params.searchstring;
    newSearch.when = new Date();
    newSearch.save(function(){
       console.log('saved',newSearch); 
    });
    
   search(q, offset, function(data){
      res.json(data); 
   });
   
});

var port = process.env.PORT || 8080;
app.listen(port, console.log('listening on port %d',port));