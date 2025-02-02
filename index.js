var sanitizer = require('sanitizer');
var map = require('dank-map');
var each = require('dank-each');


module.exports = function objectToXML(obj, namespace, depth) {
	var xml = [];
	depth = depth || 0;
	
	each(obj, function (key, value) {
		var attributes = '';
		
		if (key === '@') {
			return;
		}
		
		if (key === '_namespace_') {
			return;
		}
		if (value && (value.hasOwnProperty('@') || value.hasOwnProperty('#'))) {
			attributes = map(value['@'], function (key, value) {
				if (value && value.constructor.name == 'Date') {
					return key + '="' + fixupDate(value) + '"';
				}
				else if (value || value === 0) {
					return key + '="' + sanitizer.escape(value) + '"';
				}
			}, true).join(' ');
			
			if (value['#']) {
				value = value['#'];
			}
			else if (Object.keys(value).length === 1 && value.hasOwnProperty('@')) {
				//if the only property this object has is '@', then set value to null
				//so it will generate <key prop="" prop2="" />
				value = null;
			}
		}
		
		if (Array.isArray(value)) {
			each(value, function (ix, value) {
				var tmp = {};
				
				tmp[key] = value;
				
				xml.push(objectToXML(tmp, namespace, depth));
			});
		}
		else if (value === null || value === undefined) {
			for (var x = 0; x < depth; x++) {
				xml.push('  ');
			}
		
			xml.push('<' + ((namespace) ? namespace + ':' : '') + key + ((attributes) ? ' ' + attributes : ''))
			
			//check to see if key is a ?something?
			if (/^\?.*\?$/.test(key)) {
				xml.push('>\n');
			}
			else {
				xml.push(' />\n');
			}
		}
		else {
			for (var x = 0; x < depth; x++) {
				xml.push('  ');
			}
			
			xml.push('<' + ((namespace) ? namespace + ':' : '') + key + ((attributes) ? ' ' + attributes : '') + '>')
			
			if (value && value.constructor.name == 'Date') {
				xml.push(fixupDate(value));
			}
			else if (typeof (value) == 'object') {
				xml.push('\n');
				xml.push(objectToXML(value,value._namespace_? value._namespace_ : namespace, depth + 1));
				
				for (var x = 0; x < depth; x++) {
					xml.push('  ');
				}
			}
			else {
				if (value && typeof(value) == 'string') {
					//avoid sanitizing CDATA sections.
					if (value.substr(0,9) !== '<![CDATA[' && value.substr(-3) !== ']]>') {
						value = sanitizer.escape(value);
					}
				}
				
				xml.push(value);
			}
			
			xml.push('</' + ((namespace) ? namespace + ':' : '') + key.split(/\ /)[0] + '>\n')
		}
	});
	
	return xml.join('');
}

function fixupDate(date) {
	var newDate = new Date(date).toISOString();
	//strip off the milisecconds and the Z
	return newDate.substr(0, newDate.length -5);
}
