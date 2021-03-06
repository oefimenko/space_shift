﻿#pragma strict
import System.Collections.Generic;
import System.Linq;

public var speed = new Vector2(20, 20); 					// Global variable for speed adjusment
public var gunLevel : int = 1;
private var currentGunLevel : int = 0;

public var playerGun : int = 1;
private var currentPlayerGun : int = 0;

private var movement : Vector2;								// Private variable for providing position changes
private var guns : List.<GunTypeComplect>;					// Getting all attached GunTypeComplect components
private var animator : Animator;

private var slomocooldown : float;

// Contorls
private var joystickCircle : JoystickCircle;
private var buttons : GameObject;
private var fireButton : ControllerGUIButton;
private var bombButton : ControllerGUIButton;
private var bombButtonTexture : Texture;

private var specialEffectsHendler : SpecialEffects;
private var soundSource : AudioController;

//Bomb
public var bombPrefab : Transform;
public var bombTreshhold : int = 500;
private var haveBomb : boolean = false;
private var bombActiveThreshold : int = 500;

// Capability limitations
private var limitMovementTimer : float;
private var limitFiringTimer : float;
private var invertMovementTimer : float;
private var limitMessages : GUITimer;

function Awake() {
	joystickCircle = GameObject.FindGameObjectWithTag("GameControllerJoystick").GetComponentInChildren.<JoystickCircle>();
	buttons = GameObject.FindGameObjectWithTag("GameControllerButtons");
	limitMessages = GameObject.FindGameObjectWithTag("GUI").GetComponentInChildren.<GUITimer>();
	animator = GetComponent.<Animator>();
	bombActiveThreshold = bombTreshhold;
	soundSource = this.GetComponent.<AudioController>();
}

function Start () {
	specialEffectsHendler = this.GetComponent.<Health>().GetScriptHelper();
	guns = GetComponentsInChildren.<GunTypeComplect>().OrderBy(function(a){return a.name;}).ToList();
	GunLevelChange(gunLevel);
	GunEnabling(playerGun);
	fireButton = buttons.GetComponentsInChildren.<ControllerGUIButton>().OrderBy(function(a){return a.name;}).ToList()[1];
	bombButton = buttons.GetComponentsInChildren.<ControllerGUIButton>().OrderBy(function(a){return a.name;}).ToList()[0];
	bombButton.SetInactive(haveBomb);
	joystickCircle.Reset();
}

function Update () {
	var inputX : float;
	var inputY : float;
	if (Input.GetAxis("Horizontal") || Input.GetAxis("Vertical")) {
		inputX = Input.GetAxis("Horizontal"); 					// Getting input on 0X axis
		inputY = Input.GetAxis("Vertical");	  					// Getting input on 0Y axis
	                                                  		
	} else {
		inputX = joystickCircle.outputXY.x * joystickCircle.outputForce;
		inputY = joystickCircle.outputXY.y * joystickCircle.outputForce;
	}
	
	movement = new Vector2(inputX * speed.x, inputY * speed.y);
	if (limitMovementTimer > 0f) movement = movement * 0.3;
	if (invertMovementTimer > 0f) movement = movement * -1.0;
	
	// Adding restriction to leave outside the main camera
	var distance = (transform.position - Camera.main.transform.position).z;
	var leftBorder = Camera.main.ViewportToWorldPoint(
      new Vector3(0.01, 0.03, distance)
    ).x;
    var rightBorder = Camera.main.ViewportToWorldPoint(
      new Vector3(0.90, 0.03, distance)
    ).x;
    var bottomBorder = Camera.main.ViewportToWorldPoint(
      new Vector3(0.03, 0.055, distance)
    ).y;
    var topBorder = Camera.main.ViewportToWorldPoint(
      new Vector3(0.03, 0.965, distance)
    ).y;
      
    transform.position = new Vector3(
      Mathf.Clamp(transform.position.x, leftBorder, rightBorder),
      Mathf.Clamp(transform.position.y, bottomBorder, topBorder),
      transform.position.z
    ); 
    										// Detection changes in gun load levels.
    if (currentPlayerGun != playerGun) {
    	GunEnabling(playerGun);
    }
    
    if (currentGunLevel != gunLevel) {
    	GunLevelChange(gunLevel);
    }
    
    var fire : boolean = Input.GetButton("Fire2");
    if (fire || fireButton.hasTouchOnGui) {
    	for (var gun : GunTypeComplect in guns) {
    		if (gun != null && gun.enabled == true && limitFiringTimer <= 0f) { gun.Fire(false, playerGun); }
    	}
    }
    
    var bomb : boolean = Input.GetButtonDown("Bomb");
    if (bomb || bombButton.hasTouchOnGui) {
	   	if (haveBomb) { 
	   		LaunchBomb(); 
	   		if (Options.sound) soundSource.PlayEffect("bombLaunchSound"); 
	   	}
    }
    
    if (slomocooldown > 0f) {
	    slomocooldown -= Time.deltaTime; 
		Slomo(true);
	} else if (slomocooldown <= 0f) {
		Slomo(false);
	}
	
	BombDetection();
	
	// Capability limitations timers
	if (limitMovementTimer > 0f) limitMovementTimer -= Time.deltaTime;
	if (limitFiringTimer > 0f) limitFiringTimer -= Time.deltaTime;
	if (invertMovementTimer > 0f) invertMovementTimer -= Time.deltaTime;
}

function FixedUpdate () {
	rigidbody2D.velocity = movement; 						// Adding velocity to rigidbody2d component
}

function OnCollisionEnter2D(collision : Collision2D) {		// Damaging player and enemy on collision
	var playerDamage : boolean = false;
	var enemy : EnemyScript = collision.gameObject.GetComponent.<EnemyScript>();
	if (enemy != null) {
		var playerHealth : Health = this.GetComponent.<Health>();
		var enemyHealth : Health = enemy.GetComponent.<Health>();
		if (enemyHealth != null) {
			if (enemyHealth.isKamikadze) {
				playerHealth.Damage(enemyHealth.kamikadzeDamage);
			} else {
				playerHealth.Damage(enemyHealth.health * 3);
			}
			enemyHealth.Damage(enemyHealth.health);
		}
	}
}

function OnTriggerEnter2D (otherCollider : Collider2D) {			// Checking collision of Player and PowerUp
	var powerUp : PowerUp = new otherCollider.gameObject.GetComponent.<PowerUp>();
	if (powerUp != null) {
		var playerHealth : Health = this.GetComponent.<Health>();
		var place : Vector3 = Vector3(transform.position.x + renderer.bounds.size.x/2, transform.position.y, transform.position.z);
		switch (powerUp.powerUpType) {
			case 1: 												// Weapon change
				playerGun = powerUp.powerUpValue;
				specialEffectsHendler.ApplyEffect("takingWeapon", place, this.gameObject);
				soundSource.PlayEffect("newWeaponSound");				
				break;
			case 2:													// Weapon improve
				gunLevel += powerUp.powerUpValue;
				specialEffectsHendler.ApplyEffect("takingLevel", place, this.gameObject);
				soundSource.PlayEffect("powerUpSound");				
				break;
			case 3:													// Repair
				playerHealth.Repair(powerUp.powerUpValue);
				specialEffectsHendler.ApplyEffect("takingRepair", place, this.gameObject);
				soundSource.PlayEffect("repairSound");
				break;
			case 4:													// Shield
			 	playerHealth.Freeze(powerUp.powerUpValue * 1.0);
			 	specialEffectsHendler.ApplyEffect("takingFreeze", place, this.gameObject);
				soundSource.PlayEffect("sheildSound");			 	
				break;
			case 5:													// Slo-mo
			 	slomocooldown = powerUp.powerUpValue * 1.0;
			 	specialEffectsHendler.ApplyEffect("takingSlomo", place, this.gameObject);
				soundSource.PlayEffect("slowMoSound");			 	
				break;
		
		}
		Destroy(powerUp.gameObject);
	}
	
}

function GunEnabling (type : int) {
	currentPlayerGun = type;
	if (gunLevel >= 3) {
		gunLevel -= 2;
	} else {
		gunLevel = 1;
	}
	if (type <= guns.Count && type > 0) {							// Enabling neccessary gun
		for (var gun : GunTypeComplect in guns) {					// Disabling all current guns
			gun.enabled = false;
		}
		guns[type - 1].enabled = true;
		if (animator) animator.SetInteger("Weapon", type);
	}
}

function GunLevelChange(level : int) {
	if (level > 4) {
		level = 4;
		gunLevel = 4;
	}
	for (var gun : GunTypeComplect in guns) {
	   	if (gun != null && gun.enabled == true) { 
	   		if (gun.isMultiBarrel) {
	   			gun.GunLevel(level);
	   	 	} else {
	   	 		gun.LevelPass(level);
	   	 	}
	   	}
	}
	currentGunLevel = level;
}

function Slomo (isEnambled : boolean) {
	if (Time.timeScale != 0.0) {
		if (isEnambled) {
			if (Time.timeScale != 0.5) Time.timeScale = 0.5;
			Camera.main.GetComponent(FastBloom).enabled = true;
		} else if (!isEnambled) {
			if (Time.timeScale != 1.0) Time.timeScale = 1.0;
			Camera.main.GetComponent(FastBloom).enabled = false;
		}
	}
}

function LaunchBomb () {
	haveBomb = false;
	var bombTransform = Instantiate(bombPrefab) as Transform;
	var place : Vector3 = Vector3(transform.position.x + renderer.bounds.size.x, transform.position.y - renderer.bounds.size.y / 2, transform.position.z);
	bombTransform.position = place;
	bombButton.SetInactive(haveBomb);				
}

function BombDetection () {
	var score : int = this.GetComponent.<Health>().GetScore();
	if (score >= bombActiveThreshold) {
		haveBomb = true;
		bombActiveThreshold += bombTreshhold;
		bombButton.SetInactive(haveBomb);
	}
}

function OnDestroy () {
	if (buttons) buttons.gameObject.SetActive(false);
	if (joystickCircle) joystickCircle.gameObject.SetActive(false);
}

function StartCapabilityLimit (time : float, type : int) {
	switch (type) {
		case 6:
			limitMovementTimer = time;
			limitMessages.StartShow(2, time);
		break;
		case 7:
			limitFiringTimer = time;
			limitMessages.StartShow(0, time);
		break;
		case 8:
    		invertMovementTimer = time;
    		limitMessages.StartShow(1, time);
    	break;
    }
}

