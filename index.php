<?php
include_once "../global_tools.php";
$lastUpdate = "22-05-15-2000"; // when changing this, you should also update sw.js
?>
<!doctype html>
<html lang="en">
<head>
	<?php createHead(
		"Nonogram",
		"Play unlimited randomly generated nonograms, graphical crosswords where you colour in a grid according to the numbers on the rows and columns.",
		null,
		null,
        "2022-05-15",
        "InteractiveResource",
        true
	); ?>

    <link rel="stylesheet" href="/assets/ext/bootstrap.5.1.3.min.css" />
    <link rel="stylesheet" href="nonogram.css?lastUpdate=<?=$lastUpdate?>">

    <link rel="manifest" href="manifest.webmanifest">
    <link rel="icon" href="icons/android-192x192.png" type="image/png">
    <link rel="apple-touch-icon" href="icons/apple-touch-icon.png"/>
    <meta name="apple-mobile-web-app-status-bar" content="#8732f5">
    <meta name="theme-color" content="#8732f5">

    <link rel="preload" as="image" href="images/transparent.webp">
</head>
<body>


<header>
    <h1>Nonogram</h1>
    <button class="btn btn-outline-primary btn-icon btn-refresh" aria-label="Refresh" id="refreshBtn"></button>
</header>
<div class="icon-links" style="display: none;">
    <a class="btn btn-outline-primary btn-icon btn-google-play" href="https://play.google.com/store/apps/details?id=org.hanney.adil.nonogram">
        <img src="/assets/images/logos/google-play-badge.webp" alt="Google Play Store" width="564" height="168">
    </a>
    <a class="btn btn-outline-primary btn-icon btn-github" href="https://github.com/adil192/nonogram-pwa" aria-label="GitHub project"></a>
</div>

<main>
</main>

<footer>
    <div id="difficultyToggleContainer">
        <label for="difficultyToggle">Difficulty</label>
        <input id="difficultyToggle" type="number" value="4" min="1" max="10">
    </div>
    <button class="btn btn-outline-primary btn-icon" aria-label="Toggle cross" id="crossToggle"></button>
    <button class="btn btn-outline-primary btn-icon" aria-label="Clear" id="binBtn"></button>
</footer>

<div class="modal fade" id="wonModal" tabindex="-1" aria-labelledby="wonModalLabel" aria-hidden="true" aria-modal="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title" id="wonModalLabel">Congrats</h2>
                <button class="btn btn-outline-primary btn-icon btn-refresh" aria-label="Refresh" id="newGameBtn" disabled="disabled"></button>
            </div>
            <div class="modal-body">
                Game complete
            </div>
        </div>
    </div>
</div>
<div class="modal-backdrop fade show" id="backdrop" style="display: none;"></div>


<script src="nonogram.js?lastUpdate=<?=$lastUpdate?>" type="module"></script>
</body>
</html>
