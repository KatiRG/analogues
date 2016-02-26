<?php

$command=$_GET["command"];
$dateStart=$_GET["dateStart"];
$dateEnd=$_GET["dateEnd"];

header('Content-Type: image/gif');
passthru("./maps2_run.bash '".$command."' '".$dateStart."' '".$dateEnd."'");

ob_flush();
flush();
ob_flush();
flush();


?>