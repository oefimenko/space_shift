﻿#pragma strict

public var health : int = 1; 								// Global parameter for health
public var isEnemy : boolean = false;						// Global parameter for enemy - player recognition
public var scoreValue : int;

public var scoreGUI : GameObject;

private var maxHealth : int;
private var isFreezed : boolean = false;
private var freezeTime : float; 

public var specialEffectsHelper : GameObject;
public var enemyExplosionVersion : int = 1;
private var specialEffectsHendler : SpecialEffects;

function Awake() {
	if (specialEffectsHelper != null) {
		specialEffectsHendler = specialEffectsHelper.GetComponentInChildren.<SpecialEffects>();
	}
}


function Start () {
	maxHealth = health;
}

function Update () {
	if (freezeTime > 0) { freezeTime -= Time.deltaTime; }
}

function Damage (damage : int) {							// Reduction of health and destroying object if it below zero
	if (freezeTime <= 0) { health -= damage; }
	if (health <= 0) {
		Destroy(gameObject);
		if (isEnemy) {
			scoreGUI.SendMessage("ScoreIncrease", scoreValue);
			specialEffectsHendler.ApplyEffect("enemyExplosion"+enemyExplosionVersion.ToString(), transform.position, this.gameObject);
		} else {
			var place : Vector3 = Vector3(transform.position.x + renderer.bounds.size.x/2, transform.position.y, transform.position.z);
			specialEffectsHendler.ApplyEffect("playerExplosion", place, this.gameObject);
		}
	} else if (health > 0){
		specialEffectsHendler.ApplyEffect("hit", place, this.gameObject);
	}
}

function OnTriggerEnter2D (otherCollider : Collider2D) {	// Checking collision of shot and object
	var shot : ShotParameters = new otherCollider.gameObject.GetComponent.<ShotParameters>();
	if (shot != null) {
		if (isEnemy != shot.isEnemyShot) {
			Damage(shot.damage);
			Destroy(shot.gameObject);
		}
	}
}

function Repair(amount : int) {
	if (health + amount <= maxHealth) {
		health += amount;
	} else {
	 health = maxHealth;
	}
}

function Freeze(shieldLength : float) {
	freezeTime = shieldLength;
}

function GetMaxHealth () {
	return maxHealth;
}