var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var multer = require('multer');
var decompress = require('decompress');
var fs = require('fs');
var path = require("path");

app.use('/output', express.static(__dirname + '/output'));

var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
  socket.on('slide change', function(slideNumber){
    io.emit('slide change', slideNumber);
  });
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, req.body.title + '-' + Date.now()+'.zip')
  }
});

var upload = multer({ storage: storage });

app.post('/', upload.single('upl'), function(req,res){
	/* example output:
            { fieldname: 'upl',
              originalname: 'grumpy.png',
              encoding: '7bit',
              mimetype: 'image/png',
              destination: './uploads/',
              filename: '436ec561793aa4dc475a88e84776b1b9',
              path: 'uploads/436ec561793aa4dc475a88e84776b1b9',
              size: 277056 }
	 */
	var filePath = path.join(req.file.destination, req.file.filename);
	io.emit('end upload');
	res.status(204).end();
	//res.send('YEQH');
	decompressZip(filePath);

});

var decompressZip = function(file) {
	console.log(file);
	decompress(file, './output/', {
		map: file => {
			file.path = `itelios-${file.path}`;
			return file;
		}
	}).then(files => {
		//console.log('done!');
		folderList();
	});
};

var folderList = function () {
	var objArray = [];
	var folders  = fs.readdirSync('./output/');
	folders.forEach((folder) => {
		if (folder.startsWith('itelios-') && !folder.endsWith('__MACOSX')) {
			var obj    = {};
			var files  = fs.readdirSync('./output/' + folder);
			obj.folder = folder;
			obj.files  = files;
			objArray.push(obj);
		}
	});
	io.emit('folder names', objArray);
}

http.listen(port, function(){
  console.log('listening on *: '+ port);
});
    