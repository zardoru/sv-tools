function Calculate2(r,p,n)
{
	return (r-n*p)/(1-p)
}

function sv_rateappearance()
{
	var ir = document.getElementById("ir").value;
	var dur = document.getElementById("dur").value;
	var isvc = document.getElementById("isvc").value;
	var out = Calculate2(ir, dur, isvc);
	document.getElementById("out").innerHTML = out;
}

// normalize bpm changes
function sv_normalize_bpm()
{
	var cnts = document.getElementById("tabp").value;
	var lines = cnts.split("\n");
	var bpm = document.getElementById("bpmnorm").value;
	var outobj = document.getElementById("tabpout");
	var dobpmout = document.getElementById("cb_dobpmout").checked;

	outobj.value = "";

	for (var i = 0; i < lines.length; i++)
	{
		var tpArray = lines[i].split(",");
		var Time = tpArray[0];
		var PointBPM = 60000 / tpArray[1];
		var NewRatio = bpm / PointBPM;

		if (tpArray[6] == "1")
		{
			if (dobpmout)
			outobj.value += lines[i] + "\n";

			outobj.value += Time + "," + -100 / NewRatio;
			for (var k = 2; k < 8; k++)
			{
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

function sv_remove()
{
	var cnts = document.getElementById("tabp").value;
	var lines = cnts.split("\n");
	var outobj = document.getElementById("tabpout");

	outobj.value = "";

	for (var i = 0; i < lines.length; i++)
	{
		var tpArray = lines[i].split(",");

		if (tpArray[6] == "1")
		{
			outobj.value += lines[i];
			outobj.value += "\n";
		}
	}

	outobj.select();
}

// Move SV changes by some time.
function sv_move()
{
	var cnts = document.getElementById("ta_addtime").value;
	var lines = cnts.split("\n");
	var out = document.getElementById("ta_addtime_res");

	out.value = "";

	for (var i = 0; i < lines.length; i++)
	{
		var tpArray = lines[i].split(",");
		tpArray[0] = (document.getElementById("ta_addtime_value").value|0) + (tpArray[0]|0);
		out.value += tpArray.join(",");
		out.value += "\n";
	}

	out.select();
}

// Move from SV1 to SV2 in time with maybe easing
function sv_speedflow()
{
	var startSV = Number(document.getElementById("tx_startsv").value);
	var endSV = Number(document.getElementById("tx_endsv").value);
	var startTime = document.getElementById("tx_starttime").value;
	var endTime = document.getElementById("tx_endtime").value;
	var steps = Number(document.getElementById("tx_steps").value);
	var quadratic = document.getElementById("cb_quadratic").checked;
	var out = document.getElementById("ta_speedupsout");

	out.value = "";

	// Now to what we use.
	var timestep = (endTime - startTime) / steps;
	var svDelta = Number(endSV - startSV);

	for (var i = 0; i <= steps; i++)
	{
		var svValue;
		var timeValue;

		if (quadratic)
		{
			var squareI = Math.pow(i / steps, 2);
			svValue = startSV + squareI * svDelta;
		}else {
			svValue = startSV + svDelta * i / steps;
		}

		var realValue = -100 / svValue;

		timeValue = Number(startTime) + timestep * i;
		out.value += timeValue + "," + realValue + ",4,1,0,15,0,0\n";
	}

	out.select();
}

// Arbitrary SV function.
function sv_fx()
{
	var start = parseInt(document.getElementById("tx_effect_start").value);
	var time_per_cycle = parseInt(document.getElementById("tx_effect_dur").value);
	var divisions_per_cycle = parseInt(document.getElementById("tx_effect_divisions_per_cycle").value);
	var cycle_cnt = parseInt(document.getElementById("tx_effect_cycles").value);
	var effect = eval(document.getElementById("ta_effect").value);
	var effects = [];
	var last_sv = -1;
	var notif = document.getElementById("lbl_notif");

	if (typeof effect != 'function') {
		notif.innerHTML = "Error: Function is not callable.";
		return;
	}else
	notif.innerHTML = "";

	for (var cycle = 0; cycle < cycle_cnt; cycle++) {
		for (var division = 0; division < divisions_per_cycle; division++) {
			var division_lerp = division / divisions_per_cycle;
			var effvalue = effect(division_lerp);
			var sv_time = Math.round(start + time_per_cycle * cycle + division_lerp * time_per_cycle);
			var new_sv = -100.0 / (Math.round(effvalue * 100) / 100)

			if (effvalue < 0.1 || effvalue > 10)
				continue;

			if (new_sv != last_sv) {
				effects.push(sv_time + "," + new_sv + ",4,1,0,15,0,0");
				last_sv = new_sv;
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

	points.sort(function(a, b) {
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
			var sv_value = -100 / parseFloat(points[key][1]);
			var parent_bpm = 60000 / parseFloat(points[ip_parents[key]][1]);
			var new_bpm = parent_bpm * sv_value;
			points[key][1] = 60000 / new_bpm;
			points[key][6] = "1";
			points[key][7] = "1"; // omit measure lines
		}
	}

	var new_points = points.map(function(x) { return x.join(","); });
	out.value = new_points.join("\n");
}

function sv_reverse()
{
	// tbd
}
