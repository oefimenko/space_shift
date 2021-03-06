﻿#pragma strict
import System.Collections.Generic;
import System.Linq;

private var player : GameObject;
private var lastEnemy : GameObject;
public var gameOverGui : GameObject;
public var gameWinGui : GameObject;
public var ingameGui : GameObject;
public var gameScore : Score;
private var scoreCounters : List.<GUIText>;
private var currentScore : int = 0;
private var soundSource : AudioSource;
private var gameEnd : boolean = false;

function Start () {
	player = GameObject.FindGameObjectWithTag("Player");
	var allEnemies : List.<GameObject> = GameObject.FindGameObjectsWithTag("Enemy").OrderBy(function(a){return a.transform.position.x;}).ToList();
	lastEnemy = allEnemies[allEnemies.Count() - 1];
	soundSource = this.GetComponent.<AudioSource>();
}

function Update () {
	if (gameEnd == false) {
		if (player == null) {
			GameEnd(false);
		} else if (lastEnemy == null) {
			GameEnd(true);
		}
	} else {
		Camera.main.GetComponent.<AudioSource>().volume -= 0.001f;
	}
	if (scoreCounters != null && scoreCounters.Count > 0) {
		for (i in scoreCounters) {
			if (currentScore + 50 < gameScore.GetScore()) { currentScore += 50; }
			if (currentScore + 20 < gameScore.GetScore()) { currentScore += 20; }
			if (currentScore + 1 <= gameScore.GetScore()) { currentScore += 1; }
			i.text = "0" * (5 - currentScore.ToString().length) + currentScore.ToString();;
		}
		if (soundSource && !soundSource.isPlaying && currentScore < gameScore.GetScore() && Options.sound) soundSource.Play();
	}
}

function GameEnd (isWin : boolean) {
	gameEnd = true;
	if (isWin) { 
		yield WaitForSeconds (3.0); 
	} else { 
		yield WaitForSeconds (1.5); 
	}
	Time.timeScale = 1.0;
	Camera.main.GetComponent(Blur).enabled = true; // Blur aplied
	Camera.main.GetComponent(Vignetting).enabled = true; // Vignetting aplied
	ingameGui.SetActive(false);
	if (isWin) {
		gameWinGui.SetActive(true);
		StarActivation();
		SaveProgress();
	} else {
		gameOverGui.SetActive(true);
	}
	scoreCounters = gameObject.GetComponentsInChildren.<GUIText>().ToList();
}

function StarActivation () {
	var stars : List.<Animator> = gameObject.GetComponentsInChildren.<Animator>().OrderBy(function(a){return a.name;}).ToList();
	if ( gameScore.GetScore() * 1.0 / gameScore.GetTotalScore() * 1.0 <= 0.7 && stars[1]) { stars[1].gameObject.SetActive(false); }
	if ( gameScore.GetScore() * 1.0 / gameScore.GetTotalScore() * 1.0 <= 0.85 && stars[2]) { stars[2].gameObject.SetActive(false); }
}


// Adding information about overall progress
function SaveProgress () {
	var nextLevel : int = int.Parse(Application.loadedLevelName[-2:]) + 1;
	var nextLevelName : String = "Level_" + nextLevel.ToString();
	var numberOfStars : int;
	
	if (gameScore.GetScore() * 1.0 / gameScore.GetTotalScore() * 1.0 >= 0.85) { 
		numberOfStars = 3; 
	} else if (gameScore.GetScore() * 1.0 / gameScore.GetTotalScore() * 1.0 >= 0.7) { 
		numberOfStars = 2; 
	} else { 
		numberOfStars = 1; 
	}
	
	if (int.Parse(Application.loadedLevelName[-1:]) == 9) {
		// Commented since zones 1, 2, 3 are not ready
		/*
		var nextZoneOpen : String = "Zone_" + (parseInt(Application.loadedLevelName[-2:][0])- 48 + 1).ToString();
		PlayerPrefs.SetInt(nextZoneOpen, 1);
		PlayerPrefs.SetInt("Video" + nextZoneOpen[-2:][0] + "1", 1);
		*/
	} else if (int.Parse(Application.loadedLevelName[-1:]) == 8) {
		PlayerPrefs.SetInt("Video_" + nextLevel.ToString()[0] + "2", 1);
	}
	
	PlayerPrefs.SetInt(nextLevelName, 1);
	var currentLevel : String = Application.loadedLevelName;
	if (!PlayerPrefs.HasKey("Score" + currentLevel) || PlayerPrefs.GetInt("Score" + currentLevel) < gameScore.GetScore()) { 
		PlayerPrefs.SetInt("Score" + currentLevel, gameScore.GetScore()); 
	}
	if (!PlayerPrefs.HasKey("Stars" + currentLevel) || PlayerPrefs.GetInt("Stars" + currentLevel) < numberOfStars) { 
			PlayerPrefs.SetInt("Stars" + currentLevel, numberOfStars);
	}
	PlayerPrefs.Save();
}