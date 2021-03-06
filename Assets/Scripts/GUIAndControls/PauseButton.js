﻿#pragma strict

var gui : GameObject;
var guipause : GameObject;


private var isPaused : boolean = false;
private var currentState : boolean = false;
private var isGameActive : boolean = true;

function Update () {
	if (Input.GetKeyDown("escape")) {
    	ButtonClick();
	}
    if (currentState != isPaused) {
	    Pause(isPaused);
	}
}

function ButtonClick () {
	if (!isPaused) {
	    Time.timeScale = 0.0;
	    isPaused = true;
    } else if (isPaused) {
	    Time.timeScale = 1.0;
	    isPaused = false;
    }
}

function Pause (isActive : boolean) {
	currentState = isPaused;
	Camera.main.GetComponent(Blur).enabled = isActive; // Blur aplied
	Camera.main.GetComponent(Vignetting).enabled = isActive; // Vignetting aplied
	gui.SetActive(!isActive); //GUI hide
	guipause.SetActive(isActive); //GUI pause unhide
}

function OnApplicationFocus(focusStatus: boolean) {
	if (focusStatus && !isPaused) ButtonClick();
}