

$(document).ready(function() {
	console.log("popup.js running");
	$("#extension_switch").click( function () {
		console.log("Updating Chrome Storage");
		chrome.storage.local.get( null, function ( items ) {
			// if items.enabled is undefined, it means that it has not been toggled yet
			if ( items.enabled === undefined ){
				console.log("Setting Spoilers Are Coming to ON (UNSET BEFORE THIS)");
				items.enabled = true;
			}
			items.enabled = !items.enabled;
			chrome.storage.local.set({ enabled: items.enabled });
			$("#extension_switch").text((items.enabled ? "Spoiler Warnings are ON" : "Spoiler Warnings are OFF"));
		});
	});
	
	console.log("Running function to make sure popup.html shows the right setting");
	//ReLabel if Needed when popup is opened
	chrome.storage.local.get( null, function ( items ) {
		// if items.enabled is undefined, it means that it has not been toggled yet
		if ( items.enabled === undefined ) items.enabled = true;
		chrome.storage.local.set({ enabled: items.enabled });
		$("#extension_switch").text((items.enabled ? "Spoiler Warnings are ON" : "Spoiler Warnings are OFF"));
	});
});



   