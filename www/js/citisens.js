var profile, idToken=0;

/*
function onSignIn(googleUser) {
	profile = googleUser.getBasicProfile();
	idToken = googleUser.getAuthResponse().id_token;
}
*/

function compass(a, b, g){
			// Calculate equation components
		var cA = Math.cos(Cesium.Math.toRadians(a));
		var sA = Math.sin(Cesium.Math.toRadians(a));
		var cB = Math.cos(Cesium.Math.toRadians(b));
		var sB = Math.sin(Cesium.Math.toRadians(b));
		var cG = Math.cos(Cesium.Math.toRadians(g));
		var sG = Math.sin(Cesium.Math.toRadians(g));

		// Calculate A, B, C rotation components
		var rA = - cA * sG - sA * sB * cG;
		var rB = - sA * sG + cA * sB * cG;
		var rC = - cB * cG;

		// Calculate compass heading
		var compassHeading = Math.atan(rA / rB);

		// Convert from half unit circle to whole unit circle
		if(rB < 0) {
			compassHeading += Math.PI;
		} else if(rA < 0) {
			compassHeading += 2 * Math.PI;
		}

		// Convert radians to degrees
		compassHeading /= degToRad; 

		return compassHeading;
}

var step = 50;				//meters
var steps = 300; 			//number
var stdThresh = 0.2;		//threshold under which reporting is disabled
var arraySize = 20;			//size of buffer for IMU data
var arraySizeLong = 30;		//size of array to determine figure 8 motion and IMU data shakiness
var magDecl = 4;
/*
var gyroNormArgs = {
    frequency:5,                  // ( How often the object sends the values - milliseconds )
    gravityNormalized:true,         // ( If the garvity related values to be normalized )
    orientationBase:GyroNorm.WORLD, // ( Can be GyroNorm.GAME or GyroNorm.WORLD. gn.GAME returns orientation values with respect to the head direction of the device. gn.WORLD returns the orientation values with respect to the actual north direction of the world. )
    decimalCount:2,                 // ( How many digits after the decimal point will there be in the return values )
    logger:null,                    // ( Function to be called to log messages from gyronorm.js )
    screenAdjusted:false            // ( If set to true it will return screen adjusted values. )
};

var gn = new GyroNorm();
*/
var posLatArray = [];
var posLonArray = [];
var yawArray = [];
var pitchArray = [];
var rollArray = [];
var headingArray = [];
var yawArrayLong = [];
var pitchArrayLong = [];
var rollArrayLong = [];
var iter=0, iterLong=0;
var pitchOffset=0, rollOffset=0, headingOffset=0, pitchTemp=0, rollTemp=0, headingTemp=0;
var calibrationON=0, calibrated=0, figure8ed=0, usingCamera=1, dataSource;
/*
gn.init(gyroNormArgs).then(function(){
    gn.start(function(data){
		iterLong=iterLong%arraySizeLong;

		he = data.do.alpha + headingOffset;
		var tempBeta = data.do.beta - pitchOffset;

    	he = compass(he, tempBeta, data.do.gamma);
 		if(-data.do.gamma>0){
 			pit = 180-(data.do.gamma-90)-360;  
 		}
 		else{
	 		pit = -(data.do.gamma-90); 			
 		}
 		ro = data.do.beta;
 		if(ro<90 && pit>0){
 			ro = -ro;
 		}
 		else if(pit>0){
 			ro = 180-ro;
 		}

 		yawArrayLong[iterLong]=he;
 		pitchArrayLong[iterLong]=pit;
 		rollArrayLong[iterLong]=ro;

		if(iterLong==arraySizeLong-1 && figure8ed==0)
		{
			if(yawArrayLong.std()>7 && rollArrayLong.std()>7 && pitchArrayLong.std()>7)
			{
				figure8ed=1;
				$('#figure8Button').css('color','green');
			}
		} 		

		$('.heading span').text(he.toFixed(1)+'º');//+' ('+heStd.toFixed(3)+')');
		$('.pitch span').text(pit.toFixed(1)+'º');//+' ('+pitStd.toFixed(3)+')');
//		$('.roll span').text(ro.toFixed(1)+'º');//+' ('+roStd.toFixed(3)+')');	

		camera.setView({
			destination : Cesium.Cartesian3.fromDegrees(posLon, posLat, 1.8),
			orientation: {
				heading : Cesium.Math.toRadians(he),
				pitch : Cesium.Math.toRadians(pit),
				roll : Cesium.Math.toRadians(0)
			}
		});	

		iterLong++;		        
    });
}).catch(function(e){
  alert("Your device does not support DeviceOrientationEvent");
});
*/

var conn, peerID=-1;
var peer = new Peer({key: 'eun41acyys6ecdi'});

function calibration(){
	calibrationON=1;
	headingOffset=0;
	rollOffset=0;
	pitchOffset=0;
	pitchTemp=0;
	rollTemp=0;
	headingTemp=0;
	calibrated=0;
	$('#calibrationButton').css('color','red');
	//$('#calibrationButton').text('Calibrate');
	if(viewer3D)
		toggleViewer();
}

var flying=0;
var posTemp1={lon:0,lat:0,alt:0};
var posTemp2=posTemp1;

function fly(){
	if(flying!=0){
		$('#flyButton').css('color','white');
		navigator.accelerometer.clearWatch(flying);
		flying=0;
	}
	else{	
		$('#flyButton').css('color','green');
		posTemp2.lon=posLon;
		posTemp2.lat=posLat;
		posTemp2.alt=50;
		if(viewer3D==0)
			toggleViewer();

		function onSuccess(acceleration) {
			posTemp2.lon = posTemp2.lon + 0.0001*(acceleration.x - 9.81);
			posTemp2.lat = posTemp2.lat + 0.0001*acceleration.z;
			posTemp2.alt = posTemp2.alt + 0.001*acceleration.y;
									
			camera.setView({
				destination : Cesium.Cartesian3.fromDegrees(posTemp2.lon, posTemp2.lat, posTemp2.alt),
				orientation: {
						heading : Cesium.Math.toRadians(he),
						pitch : Cesium.Math.toRadians(pit),
						roll : Cesium.Math.toRadians(0)
				}
			});	
			
			$('.heading span').text('LON: '+acceleration.x.toFixed(1));
			$('.pitch span').text('LAT: '+acceleration.z.toFixed(1)+' ALT: '+acceleration.y.toFixed(1));
		}

		function onError() {
			alert('onError!');
		}

		var options = { frequency: 51 };

		flying = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);		
	}
}

var fusionWatchID;
var fusionModeVar=2;

function fusionMode(){
	fusionModeVar = (fusionModeVar+1)%3;
	$('#fusionButton').text(fusionModeVar);
	navigator.fusion.setMode(function (result) {
		console.log('result', result);
	}, function (err) {
		console.log('err', err);
	}, {
		mode: fusionModeVar
	});
}

var viewer3D=0;

function toggleViewer(){
	if(viewer3D==0)
	{
		viewer3D=1;
		$('#toggleButton').text('');
		$('#toggleButton').removeClass('fa fa-globe');
		$('#toggleButton').addClass('fa fa-camera');
		$('#cameraContainer').hide();
	}
	else
	{
		viewer3D=0;
		$('#toggleButton').text('');
		$('#toggleButton').removeClass('fa fa-camera');
		$('#toggleButton').addClass('fa fa-globe');
		$('#cameraContainer').show();
	}
}

/*
(function(){

	navigator.mediaDevices.getUserMedia({ 	audio: false, 
											video: { 
												width: { 
													min: 1280, 
													ideal: 1920, 
													max: 1920 
												}, 
												height: { 
													min: 720, 
													ideal: 1080, 
													max: 1080 
												},
    										}
    									})
	  .then(stream => video.srcObject = stream)
	  .catch(e => log(e.name + ": "+ e.message));
  
	var log = msg => video.innerHTML += msg + "<br>";
	
})();
*/

$( "#calibrationButton" ).fadeIn();
$( "#toggleButton" ).fadeIn();

Cesium.BingMapsApi.defaultKey = 'At_AFe-qsyUPknA5mZgYR3pN0LJR4ZXTi-ul98ptDA3ZDuP0EbsBXUsynXb68lS-';

var viewer = new Cesium.Viewer('cesiumContainer', {
					baseLayerPicker:false,
					animation:false,
					geocoder:false,
					homeButton:false,
					infoBox:false,
					sceneModePicker:false,
					selectionIndicator:false,
					timeline:false,
					navigationHelpButton:false,
					fullscreenButton:false
});

var terrainProvider = new Cesium.CesiumTerrainProvider({
	url : 'https://assets.agi.com/stk-terrain/world',
	requestVertexNormals : true
});

viewer.terrainProvider = terrainProvider;

var scene = viewer.scene;
var ellipsoid = scene.globe.ellipsoid;
var billboardCollection = scene.primitives.add(new Cesium.BillboardCollection({
	scene : scene
}));

var camera = viewer.camera;

var degToRad = Math.PI / 180;

Array.prototype.avg = function() {
	var sinSum=0, cosSum=0;
	var len = this.length;
	for (var i = 0; i < len; i++) {
		sinSum+=Math.sin(this[i]*degToRad);
		cosSum+=Math.cos(this[i]*degToRad);
	}
	return Math.atan2(sinSum/len, cosSum/len)/degToRad;
}

Array.prototype.std = function(){
	var i,j,total = 0, mean = 0, diffSqredArr = [];
	for(i=0;i<this.length;i+=1){
		total+=this[i];
	}
	mean = total/this.length;
	for(j=0;j<this.length;j+=1){
		diffSqredArr.push(Math.pow((this[j]-mean),2));
	}
	return (Math.sqrt(diffSqredArr.reduce(function(firstEl, nextEl){
			return firstEl + nextEl;
			})/this.length));
};

Array.prototype.median = function() {
	var sortedArr = this.sort(function(num1, num2) {
		return num1 - num2;
	});
	var medianIndex = Math.floor(sortedArr.length / 2);
	if (this.length % 2 === 0) {
		return (sortedArr[medianIndex-1] + sortedArr[medianIndex]) / 2;
	} else {
		return sortedArr[medianIndex];
	}
}

var he = 0;
var pit = 0;
var ro = 0;
var heStd = 0;
var pitStd = 0;
var roStd = 0;
var	posAlt = 0;
var posAcc = 0;
var posLon = 23;
var posLat = 38;
var targetLon = 0;
var targetLat = 0;
var targetAlt = 0;
var distanceUT = 0;
var userid;


//$('document').ready(function(){
/*
	("DeviceMotionEvent" in window)
		? window.addEventListener('devicemotion', deviceMotionHandler, false)
		: console.log('No device motion support');

	function deviceMotionHandler(event) {			
		if(flying)
		{
			posTemp1=posTemp2;
			// Grab the acceleration from the results
			var acceleration = event.acceleration;
			var interval = event.interval;
			postTemp2.lon = posTemp1.lon + acceleration.x*interval*0.000012*100;
			postTemp2.lat = posTemp1.lat + acceleration.y*interval*0.000009*100;
			postTemp2.alt = posTemp1.alt + acceleration.z*interval*0.000010*100;
			
			camera.setView({
						//destination : Cesium.Cartesian3.fromDegrees(posTemp2.lon, posTemp2.lat, posTemp2.alt),
						orientation: {
							heading : Cesium.Math.toRadians(he),
							pitch : Cesium.Math.toRadians(pit),
							roll : Cesium.Math.toRadians(ro)
						}
					});
		}
	}
*/
/*
	("DeviceOrientationEvent" in window)
		? window.addEventListener('deviceorientation', deviceOrientationHandler, false)
		: console.log('No device orientation support');

	function deviceOrientationHandler(e) {
	
		iter=iter%arraySize;
		iterLong=iterLong%arraySizeLong;

		yawArray[iter]=e.alpha + headingOffset;
		rollArray[iter]=e.gamma;
		pitchArray[iter]=e.beta - pitchOffset;

		yawArrayLong[iterLong]=e.alpha;
		rollArrayLong[iterLong]=e.gamma;
		pitchArrayLong[iterLong]=e.beta;

		if(iterLong==arraySizeLong-1 && figure8ed==0)
		{
			if(yawArrayLong.std()>7 && rollArrayLong.std()>7 && pitchArrayLong.std()>7)
			{
				figure8ed=1;
				$('#figure8Button').css('color','green');
			}
		}

		if(e.webkitCompassHeading)
		{
			yawArray[iter] = e.webkitCompassHeading;
		}

		var compassHeading = compass(yawArray.median()*degToRad, pitchArray.median()*degToRad, rollArray.median()*degToRad);

		pit = pitchArray.avg()-90;
		ro = rollArray.avg();
		headingArray[iter]=compassHeading + ro;// + magDecl; // applying ROLL on heading
		he = headingArray.avg();

		heStd = headingArray.std();
		roStd = rollArray.std();
		pitStd = pitchArray.std();
		
		$('.heading span').text(he.toFixed(1));//+' ('+heStd.toFixed(3)+')');
		$('.pitch span').text(pit.toFixed(1));//+' ('+pitStd.toFixed(3)+')');
		$('.roll span').text(ro.toFixed(1));//+' ('+roStd.toFixed(3)+')');

		if(flying==0)
		{
			camera.setView({
				destination : Cesium.Cartesian3.fromDegrees(posLon, posLat, 1.8),
				orientation: {
					heading : Cesium.Math.toRadians(he),
					pitch : Cesium.Math.toRadians(pit),
					roll : Cesium.Math.toRadians(ro)
				}
			});
		}
		else
		{
			camera.setView({
				orientation: {
					heading : Cesium.Math.toRadians(he),
					pitch : Cesium.Math.toRadians(pit),
					roll : Cesium.Math.toRadians(ro)
				}
			});			
		}
		
		iter++;
		iterLong++;		
	}
*/	
//});


function get_location()
{
	navigator.geolocation.watchPosition(show_map, userDenyGPS, {enableHighAccuracy:true});
}

function show_map(position) {
	var oldPosLon = parseFloat(posLon);
	var oldPosLat = parseFloat(posLat);
	posLon=parseFloat(position.coords.longitude.toFixed(6));
	posLat=parseFloat(position.coords.latitude.toFixed(6));
	posAcc=parseFloat(position.coords.accuracy.toFixed(1));
	$('.position span').text(posAcc+' m.'); //position.coords.accuracy.toFixed(1)
	var posAlt = parseFloat(position.coords.altitude);
	var altitudeAccuracy = parseFloat(position.coords.altitudeAccuracy);
	var GPSheading = parseFloat(position.coords.heading);
	var speed = parseFloat(position.coords.speed);	
}

function userDenyGPS() {
	//alert("CITISENS needs location permissions.");
}

function get_camera(){
	navigator.mediaDevices.getUserMedia({ 	audio: false, 
											video: { 
												width: { 
													min: 1280, 
													ideal: 1920, 
													max: 1920 
												}, 
												height: { 
													min: 720, 
													ideal: 1080, 
													max: 1080 
												},
												facingMode: { exact: "environment" }
    										}
    									})
	  .then(stream => video.srcObject = stream)
	  .catch(e => alert(e.name + ": "+ e.message));
  
	var log = msg => video.innerHTML += msg + "<br>";
}

function get_login(){
	window.plugins.googleplus.trySilentLogin(
		{
			'webClientId': '1065070870317-v1sf6qin2nt1vh082gv7jq6ru2em66sg.apps.googleusercontent.com',
      		'offline': true
      	},
		function (obj) {
			userid = $.ajax({
					type: "POST",
					url: "http://citisens.eu/checkUser.php",
					async: false,
					data: {
						idToken: obj.idToken, email: obj.email, userimage: obj.imageUrl, username: obj.displayName, googleid: obj.userId
					}
				}).responseText;
			if(userid=="Unauthorized")
			{
				alert("You are not authorized to run CITISENS.");
				navigator.app.exitApp();				
			}
		},
		function (msg) {
			window.plugins.googleplus.login(
				{
					'webClientId': '1065070870317-v1sf6qin2nt1vh082gv7jq6ru2em66sg.apps.googleusercontent.com',
					'offline': true				
				},
				function (obj) {
					userid = $.ajax({
							type: "POST",
							url: "http://citisens.eu/checkUser.php",
							async: false,
							data: {
								idToken: obj.idToken, email: obj.email, userimage: obj.imageUrl, username: obj.displayName, googleid: obj.userId
							}
						}).responseText;
					if(userid=="Unauthorized")
					{
						alert("You are not authorized to run CITISENS.");
						navigator.app.exitApp();				
					}	
				},
				function (msg) {
				  $('.roll span').text('error: ' + msg);
				  alert("You are not authorized to run CITISENS.");
				  navigator.app.exitApp();
				}
			);
		}
	);
}


var canvasWidth;
var canvasHeight;
var manufacturer;
var model;
var platform;
var version;	


var onDeviceReady = function () {                          // called when Cordova is ready

/*	
	cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
		switch(status){
			case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
				console.log("Location permission not requested");
				break;
			case cordova.plugins.diagnostic.permissionStatus.GRANTED:
				get_location();
				console.log("Location permission granted");
				break;
			case cordova.plugins.diagnostic.permissionStatus.DENIED:
				console.log("Location permission denied");
				break;
			case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
				console.log("Location permission permanently denied");
				break;
		}
	}, function(error){
		console.error(error);
	});
		
	cordova.plugins.diagnostic.requestCameraAuthorization(function(status){
		console.log("Authorization request for camera use was " + (status == cordova.plugins.diagnostic.permissionStatus.GRANTED ? "granted" : "denied"));
		get_camera();
	}, function(error){
		console.error(error);
	});

	cordova.plugins.diagnostic.requestContactsAuthorization(function(status){
		if(status === cordova.plugins.diagnostic.permissionStatus.GRANTED){
			console.log("Contacts use is authorized");
			get_login();
		}
	}, function(error){
		console.error(error);
	});	
*/
cordova.plugins.diagnostic.requestRuntimePermissions(function(statuses){
    for (var permission in statuses){
        switch(statuses[permission]){
            case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                console.log("Permission granted to use "+permission);
                
                get_location();
				get_camera();
				get_login();
                
                break;
            case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
                console.log("Permission to use "+permission+" has not been requested yet");
                break;
            case cordova.plugins.diagnostic.permissionStatus.DENIED:
                console.log("Permission denied to use "+permission+" - ask again?");
                break;
            case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                console.log("Permission permanently denied to use "+permission+" - guess we won't be using it then!");
                break;
        }
    }
}, function(error){
    console.error("The following error occurred: "+error);
},[
    cordova.plugins.diagnostic.runtimePermission.ACCESS_FINE_LOCATION,
    cordova.plugins.diagnostic.runtimePermission.ACCESS_COARSE_LOCATION,
    cordova.plugins.diagnostic.runtimePermission.RECORD_VIDEO,
    cordova.plugins.diagnostic.runtimePermission.CAMERA,
    cordova.plugins.diagnostic.runtimePermission.GET_ACCOUNTS,
    cordova.plugins.diagnostic.runtimePermission.USE_CREDENTIALS,
    cordova.plugins.diagnostic.runtimePermission.VIBRATE
]);




	canvasWidth = Math.floor($('#video').width())*2;
	canvasHeight = Math.floor($('#video').height())*2;

	canvasWidth2=Math.floor($('#canvas').width()/2);
	canvasHeight2=Math.floor($('#canvas').height()/2);
	
	manufacturer = device.manufacturer;
	model = device.model;
	platform = device.platform;
	version = device.version;	
	
	if (navigator.fusion) {
		console.log('SensorFusion available.');
		// Set operation mode to 'Android Rotation Vector'
		navigator.fusion.setMode(function (result) {
			console.log('result', result);
		}, function (err) {
			console.log('err', err);
		}, {
			mode: fusionModeVar
		});
        fusionWatchID = navigator.fusion.watchSensorFusion(function (result) {
	
			iterLong=iterLong%arraySizeLong;

			he =  ((result.eulerAngles.yaw/degToRad + 90) + headingOffset)%360;
			if(he<0)
				he=360+he;
			pit = - (result.eulerAngles.roll/degToRad + 90) + pitchOffset;
			ro = result.eulerAngles.pitch/degToRad;

			//$('.roll span').text('yaw: ' + (he).toFixed(1) + ' pitch: ' + (pit).toFixed(1) + ' roll: ' + (ro).toFixed(1));

			yawArrayLong[iterLong]=he;
			pitchArrayLong[iterLong]=pit;
			rollArrayLong[iterLong]=ro;
			
			heStd = yawArrayLong.std();
			roStd = rollArrayLong.std();
			pitStd = pitchArrayLong.std();

			if(iterLong==arraySizeLong-1 && figure8ed==0)
			{
				if(heStd>7 && roStd>7 && pitStd>7)
				{
					figure8ed=1;
					$('#figure8Button').css('color','green');
					navigator.vibrate(500);
				}
			} 			

			if(flying==0)
			{
				$('.heading span').text(he.toFixed(1)+'º');//+' ('+heStd.toFixed(3)+')');
				$('.pitch span').text(pit.toFixed(1)+'º');//+' ('+pitStd.toFixed(3)+')');
				//$('.roll span').text(ro.toFixed(1)+'º');//+' ('+roStd.toFixed(3)+')');
						
				camera.setView({
					destination : Cesium.Cartesian3.fromDegrees(posLon, posLat, 1.7),
					orientation: {
						heading : Cesium.Math.toRadians(he),
						pitch : Cesium.Math.toRadians(pit),
						roll : Cesium.Math.toRadians(0)
					}
				});	
			}

			iterLong++;		
			
		}, function (err) {
			console.log('error', err);
		}, {
			frequency: 19
		});
	}
	$('#fusionButton').text(fusionModeVar);
	
	navigator.splashscreen.hide();                   // hide splash screen	
};

document.addEventListener("deviceready", onDeviceReady, false);


var targetPath='./img/fire.png';


document.getElementById("circle").addEventListener("click", function() {

	navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

	if (navigator.vibrate) {
		navigator.vibrate(100);
	}

/**********/
// var ray = scene.camera.getPickRay(windowCoordinates);
// var intersection = globe.pick(ray, scene);
/**********/

	var oldPoint = destVincenty(parseFloat(posLat), parseFloat(posLon), he, 0);

	var positions = [Cesium.Cartographic.fromDegrees(posLon, posLat)];

	var hetemp = he;
	var i;
	for(i=1; i<steps; i++)
	{
		var newPoint = destVincenty(oldPoint.lat, oldPoint.lon, hetemp, step);
		positions[i] = Cesium.Cartographic.fromDegrees(newPoint.lon, newPoint.lat);
		oldPoint = newPoint;
	}

	var promise = Cesium.sampleTerrain(terrainProvider, 14, positions);
	Cesium.when(promise, function(updatedPositions) {
		var cameraBeamAlt = 1.7 + updatedPositions[0].height;
		i=0;
		var fail=0;
		var pitemp = pit;
		var minDif=999999999;
		var minDifPos=-1;
		var minDifCameraAlt=0;
		var sinStep = Cesium.Math.asinClamped(Cesium.Math.toRadians(pitemp))*step;// /Cesium.Math.asinClamped(Cesium.Math.toRadians(90-(pit)));
		while(cameraBeamAlt>updatedPositions[i].height && i<steps-1)
		{
			i++;
			cameraBeamAlt = cameraBeamAlt + sinStep;
			if((cameraBeamAlt-updatedPositions[i].height)/i<minDif)
			{
				minDif=(cameraBeamAlt-updatedPositions[i].height)/i;
				minDifPos=i;
				minDifCameraAlt=cameraBeamAlt;
			}
		}
		if(i==(steps-1) && minDifCameraAlt<step)
		{
			i=minDifPos;
			cameraBeamAlt=minDifCameraAlt;
		}
		else if(i==(steps-1))
		{
			fail=1;
		}

		distanceUT = Math.sqrt(Math.pow(i*step, 2) + Math.pow((cameraBeamAlt-updatedPositions[0].height-1.7), 2));

		targetLon = Cesium.Math.toDegrees(updatedPositions[i].longitude);
		targetLat = Cesium.Math.toDegrees(updatedPositions[i].latitude);
		targetAlt = updatedPositions[i].height;

		var flytoHeight = parseFloat(targetAlt*4);

		if(!calibrationON && !fail)
		{	
			billboardCollection.add({
				position : Cesium.Cartesian3.fromDegrees(targetLon, targetLat),
				image : targetPath,
				pixelOffset : Cesium.Cartesian2.ZERO,
				eyeOffset : Cesium.Cartesian3.ZERO,
				horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
				verticalOrigin : Cesium.VerticalOrigin.CENTER,
				scale: 0.5,
				heightReference : Cesium.HeightReference.CLAMP_TO_GROUND
			});

			var canvas = document.getElementById("canvas");
			context = canvas.getContext("2d");
			context.drawImage(video, 0, 0);

			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			context = canvas.getContext("2d");
			context.drawImage(video, 0, 0, canvasWidth, canvasHeight);

			context = canvas.getContext("2d");
			var canvasData = context.getImageData(0, 0, canvasWidth, canvasHeight);

			function drawPixel (x, y, r, g, b, a) {
				var index = (x + y * $('#canvas').width()) * 4;

				canvasData.data[index + 0] = r;
				canvasData.data[index + 1] = g;
				canvasData.data[index + 2] = b;
				canvasData.data[index + 3] = a;
			}

			function updateCanvas() {
				context.putImageData(canvasData, 0, 0);
			}

			var canvasWidth2=canvasWidth/2;
			var canvasHeight2=canvasHeight/2;

			drawPixel(canvasWidth2, canvasHeight2, 255, 0, 0, 255);
			drawPixel(canvasWidth2, canvasHeight2+1, 255, 0, 0, 255);
			drawPixel(canvasWidth2, canvasHeight2-1, 255, 0, 0, 255);
			drawPixel(canvasWidth2+1, canvasHeight2, 255, 0, 0, 255);
			drawPixel(canvasWidth2-1, canvasHeight2, 255, 0, 0, 255);
			drawPixel(canvasWidth2, canvasHeight2+2, 255, 0, 0, 255);
			drawPixel(canvasWidth2, canvasHeight2-2, 255, 0, 0, 255);
			drawPixel(canvasWidth2+2, canvasHeight2, 255, 0, 0, 255);
			drawPixel(canvasWidth2-2, canvasHeight2, 255, 0, 0, 255);

			updateCanvas();

			var dataURL = canvas.toDataURL("image/jpeg");

			$.ajax({
				type: "POST",
				url: "http://citisens.eu/saveImage.php",
				data: {
					imgBase64: dataURL,
					pitch: pit,
					roll: ro,
					heading: he,
					pitchStd: pitStd,
					rollStd: roStd,
					headingStd: heStd,
					targetLAT: targetLat,
					targetLON: targetLon,
					userLAT: posLat,
					userLON: posLon,
					userPOSacc: posAcc,
					distance: distanceUT,
					calibrated: calibrated,
					usingVirtual: viewer3D,
					figure8ed: figure8ed,
					userid: userid,
					model: model,
					manufacturer: manufacturer,
					platform: platform,
					version: version
				}
			}).done(function(o) {
				console.log('report sent');
			});
		}

		if(calibrationON==1 && headingTemp==0){
			headingTemp=he;
			pitchTemp=pit;
			rollTemp=ro;
			toggleViewer();
		}
		else if(calibrationON==1 && headingOffset==0){
			headingOffset=headingTemp-he;
			rollOffset=rollTemp-ro;
			pitchOffset=pitchTemp-pit;

			calibrationON=0;
			calibrated=1;
			$('#calibrationButton').css('color','green');
			navigator.vibrate(100);
			toggleViewer();
		}
		
		if(fail)
		{
			$(".distance span").text('null');				
			$(".altitude span").text('null');
	    	$(".longitude span").text('null');
	    	$(".latitude span").text('null');		
		}
		else
		{
			$(".distance span").text(distanceUT.toFixed(2)+' m.');
	    	$(".altitude span").text(targetAlt.toFixed(2)+' m.');
	    	$(".longitude span").text(targetLon.toFixed(2)+'º');
	    	$(".latitude span").text(targetLat.toFixed(2)+'º');
	    }

    	$('.metricsInfo').addClass('show');  
    	setTimeout(function(){$('.metricsInfo').removeClass('show');},4000)
    	$('.metrics').center();
	});

    $('#circle').css('display','none');
    $('#circleClick').css('display','block');  	

	setTimeout(function(){
		$('#circle').css('display','block'); 
		$('#circleClick').css('display','none');
	},100)
});


jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + 
                                                $(window).scrollTop()) + "px");
    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + 
                                                $(window).scrollLeft()) + "px");
    return this;
}