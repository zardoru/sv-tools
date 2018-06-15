function Calculate2(dstRate, duration, initialSV) {
	return (dstRate - initialSV * duration) / (1 - duration)
}

function mult2sv(mult) {
	return -100.0 / (Math.round(mult * 100) / 100);
}

function getElementFloat(id)
{
	return parseFloat(document.getElementById(id).value);
}

function sv_rateappearance() {
	var dstRate = getElementFloat("ir");
	var duration = getElementFloat("dur");
	var initialSV = getElementFloat("isvc");
	var out = Calculate2(dstRate, duration, initialSV);
	document.getElementById("out").innerHTML = out;
}

// normalize bpm changes
function sv_normalize_bpm() {
	var cnts = getElementFloat("tabp");
	var lines = cnts.split("\n");
	var bpm = getElementFloat("bpmnorm");
	var outobj = document.getElementById("tabpout");
	var dobpmout = document.getElementById("cb_dobpmout").checked;

	outobj.value = "";

	for (var i = 0; i < lines.length; i++) {
		var tpArray = lines[i].split(",");
		var Time = tpArray[0];
		var PointBPM = 60000 / tpArray[1];
		var NewRatio = bpm / PointBPM;

		if (tpArray[6] == "1") {
			if (dobpmout)
				outobj.value += lines[i] + "\n";

			outobj.value += Time + "," + mult2sv(NewRatio);
			for (var k = 2; k < 8; k++) {
				if (k != 6)
					outobj.value += "," + tpArray[k];
				else
					outobj.value += ",0";
			}
			outobj.value += "\n";
		}
	}
	outobj.select();
}

function sv_remove() {
	var cnts = getElementFloat("tabp");
	var lines = cnts.split("\n");
	var outobj = document.getElementById("tabpout");

	outobj.value = "";

	for (var i = 0; i < lines.length; i++) {
		var tpArray = lines[i].split(",");

		if (tpArray[6] == "1") {
			outobj.value += lines[i];
			outobj.value += "\n";
		}
	}

	outobj.select();
}

// Move SV changes by some time.
function sv_move() {
	var cnts = getElementFloat("ta_addtime");
	var lines = cnts.split("\n");
	var out = document.getElementById("ta_addtime_res");
	var deltaTime = getElementFloat("ta_addtime_value");

	out.value = "";

	for (var i = 0; i < lines.length; i++) {
		var tpArray = lines[i].split(",");
		tpArray[0] = deltaTime + parseFloat(tpArray[0]);
		out.value += tpArray.join(",");
		out.value += "\n";
	}

	out.select();
}

// Move from SV1 to SV2 in time with maybe easing
function sv_speedflow() {
	var startSV = getElementFloat("tx_startsv");
	var endSV = getElementFloat("tx_endsv");
	var startTime = getElementFloat("tx_starttime");
	var endTime = getElementFloat("tx_endtime");
	var steps = getElementFloat("tx_steps");
	var quadratic = document.getElementById("cb_quadratic").checked;
	var out = document.getElementById("ta_speedupsout");

	out.value = "";

	// Now to what we use.
	var timestep = (endTime - startTime) / steps;
	var svDelta = Number(endSV - startSV);

	for (var i = 0; i <= steps; i++) {
		var svValue;
		var timeValue;

		if (quadratic) {
			var squareI = Math.pow(i / steps, 2);
			svValue = startSV + squareI * svDelta;
		} else {
			svValue = startSV + svDelta * i / steps;
		}

		var realValue = mult2sv(svValue);

		timeValue = Number(startTime) + timestep * i;
		out.value += timeValue + "," + realValue + ",4,1,0,15,0,0\n";
	}

	out.select();
}

// Arbitrary SV function.
function sv_fx() {
	var start = getElementFloat("tx_effect_start");
	var time_per_cycle = getElementFloat("tx_effect_dur");
	var divisions_per_cycle = getElementFloat("tx_effect_divisions_per_cycle");
	var cycle_cnt = getElementFloat("tx_effect_cycles");
	var effect = null;
	var effects = [];
	var notif = document.getElementById("lbl_notif");
	var include_last = document.getElementById("tx_effect_include_last").checked;

	try {
		effect = eval(editor.getValue());

		if (typeof effect != 'function') {
			notif.innerHTML = "Error: Function is not callable.";
			return;
		} else
			notif.innerHTML = "";

	} catch (e) {
		notif.innerHTML = e.message;
	}

	var last_sv = -1;
	var add_to_output = (sv_time, effvalue) => {
		var new_sv = mult2sv(effvalue);
		if (effvalue < 0.1 || effvalue > 10)
			return;

		if (new_sv != last_sv) {
			effects.push(sv_time + "," + new_sv + ",4,1,0,15,0,0");
			last_sv = new_sv;
		}
	}

	for (var cycle = 0; cycle < cycle_cnt; cycle++) {
		for (var division = 0; division < divisions_per_cycle; division++) {
			var division_lerp = division / divisions_per_cycle;
			var sv_time = Math.round(start + time_per_cycle * cycle + division_lerp * time_per_cycle);
			add_to_output(sv_time, effect(division_lerp));
		}

		if (cycle == (cycle_cnt - 1)) {
			if (include_last) {
				var effvalue = effect(1);
				var sv_time = Math.round(start + time_per_cycle * (cycle + 1));
				add_to_output(sv_time, effvalue);
			}
		}

		
	}

	var output = document.getElementById("ta_effect_output");
	output.value = "";
	for (var line in effects) {
		output.value += effects[line] + "\n";
	}
}

// Inherited to uninherited.
function sv_convert() {
	var inp = document.getElementById("ta_svconvert_input").value.split("\n");
	var out = document.getElementById("ta_svconvert_output");
	out.value = "";

	var points = [];
	for (var key = 0; key < inp.length; key++) {
		var spl = inp[key].split(",");
		if (spl.length > 1)
			points.push(spl);
	}

	points.sort(function (a, b) {
		return parseInt(a[0]) - parseInt(b[0])
	});

	var ip_parents = {};
	var last_uninherited = -1;
	for (var key = 0; key < points.length; key++) {
		if (points[key][6] == "1") {
			last_uninherited = key;
		} else {
			ip_parents[key] = last_uninherited;
		}
	}

	for (var key = 0; key < points.length; key++) {
		if (points[key][6] == "0") {
			var sv_value = mult2sv(parseFloat(points[key][1]));
			var parent_bpm = 60000 / parseFloat(points[ip_parents[key]][1]);
			var new_bpm = parent_bpm * sv_value;
			points[key][1] = 60000 / new_bpm;
			points[key][6] = "1";
			points[key][7] = "1"; // omit measure lines
		}
	}

	var new_points = points.map(function (x) { return x.join(","); });
	out.value = new_points.join("\n");
}

function sv_spam()
{
	var start = getElementFloat("tx_spam_start");
	var end = getElementFloat("tx_spam_end");
	var interval = getElementFloat("tx_spam_interval");
	var bspc = 60000.0 / getElementFloat("tx_spam_bpm");
	var out = document.getElementById("ta_spam_output");

	var division_span = (end - start) / interval;

	var add_to_output = (time) => {
		out.value += time + "," + bspc + ",4,1,0,15,1,0" + "\n";
	}

	out.value = "";
	var lastTime = -1;
	for (var division = 0; division <= division_span; division++) {
		var time = start + division * interval;
		add_to_output(time);
		lastTime = time;
	}

	if (lastTime != end) {
		add_to_output(end);
	}
}