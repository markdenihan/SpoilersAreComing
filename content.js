//console.log("content.js is Running");

var alertActive = false;
var lastMutationSearch = new Date(Date.now());
lastMutationSearch = new Date(lastMutationSearch.getTime() - 1000*10);

//Search for Words That Might be Spoilers
( function main () {
	function EventHub ( hub_name ) {
		var private = {
			events: {},
			add_one: function ( name, observer ) {
				if ( typeof private.events[ name ] === 'undefined' ) {
					private.events[ name ] = [];
				}
				private.events[ name ].push( observer );
			},
			remove: function ( name ) {
				private.events[ name ] = undefined;
			}
		};

		var public =  {
			add: function ( observers ) {
				Object.keys( observers ).forEach( function ( name ) {
					private.add_one(name, observers[name]);
				});
			},

			fire: function ( name, data ) {
				if ( typeof private.events[ name ] !== 'undefined' ) {
					private.events[ name ].forEach( function ( observer ) {
						observer(data);
					});
				};
			},

			stop: function () {
				public.fire = function () {}
			}
		};
		return public;

	};

	function Scanner () {

		var public = {
			get_matches_amount: function ( text, phrases ) {
				var matches_amount = 0;
				text = text.toLowerCase();
				phrases.forEach( function ( phrase ) {
					if ( text.indexOf( phrase.toLowerCase() ) > -1 ){
						console.log("Found Phrase: '" + phrase.toLowerCase() + "'");
						matches_amount++;
					}
					else {
						//console.log("Could not find. Returned: " + text.indexOf( phrase.toLowerCase()));
					}
				});
				//console.log("Found " + matches_amount + " phrases");
				return matches_amount;
			}
		};
		return public;
	};

	function Overlay (document, event_hub) {

		var private = {
			element: null
		};

		var public = {
			add: function ( warning_message, high_sev, medium_sev) {
				var warning_title = "";
				var advisory_message = "";
				if(high_sev){
					warning_title = "spoiler warning detected";
					advisory_message = "this page has phrases that specifically warn about game of thrones spoilers";
				} else if(medium_sev){
					warning_title = "possible spoiler detected";
					advisory_message = "this page has spoilery phrases about game of thrones characters";
				} else {
				warning_title = "mild spoiler warning";
				advisory_message = "this page has game of thrones references and may contain a spoiler";
			}
				private.element = document.createElement( "div" );
				private.element.id = "spoilers_blocker_overlay";
				private.element.innerHTML =
					"<div>"+
						"<div id = 'spoiler_blocker_header' >"+warning_title+"</div>"+
						"<div id = 'spoiler_blocker_warning_message' >"+warning_message+"</div>"+
						"<div id = 'spoilers_advisory_message' id='spoilers_advisory_message'>"+advisory_message+"</div>"+
						"<div class = 'spoilers_blocker_overlay_button' id = 'spoilers_blocker_continue_button' >Continue anyway</div>"+
					"</div>";
				document.body.appendChild( private.element );
		    	lastMutationSearch = new Date(Date.now());
		    	lastMutationSearch = new Date(lastMutationSearch.getTime() + 1000*5);
				alertActive = true;
				private.element.querySelector("#spoilers_blocker_continue_button").addEventListener( "click", function () {
					event_hub.fire( "continue_button_click" );
				});
			},

			hide: function () {
				console.log("Hiding Warning");
				//Remove Message
				$("#spoilers_blocker_overlay").remove();
				lastMutationSearch = new Date(Date.now());
				lastMutationSearch = new Date(lastMutationSearch.getTime() + 1000*10);
				alertActive = false;
			}
		};
		return public;
	};

	function Controller ( scanner, overlay, event_hub, storage, banned_phrases, instant_spoiler_phrases, character_names,	actor_names,	spoiler_verbs_after,	spoiler_verbs_before, warning_messages ) {

		event_hub.add({
			"continue_button_click": function () {
				overlay.hide();
				lastMutationSearch = new Date(Date.now());
				lastMutationSearch = new Date(lastMutationSearch.getTime() + 1000*10);
				alertActive = false;
			},
		});

		( function constructor () {
			storage.local.get( null, function ( items ) {
				if(!alertActive){
					var general_threshold = 3;
					var high_sev = false;
					var medium_sev = false;
					var low_sev = false;
					//First Check for Instant Spoilers
					var banned_phrases_amount = 0;
					var instant_spoiler_phrases_amount = scanner.get_matches_amount( window.document.body.innerText, instant_spoiler_phrases );
					if(!(instant_spoiler_phrases_amount >= 1)){
						//Build Potential Spoiler Array
						var potential_spoiler_phrases = [];
						character_names.forEach( function ( name ) {
							spoiler_verbs_before.forEach( function ( verb ) {
								potential_spoiler_phrases.push(verb + name);
							});
							spoiler_verbs_after.forEach( function ( verb ) {
								potential_spoiler_phrases.push(name + verb);
							});
						});
						//console.log("Spoiler Warnings Not Detected. Searching For "+potential_spoiler_phrases.length+" spoiler phrases");
						//Search for Full CharacterName + Spoiler Verb / Character First Name + Spoiler spoiler_verbs_before
						instant_spoiler_phrases_amount = scanner.get_matches_amount( window.document.body.innerText, potential_spoiler_phrases );
						if (!(instant_spoiler_phrases_amount > 0)){
							//console.log("Potential Spoilers Not Detected. Searching for General Content");
							banned_phrases_amount = scanner.get_matches_amount( window.document.body.innerText, banned_phrases );
							if (!(banned_phrases_amount > general_threshold)){
								//console.log("General Search found " + banned_phrases_amount + ". Continuing...");
								banned_phrases_amount = banned_phrases_amount + scanner.get_matches_amount( window.document.body.innerText, character_names );
								if (!(banned_phrases_amount > general_threshold)){
										//console.log("General Search + Character Search found " + banned_phrases_amount + ". Finally Searching for Actor Names...");
										banned_phrases_amount = banned_phrases_amount + scanner.get_matches_amount( window.document.body.innerText, actor_names );
								}
							}
						} else {
							medium_sev = true;
							//console.log("Possible Spoiler Detected. Not Searching Any More");
						}
					} else {
						high_sev = true;
						//console.log("Instant Spoiler Detected. Not Searching Any Further.");
					}
					if (banned_phrases_amount >= general_threshold || ( instant_spoiler_phrases_amount >= 1)) {
						if ( items.enabled || items.enabled === undefined ) {
							if(!alertActive){
								console.log("Painting Warning Message");
								overlay.add( warning_messages[ Math.floor( Math.random() * warning_messages.length ) ], high_sev, medium_sev );
							} else {
								console.log("Warning is already active. Not Painting Again");
							}
						}
					} else {
						console.log("Failed to Find Game of Thrones Spoilers");
					}
				} else {
					console.log("Alert is already active. Not Searching");
				}
			});

		} () )
	};

	( function constructor () {

		var event_hub = new EventHub();

		var warning_messages = [
			"This page is Dark and full of Spoilers",
			"What do we say to the Page of Spoilers? Not Today!",
			"The man who passes the Spoiler should swing the sword.",
			"When you play the Game of Spoilers, you win or you die.",
			"When Spoilers and worse come hunting... you think it matters who sits on the Iron Throne?",
			"There is a beast in every man and it stirs when you put a Spoiler in his Head.",
			"Hodor",
			"Spoilers cut deeper than swords",
			"If they want to give you a Spoiler, take it, make it your own. Then they can’t hurt you with it anymore.",
			"Of all the ways I’d kill you, Spoilers would be the last.",
			"They say all sorts of crazy Spoilers North of the Wall",
			"Spoilers cannot kill a dragon"
		];

		var spoiler_phrases = [
			"game of thrones",
			"game-of-thrones",
			"game of thrones season eight",
			"game of thrones season 8",
			"king in the north",
			"the winds of winter",
			"westeros",
			"iron throne",
			"seven kingdoms",
			"dany's",
			"dragon",
			"night’s king",
			"night's king",
			"night king",
			"whitewalker",
			"winterfell",
			"dragonstone",
			"crows eye",
			"winter is coming",
			"winter is here",
			"dorne",
			"dothraki"
		];

		var instant_spoiler_phrases = [
			"potential spoilers",
			"game of thrones spoiler",
			"game-of-thrones-spoiler",
			"game_of_thrones_spoiler",
			"game of thrones spoilers",
			"game-of-thrones-spoilers",
			"game_of_thrones_spoilers",
			"game of thrones season 8 spoiler",
			"spoilers for game of thrones",
			"game of thrones finale",
			"spoilers are coming",
			"jon snow spoilers",
			"spoiler alert",
			"spoilers alert",
			"spoiler ahead",
			"spoilers ahead",
			"#spoiler",
			"season 8 spoiler",
			"season 8 game of thrones",
			"GoT season 8",
			"got spoiler",
			"spoilers for game of thrones"
		];

		var character_names = [
			"eddard stark",
			"ned stark",
			"robert baratheon",
			"jaime lannister",
			"jaime",
			"catelyn stark",
			"cersei lannister",
			"cersei",
			"daenerys targaryen",
			"daenerys",
			"dany targaryen",
			"rhaegar targaryen",
			"lyanna stark",
			"jorah mormont",
			"jorah",
			"petyr baelish",
			"littlefinger",
			"viserys",
			"jon snow",
			"jon",
			"aegon targaryen",
			"aegon",
			"sansa stark",
			"sansa",
			"arya stark",
			"arya",
			"robb stark",
			"theon greyjoy",
			"theon",
			"reek",
			"bran stark",
			"bran",
			"brandon stark",
			"sandor clegane",
			"the hound",
			"tyrion lannister",
			"tyrion",
			"khal drogo",
			"tywin lannister",
			"davos seaworth",
			"davos",
			"samwell tarly",
			"sam tarly",
			"samwell",
			"margaery tyrell",
			"stannis baratheon",
			"melisandre",
			"jeor mormont",
			"bronn",
			"varys",
			"ygritte",
			"gendry",
			"tormund giantsbane",
			"tormund",
			"gilly",
			"brienne of tarth",
			"brienne",
			"ellaria sand",
			"daario naharis",
			"missandei",
			"jaqen h'ghar",
			"roose bolton",
			"the high sparrow",
			"hodor",
			"gregor clegane",
			"the mountain",
			"janos slynt",
			"irri",
			"doreah",
			"kevan lannister",
			"maester aemon",
			"hot pie",
			"beric dondarrion",
			"beric",
			"podrick payne",
			"podrick",
			"eddison tollett",
			"yara greyjoy",
			"yara",
			"grey worm",
			"qyburn",
			"meera reed",
			"meera",
			"jojen reed",
			"thoros of myr",
			"mace tyrell",
			"bowen marsh",
			"night king",
			"drogon",
			"rhaegal",
			"viserion",
			"ghost",
			"nymeria",
			"three-eyed",
			"euron greyjoy",
			"euron",
			"mother of dragons",
			"king in the north"
		];

		var actor_names = [
			"sean bean",
			"mark addy",
			"nikolaj coster-waldau",
			"michelle fairley",
			"lena headey",
			"emilia clarke",
			"iain glen",
			"aidan gillen",
			"harry lloyd",
			"kit harington",
			"sophie turner",
			"maisie williams",
			"richard madden",
			"alfie allen",
			"isaac hempstead wright",
			"jack gleeson",
			"rory mccann",
			"peter dinklage",
			"jason momoa",
			"charles dance",
			"liam cunningham",
			"john bradley",
			"natalie dormer",
			"stephen dillane",
			"carice van houten",
			"james cosmo",
			"jerome flynn",
			"conleth hill",
			"sibel kekilli",
			"rose leslie",
			"oona chaplin",
			"joe dempsie",
			"kristofer hivju",
			"hannah murray",
			"gwendoline christie",
			"iwan rheon",
			"indira varma",
			"michiel huisman",
			"nathalie emmanue",
			"tom wlaschiha",
			"dean-charles chapman",
			"michael mcelhatton",
			"jonathan pryce",
			"julian glover",
			"ian beattie",
			"kristian nairn",
			"mark stanley",
			"natalia tena",
			"art parkinson",
			"esmé bianco",
			"hafþór júlíus björnsson",
			"dominic carter",
			"eugene simon",
			"nell tiger free",
			"ron donachie",
			"donald sumpter",
			"amrita acharia",
			"roxanne mckee",
			"ian gelder",
			"ian mcelhinney",
			"luke barnes",
			"peter vaughan",
			"josef altin",
			"owen teale",
			"brian fortune",
			"finn jones",
			"ben hawkey",
			"richard dormer",
			"daniel portman",
			"ben crompton",
			"gemma whelan",
			"tara fitzgerald",
			"william & james wilson",
			"jacob anderson",
			"anton lesser",
			"diana rigg",
			"kerry ingram",
			"ellie kendrick",
			"thomas brodie-sangster",
			"paul kaye",
			"rupert vansittart",
			"brenock o'connor",
			"roger ashton-griffiths",
			"faye marsay",
			"michael condron",
			"richard brake",
			"ian whyte"
		]

		var spoiler_verbs_after = [
			" kill",
			" die",
			" marry",
			" married",
			" murder",
			" is dead",
			" has died",
			" was killed",
			" return",
			" is back",
			" betray",
			" captur",
			" abandon"
		];

		var spoiler_verbs_before = [
			"killed ",
			"killed by ",
			"married ",
			"murdered ",
			"stabbed ",
			"kills ",
			"betrays ",
			"betrayed by ",
			"captured ",
			"abandoned "
		];

		new Controller(
			new Scanner(),
			new Overlay( document, event_hub ),
			event_hub,
			chrome.storage,
			spoiler_phrases,
			instant_spoiler_phrases,
			character_names,
			actor_names,
			spoiler_verbs_after,
			spoiler_verbs_before,
			warning_messages
		)

		$(document).ready(function(){
			//Doc is Ready
			//console.log("Document Ready Run...");
			new Controller(
					new Scanner(),
					new Overlay( document, event_hub ),
					event_hub,
					chrome.storage,
					spoiler_phrases,
					instant_spoiler_phrases,
					character_names,
					actor_names,
					spoiler_verbs_after,
					spoiler_verbs_before,
					warning_messages
				)
		});

		$('body').change(function(){
			//console.log("Body Element has Changed. Searching Again...");
			new Controller(
					new Scanner(),
					new Overlay( document, event_hub ),
					event_hub,
					chrome.storage,
					spoiler_phrases,
					instant_spoiler_phrases,
					character_names,
					actor_names,
					spoiler_verbs_after,
					spoiler_verbs_before,
					warning_messages
				)
		});

		//Create a Mutation Observer to ReSearch every time something in the page updates
		// select the target node
		var target = document.querySelector('body');

		// create an observer instance
		var observer = new MutationObserver(function(mutations) {
		  mutations.forEach(function(mutation) {
		    //console.log("Mutation Detected: " + mutation.type);
		    if(alertActive){
		    	//console.log("Not Searching. Alert Active");
		    } else {
		    	var time = new Date(Date.now());
				var sinceLastSearch = time.getTime() - lastMutationSearch.getTime();
				//console.log("time since last sucessful search: " + sinceLastSearch);
				if(sinceLastSearch <= 7*1000){
					//console.log("Not Searching. Found Spoilers to Recently Ago");
				} else {
					//console.log("Starting Mutation Search");
				    new Controller(
							new Scanner(),
							new Overlay( document, event_hub ),
							event_hub,
							chrome.storage,
							spoiler_phrases,
							instant_spoiler_phrases,
							character_names,
							actor_names,
							spoiler_verbs_after,
							spoiler_verbs_before,
							warning_messages
						)
				}
		    }
		  });
		});

		// configuration of the observer:
		var config = { attributes: true, childList: true, characterData: true };
		// pass in the target node, as well as the observer options
		observer.observe(target, config);

	} () )
} () )
