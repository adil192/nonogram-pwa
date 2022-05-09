<?php
include_once "../global_tools.php";
$lastUpdate = "22-05-06-0000"; // when changing this, you should also update sw.js
?>
<!doctype html>
<html lang="en">
<head>
	<?php createHead(
		"Nonogram",
		null,
		null,
		null,
        "2022-05-06",
        "InteractiveResource",
        true
	); ?>

    <link rel="stylesheet" href="/assets/ext/bootstrap.5.1.3.min.css" />
    <link rel="stylesheet" href="nonogram.css?lastUpdate=<?=$lastUpdate?>">

    <link rel="manifest" href="manifest.webmanifest">
    <link rel="apple-touch-icon" href="/maskable_icon_x192.png">
    <meta name="apple-mobile-web-app-status-bar" content="#8732f5">
    <meta name="theme-color" content="#8732f5">
</head>
<body>


<header>
    <h1>Nonogram</h1>
</header>

<main>
</main>

<footer>
    <div id="difficultyToggleContainer">
        <label for="difficultyToggle">Difficulty</label>
        <input id="difficultyToggle" type="number" value="4" min="1" max="10">
    </div>
    <button class="btn btn-outline-primary" id="crossToggle"></button>
    <button class="btn btn-outline-primary" id="binBtn"></button>
</footer>



<script src="nonogram.js?lastUpdate=<?=$lastUpdate?>" type="module"></script>
</body>
</html>
