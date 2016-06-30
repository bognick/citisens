<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=Edge">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
		<script src="https://apis.google.com/js/platform.js" async defer></script>
		<meta name="google-signin-client_id" content="416091637495-ent9ltagdq4mf5rln16mrd3r7b1v19mu.apps.googleusercontent.com">
		<title>CITISENS reporter</title>
		<script src="js/jquery-2.1.1.min.js"></script>
		<script src="cesium/Build/Cesium/Cesium.js"></script>
		<script src="js/zepto.min.js"></script>
		<script src="js/modernizr-2.6.1.min.js"></script>
		<script src="js/destLatLon.js"></script>
		<script src="js/gyronorm.complete.min.js"></script>
		<script src="http://cdn.peerjs.com/0.3/peer.js"></script>
		
		<script>
<?php
/*
		include("db/connection.php");
		$db_handle = mysql_connect($db_host, $username, $password);
		$db_found = mysql_select_db($db_name, $db_handle);
		
		$volunteerID=-1;
		
		$SQL2 = "SELECT identifier FROM volunteers ORDER BY usersNum LIMIT 1";
		$result2 = mysql_query($SQL2);
		if(mysql_num_rows($result2)!=0){
			$row = mysql_fetch_row($result2);
			$volunteerID=$row[0];
		}

		echo "var volunteerID='".$volunteerID."';";
*/
?>				
		</script>
		<link href="css/citisens.css" rel="stylesheet" type="text/css" />
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
	</head>
	<body>
		<div class="buttonsFrame">
			<button style="display: inline-block;" type="button" onclick="fly()" id="flyButton" class="buttons fa fa-plane"></button>
			<button style="display: inline-block;" type="button" onclick="#" id="figure8Button" class="buttons">8</button>			
			<button style="display: inline-block;" type="button" onclick="calibration()" id="calibrationButton" class="buttons fa fa-cogs"></button>
			<button style="display: inline-block;" type="button" onclick="toggleViewer()" id="toggleButton" class="buttons fa fa-globe"></button>
			<div class="g-signin2" data-onsuccess="onSignIn" id="signinButton"></div>
		</div>
		
		<div id="cameraContainer">
			<video id="video"></video>
		</div>
		
		<div id="messageContainer" style="display:none">
			<b>CITISENS works only at portrait orientation</b>
		</div>

		<div id="cesiumContainer"></div>
		<div class="buttonsFrame">
			<img src="img/circle.png" id="circle"/>	
			<img src="img/circleClicked.png" id="circleClick">
			<img src="img/cross.png" id="cross">
			<p class="position">Position accuracy: <span></span> </p>
			<p class="heading">Heading: <span></span> </p>
			<p class="pitch">Pitch: <span></span> </p>
			<p class="roll">Roll: <span></span> </p>
		</div>
		
		<div class="metrics">
            <div class="metricsInfo">
                <p class="distance">Distance: <span></span> </p>
                <p class="altitude">Altitude: <span></span> </p>
                <p class="longitude">Longitude: <span></span> </p>
                <p class="latitude">Latitude: <span></span> </p>
             </div>
		</div>
		
		<canvas id="canvas"></canvas>

		<script src="js/citisens.js"></script>
	</body>
</html>
