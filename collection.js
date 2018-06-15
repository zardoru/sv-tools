
var collection = null;

function collection_save() {
	var name = null;
	while (name === null) {
		var additem = false;
		name = prompt("Please enter a new function name");

		if (name === null)
			break;

		if (name === "") {
			name = null;
			continue;
		}

		if (localStorage.getItem(name) === null) {
			localStorage.setItem(name, editor.getValue());
			additem = true;
		}
		else {
			if (confirm("Are you sure? This will overwrite an existing function.")) {
				localStorage.setItem(name, editor.getValue());
			} else {
				name = null;
				continue;
			}
		}

		if (additem) {
			var opt = document.createElement("option");
			opt.value = name;
			opt.innerHTML = name;
			collection.appendChild(opt);
		}
	}
}

function collection_list_reload()
{
	collection.innerHTML = "";
	for (var i = 0; i < localStorage.length; i++) {
		var key = localStorage.key(i);
		var opt = document.createElement("option");
		opt.value = key;
		opt.innerHTML = key;
		collection.appendChild(opt);
	}
}

function collection_export() {
	var obj = {};
	for (var i = 0; i < localStorage.length; i++) {
		var key = localStorage.key(i);

		if (!key.startsWith("builtin"))
			obj[key] = localStorage.getItem(key);
	}

	var str = JSON.stringify(obj);
	var blob = new Blob([str]);
	saveAs(blob, "export.json");
}

function collection_import() {
	var elem = document.getElementById("fx_import");
	var files = elem.files;
	var reader = new FileReader();

	console.info("importing...")

	reader.onload = (event) => {
		console.info("loaded. parsing...");
		var res = reader.result;
		var json = JSON.parse(res);
		for (var key in json) {
			if (key.startsWith("builtin"))
			{
				console.info("skipping " + key);
				continue;
			}
			if (localStorage.getItem(key) === null) {
				console.info("adding " + key);
				localStorage.setItem(key, json[key]);
			} else {
				console.info("skipping " + key);
			}
		}

		collection_list_reload();
	};

	reader.readAsText(files[0]);
	
}

function collection_delete() {
	for (var i = 0; i < collection.length; i++) {
		var opt = collection.options[i];
		if (opt.selected) {
			collection.removeChild(opt);
			localStorage.removeItem(opt.value);
			collection_delete();
			return;
		}
	}
}

function collection_load() {
	for (var i = 0; i < collection.length; i++) {
		var opt = collection.options[i];
		if (opt.selected) {
			editor.setValue(localStorage.getItem(opt.value));
			break;
		}
	}
}

var builtin_fx = {"monotonic scrolling":"(function(){ \n    var exponent = Math.E;\n    var startSv = 2;\n    var endSv = 1;\n\n    return (x) => { \n        x = Math.pow(x, exponent);\n        return (1 - x) * startSv + x * endSv; \n    }; \n})()\n        ","rate jitter":"(function(){ \n    // note: use 2 divisions per cycle\n    var startSv = 1.5;\n    var dstRate = 1.0; \n    var centerSv = (dstRate - startSv * 0.5) / 0.5;\n    \n    return (x) => {\n        if (x === 0) return startSv;\n        if (x == 0.5) return centerSv;\n        if (x == 1) return dstRate;\n        return 1;\n    }; \n})()","sine":"(function(){ \n    var center = 1.0;\n    var amplitude = 0.2;\n    \n    return (x) => {\n        var angle = 2 * Math.PI * x;\n        var sineval = amplitude * Math.sin(angle) + center;\n        return sineval;\n    }; \n})()","bounce":"(function(){ \n    var center = 1.0;\n    var amplitude = 0.2;\n    \n    return (x) => {\n        var angle = Math.PI * x;\n        var sineval = amplitude * Math.sin(angle) + center;\n        return sineval;\n    }; \n})()","default":"(function(){ \n    // declare variables here\n    return (x) => {\n        // return sv values here\n        return 1;\n    }; \n})()","teleporters":"(function(){ \n    var peakSv = 10;\n    var rate = 1;\n    var duration = 0.1; \n    \n    // make sure your divs/cycle are set so this is\n    // is accurate: \n    // divs/cycle = 1 / duration\n    \n    return (x) => {\n        if (x < duration) return peaksv;\n        else return rate;\n    }; \n})()"};

function collection_init() {
	collection = document.getElementById("tl_fx_collection");
	if (localStorage.length == 0) {
		for(var key in builtin_fx) {
			localStorage.setItem("builtin: " + key, builtin_fx[key]);
		}
	}

	collection_list_reload();
}